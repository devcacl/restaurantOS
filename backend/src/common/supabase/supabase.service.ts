import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient | null = null;
  private storageBucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY');

    this.storageBucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-ref')) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      this.logger.log(`⚡ Supabase client initialized connected to: ${supabaseUrl}`);
    } else {
      this.logger.warn('Supabase URL or Key not set in environment. Running in local fallback mode.');
    }
  }

  getClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  /**
   * Verify Supabase Auth JWT token
   */
  async verifySupabaseToken(token: string) {
    if (!this.supabaseClient) {
      return null;
    }
    const { data, error } = await this.supabaseClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  /**
   * Upload image buffer to Supabase Storage bucket
   */
  async uploadProductImage(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.supabaseClient) {
      // Local fallback mock URL
      return `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80`;
    }

    const filePath = `products/${Date.now()}_${filename}`;
    const { error } = await this.supabaseClient.storage
      .from(this.storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase Storage upload error: ${error.message}`);
      throw error;
    }

    const { data } = this.supabaseClient.storage.from(this.storageBucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
}
