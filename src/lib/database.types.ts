export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          recipient_id: string
          audio_url: string
          transcript: string | null
          duration_seconds: number | null
          listened: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          audio_url: string
          transcript?: string | null
          duration_seconds?: number | null
          listened?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          audio_url?: string
          transcript?: string | null
          duration_seconds?: number | null
          listened?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
