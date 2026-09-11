import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type {
  ServiceHealth,
  UserDTO,
  AuthSessionDTO,
} from '@healthathon/shared';

class SupabaseService {
  private anonClient: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      this.anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.isConfigured = true;
    }

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      this.adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  /**
   * Default client respects PostgreSQL Row Level Security (RLS)
   */
  public getClient(): SupabaseClient | null {
    return this.anonClient || this.adminClient;
  }

  /**
   * Admin client for internal background operations only
   */
  public getAdminClient(): SupabaseClient | null {
    return this.adminClient || this.anonClient;
  }

  public hasCredentials(): boolean {
    return this.isConfigured;
  }

  /**
   * Strict validation to prevent Open Redirect vulnerabilities
   */
  public validateRedirectUrl(url?: string, defaultPath: string = '/reset-password'): string {
    const fallback = `${env.CLIENT_URL.replace(/\/+$/, '')}${defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`}`;
    if (!url) return fallback;

    try {
      const parsed = new URL(url);
      const allowedOrigin = new URL(env.CLIENT_URL).origin;
      const localhostOrigin = 'http://localhost:5173';

      if (parsed.origin === allowedOrigin || parsed.origin === localhostOrigin || parsed.origin.endsWith('.vercel.app')) {
        return url;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  public async checkHealth(): Promise<ServiceHealth> {
    const client = this.getClient();
    if (!this.isConfigured || !client) {
      return {
        status: 'not_configured',
        message: 'Supabase credentials not configured in environment variables (SUPABASE_URL / SUPABASE_ANON_KEY)',
      };
    }

    const start = Date.now();
    try {
      const { error } = await client
        .from('jkn_regulations')
        .select('id')
        .limit(1);
      const latencyMs = Date.now() - start;

      if (error && error.code !== 'PGRST116') {
        return {
          status: 'degraded',
          message: error.message,
          latencyMs,
        };
      }

      return {
        status: 'healthy',
        message: 'Connected to Supabase database successfully',
        latencyMs,
      };
    } catch (err) {
      return {
        status: 'unreachable',
        message: err instanceof Error ? err.message : 'Failed to reach Supabase',
        latencyMs: Date.now() - start,
      };
    }
  }

  private mapUser(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email ?? '',
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      role: user.role,
      avatarUrl: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
    };
  }

  public async signInWithPassword(email: string, password: string): Promise<AuthSessionDTO> {
    const client = this.getClient();
    if (!client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw AppError.badRequest(error?.message || 'Failed to sign in');
    }

    return {
      user: this.mapUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  public async signUp(email: string, password: string, fullName?: string): Promise<{ user: UserDTO; message: string }> {
    const client = this.getClient();
    if (!client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (error || !data.user) {
      throw AppError.badRequest(error?.message || 'Failed to create account');
    }

    return {
      user: this.mapUser(data.user),
      message: 'Account created successfully. Please check your email for confirmation if required.',
    };
  }

  public async resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ message: string }> {
    const client = this.getClient();
    if (!client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const safeRedirect = this.validateRedirectUrl(redirectTo, '/reset-password');
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: safeRedirect,
    });

    if (error) {
      throw AppError.badRequest(error.message);
    }

    return {
      message: 'Password reset link has been sent to your email address.',
    };
  }

  public async getOAuthSignInUrl(provider: 'google', redirectTo?: string): Promise<{ url: string }> {
    const client = this.getClient();
    if (!client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const safeRedirect = this.validateRedirectUrl(redirectTo, '/');
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: safeRedirect,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      throw AppError.badRequest(error?.message || 'Failed to generate OAuth URL');
    }

    return {
      url: data.url,
    };
  }

  public async getUserFromToken(token: string): Promise<UserDTO | null> {
    const client = this.getClient();
    if (!client) return null;

    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return null;

    return this.mapUser(user);
  }
}

export const supabaseService = new SupabaseService();
