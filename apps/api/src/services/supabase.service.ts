import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { isTrustedOrigin } from '../config/origins.js';
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
   * Default client respects PostgreSQL Row Level Security (RLS).
   * Never falls back to adminClient to prevent accidental RLS bypass.
   */
  public getClient(): SupabaseClient | null {
    return this.anonClient;
  }

  /**
   * Admin client for internal background / audit-logging operations only
   */
  public getAdminClient(): SupabaseClient | null {
    return this.adminClient || this.anonClient;
  }

  public hasCredentials(): boolean {
    return this.isConfigured;
  }

  /**
   * Strict validation to prevent Open Redirect / token-leak vulnerabilities.
   * Supabase appends access/refresh tokens to this URL, so it MUST be an origin we control.
   */
  public validateRedirectUrl(url?: string, defaultPath: string = '/reset-password'): string {
    const fallback = `${env.CLIENT_URL}${defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`}`;
    if (!url) return fallback;

    try {
      const parsed = new URL(url);
      if (parsed.username || parsed.password) return fallback;
      if (isTrustedOrigin(parsed.origin)) {
        return parsed.toString();
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
      role: user.app_metadata?.role ?? user.user_metadata?.role ?? user.role ?? 'auditor',
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
      const raw = (error?.message || '').toLowerCase();
      if (raw.includes('email not confirmed')) {
        throw AppError.badRequest('Email belum dikonfirmasi. Silakan cek kotak masuk email Anda.');
      }
      // Same message for unknown email & wrong password → no account enumeration
      throw AppError.unauthorized('Email atau password salah');
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
        emailRedirectTo: this.validateRedirectUrl(undefined, '/'),
      },
    });

    if (error || !data.user) {
      const raw = (error?.message || '').toLowerCase();
      if (raw.includes('password')) {
        // Password-policy feedback is safe and useful to show
        throw AppError.badRequest(error?.message || 'Password tidak memenuhi kebijakan keamanan');
      }
      throw AppError.badRequest(
        'Registrasi tidak dapat diproses. Jika email sudah terdaftar, silakan login atau gunakan fitur lupa password.'
      );
    }

    return {
      user: this.mapUser(data.user),
      message: 'Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi bila diperlukan.',
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
      // Log only; responding differently would reveal whether the address is registered
      console.warn('[SupabaseService] resetPasswordForEmail error:', error.message);
    }

    return {
      message: 'Jika email terdaftar, tautan reset password telah dikirim ke alamat tersebut.',
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
