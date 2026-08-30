import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  public client: SupabaseClient | null = null;
  public adminClient: SupabaseClient | null = null;
  private storageBucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const anonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;
    const serviceKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.storageBucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';

    if (supabaseUrl && !supabaseUrl.includes('your-project-ref')) {
      if (anonKey) {
        this.client = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false },
        });
      }
      if (serviceKey) {
        this.adminClient = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false },
        });
      } else {
        this.adminClient = this.client;
      }
      this.logger.log(`⚡ Supabase client initialized connected to: ${supabaseUrl}`);
    } else {
      this.logger.warn('Supabase URL or Key not set in environment. Running in local fallback mode.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Verify Supabase Auth JWT token
   */
  async verifySupabaseToken(token: string) {
    if (!this.client) {
      return null;
    }
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  /**
   * Upload image buffer to Supabase Storage bucket
   */
  async uploadProductImage(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.client) {
      // Local fallback mock URL
      return `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80`;
    }

    const filePath = `products/${Date.now()}_${filename}`;
    const { error } = await this.client.storage
      .from(this.storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase Storage upload error: ${error.message}`);
      throw error;
    }

    const { data } = this.client.storage.from(this.storageBucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
