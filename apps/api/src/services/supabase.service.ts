import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type {
  ServiceHealth,
  UserDTO,
  AuthSessionDTO,
} from '@healthathon/shared';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
      const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
      this.client = createClient(env.SUPABASE_URL, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.isConfigured = true;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public hasCredentials(): boolean {
    return this.isConfigured;
  }

  public async checkHealth(): Promise<ServiceHealth> {
    if (!this.isConfigured || !this.client) {
      return {
        status: 'not_configured',
        message: 'Supabase credentials not configured in environment variables (SUPABASE_URL / SUPABASE_ANON_KEY)',
      };
    }

    const start = Date.now();
    try {
      const { error } = await this.client.auth.getSession();
      const latencyMs = Date.now() - start;

      if (error) {
        return {
          status: 'degraded',
          message: error.message,
          latencyMs,
        };
      }

      return {
        status: 'healthy',
        message: 'Connected to Supabase successfully',
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
    if (!this.client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const { data, error } = await this.client.auth.signInWithPassword({
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
    if (!this.client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const { data, error } = await this.client.auth.signUp({
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
    if (!this.client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const redirect = redirectTo || `${env.CLIENT_URL}/reset-password`;
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: redirect,
    });

    if (error) {
      throw AppError.badRequest(error.message);
    }

    return {
      message: 'Password reset link has been sent to your email address.',
    };
  }

  public async getOAuthSignInUrl(provider: 'google', redirectTo?: string): Promise<{ url: string }> {
    if (!this.client) {
      throw AppError.internal('Supabase client is not configured');
    }

    const redirect = redirectTo || env.CLIENT_URL;
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirect,
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
    if (!this.client) return null;

    const { data: { user }, error } = await this.client.auth.getUser(token);
    if (error || !user) return null;

    return this.mapUser(user);
  }
}

export const supabaseService = new SupabaseService();
