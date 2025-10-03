export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          id: number
          title: string
          content: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: number
          title: string
          content: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          content?: string
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: number
          content: string
          user_id: string
          created_at: string
          likes_count: number
          comments_count: number
        }
        Insert: {
          id?: number
          content: string
          user_id: string
          created_at?: string
          likes_count?: number
          comments_count?: number
        }
        Update: {
          id?: number
          content?: string
          user_id?: string
          created_at?: string
          likes_count?: number
          comments_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      weekly_rankings: {
        Row: {
          id: number
          user_id: string
          rank: number
          score: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          rank: number
          score: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          rank?: number
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_rankings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_weekly_ranking: {
        Args: Record<string, unknown>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']