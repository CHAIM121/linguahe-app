export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          xp: number
          level: number
          streak: number
          lessons_completed: number
          words_learned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak?: number
          lessons_completed?: number
          words_learned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak?: number
          lessons_completed?: number
          words_learned?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          title: string
          description: string | null
          topic_id: string | null
          difficulty: string
          xp_reward: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          topic_id?: string | null
          difficulty?: string
          xp_reward?: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          topic_id?: string | null
          difficulty?: string
          xp_reward?: number
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      words: {
        Row: {
          id: string
          lesson_id: string
          english: string
          hebrew: string
          transliteration: string | null
          example_sentence: string | null
          example_translation: string | null
          audio_url: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          english: string
          hebrew: string
          transliteration?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          audio_url?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          english?: string
          hebrew?: string
          transliteration?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          audio_url?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed: boolean
          score: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed?: boolean
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed?: boolean
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          name: string
          name_hebrew: string | null
          description: string | null
          icon: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_hebrew?: string | null
          description?: string | null
          icon?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_hebrew?: string | null
          description?: string | null
          icon?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      award_xp: {
        Args: { user_id: string; xp_amount: number }
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
