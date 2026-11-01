export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      blessings: {
        Row: {
          created_at: string
          id: string
          kind: string
          seed_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          seed_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          seed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blessings_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          body: string
          context: Json
          created_at: string
          id: string
          kind: string
          sent_at: string | null
          shots: string[]
          user_id: string
        }
        Insert: {
          body: string
          context?: Json
          created_at?: string
          id?: string
          kind?: string
          sent_at?: string | null
          shots?: string[]
          user_id: string
        }
        Update: {
          body?: string
          context?: Json
          created_at?: string
          id?: string
          kind?: string
          sent_at?: string | null
          shots?: string[]
          user_id?: string
        }
        Relationships: []
      }
      build_mail: {
        Row: {
          created_at: string
          enabled: boolean
          lang: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          lang?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          lang?: string
          user_id?: string
        }
        Relationships: []
      }
      charters: {
        Row: {
          created_at: string
          id: string
          path: string
          seed_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          seed_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          seed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charters_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: true
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          realm: string
          recipient_id: string | null
          sender_id: string
          sender_seed: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          realm: string
          recipient_id?: string | null
          sender_id: string
          sender_seed: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          realm?: string
          recipient_id?: string | null
          sender_id?: string
          sender_seed?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_seed_fkey"
            columns: ["sender_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reads: {
        Row: {
          channel: string
          seen_at: string
          user_id: string
        }
        Insert: {
          channel: string
          seen_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chest_mail: {
        Row: {
          enabled: boolean
          lang: string
          last_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          lang?: string
          last_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          lang?: string
          last_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encounters: {
        Row: {
          choice: string
          cost: number
          created_at: string
          event: string
          id: string
          seed_id: string
          user_id: string
        }
        Insert: {
          choice: string
          cost?: number
          created_at?: string
          event: string
          id?: string
          seed_id: string
          user_id: string
        }
        Update: {
          choice?: string
          cost?: number
          created_at?: string
          event?: string
          id?: string
          seed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounters_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      first_roads: {
        Row: {
          created_at: string
          id: string
          seed_id: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seed_id: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seed_id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "first_roads_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "first_roads_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_reads: {
        Row: {
          gift_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          gift_id: string
          read_at?: string
          user_id?: string
        }
        Update: {
          gift_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_reads_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          amount: number
          created_at: string
          from_seed: string
          id: string
          kind: string
          note: number
          to_seed: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          from_seed: string
          id?: string
          kind: string
          note?: number
          to_seed: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_seed?: string
          id?: string
          kind?: string
          note?: number
          to_seed?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_from_seed_fkey"
            columns: ["from_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_to_seed_fkey"
            columns: ["to_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      knighthoods: {
        Row: {
          created_at: string
          seed_id: string
        }
        Insert: {
          created_at?: string
          seed_id: string
        }
        Update: {
          created_at?: string
          seed_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knighthoods_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: true
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_bodies: {
        Row: {
          body: string
          letter_id: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          letter_id: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          letter_id?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_bodies_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: true
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          created_at: string
          from_seed: string
          id: string
          to_seed: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_seed: string
          id?: string
          to_seed: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_seed?: string
          id?: string
          to_seed?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_from_seed_fkey"
            columns: ["from_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_to_seed_fkey"
            columns: ["to_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sales: {
        Row: {
          created_at: string
          day: string
          id: string
          reward: number
          seed_id: string
          small: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          reward?: number
          seed_id: string
          small?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          reward?: number
          seed_id?: string
          small?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_sales_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      plantings: {
        Row: {
          created_at: string
          id: string
          kind: string
          seed_id: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          seed_id: string
          x: number
          y: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          seed_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "plantings_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      princely_tasks: {
        Row: {
          accepted_at: string
          done_at: string | null
          id: string
          reward: number
          seed_id: string
          step: number
          swapped_at: string | null
          task: string
        }
        Insert: {
          accepted_at?: string
          done_at?: string | null
          id?: string
          reward?: number
          seed_id: string
          step: number
          swapped_at?: string | null
          task: string
        }
        Update: {
          accepted_at?: string
          done_at?: string | null
          id?: string
          reward?: number
          seed_id?: string
          step?: number
          swapped_at?: string | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "princely_tasks_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          cost: number
          created_at: string
          id: string
          item: string
          seed_id: string
          user_id: string
          x: number | null
          y: number | null
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          item: string
          seed_id: string
          user_id: string
          x?: number | null
          y?: number | null
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          item?: string
          seed_id?: string
          user_id?: string
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_claims: {
        Row: {
          created_at: string
          id: string
          quest: string
          reward: number
          seed_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quest: string
          reward?: number
          seed_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quest?: string
          reward?: number
          seed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_claims_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_seed: string
          referee_user: string
          referrer_seed: string
          reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          referee_seed: string
          referee_user: string
          referrer_seed: string
          reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          referee_seed?: string
          referee_user?: string
          referrer_seed?: string
          reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_seed_fkey"
            columns: ["referee_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_seed_fkey"
            columns: ["referrer_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      seeds: {
        Row: {
          created_at: string
          hue: number
          id: string
          mayor_age: number | null
          mayor_gender: string | null
          mayor_traits: string[] | null
          name: string
          owner: string
          realm: string
          user_id: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          hue?: number
          id?: string
          mayor_age?: number | null
          mayor_gender?: string | null
          mayor_traits?: string[] | null
          name: string
          owner: string
          realm?: string
          user_id?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string
          hue?: number
          id?: string
          mayor_age?: number | null
          mayor_gender?: string | null
          mayor_traits?: string[] | null
          name?: string
          owner?: string
          realm?: string
          user_id?: string | null
          x?: number
          y?: number
        }
        Relationships: []
      }
      signposts: {
        Row: {
          created_at: string
          id: string
          message: string
          seed_id: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          seed_id: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          seed_id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signposts_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signposts_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_rewards: {
        Row: {
          amount_cents: number
          created_at: string
          environment: string
          id: string
          reward: string
          seed_id: string
          stripe_session_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          environment?: string
          id?: string
          reward: string
          seed_id: string
          stripe_session_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          environment?: string
          id?: string
          reward?: string
          seed_id?: string
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporter_rewards_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_cutover: {
        Row: {
          at: string
          singleton: boolean
        }
        Insert: {
          at?: string
          singleton?: boolean
        }
        Update: {
          at?: string
          singleton?: boolean
        }
        Relationships: []
      }
      tax_receipts: {
        Row: {
          assessed_at: string
          day: number
          households: number
          income: number
          population: number
          seed_id: string
          version: number
        }
        Insert: {
          assessed_at: string
          day: number
          households: number
          income: number
          population: number
          seed_id: string
          version?: number
        }
        Update: {
          assessed_at?: string
          day?: number
          households?: number
          income?: number
          population?: number
          seed_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_receipts_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      twin_votes: {
        Row: {
          created_at: string
          id: string
          pact: string
          partner_id: string
          seed_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pact: string
          partner_id: string
          seed_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pact?: string
          partner_id?: string
          seed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "twin_votes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twin_votes_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      twin_works: {
        Row: {
          cost: number
          created_at: string
          id: string
          partner_id: string
          seed_id: string
          user_id: string
          work: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          partner_id: string
          seed_id: string
          user_id: string
          work: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          partner_id?: string
          seed_id?: string
          user_id?: string
          work?: string
        }
        Relationships: [
          {
            foreignKeyName: "twin_works_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twin_works_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          lang: string
          last_active_at: string
          user_id: string
          warning_sent_at: string | null
        }
        Insert: {
          lang?: string
          last_active_at?: string
          user_id: string
          warning_sent_at?: string | null
        }
        Update: {
          lang?: string
          last_active_at?: string
          user_id?: string
          warning_sent_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      village_visits: {
        Row: {
          created_at: string
          id: string
          reward: number
          visited_seed: string
          visitor_seed: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward?: number
          visited_seed: string
          visitor_seed: string
        }
        Update: {
          created_at?: string
          id?: string
          reward?: number
          visited_seed?: string
          visitor_seed?: string
        }
        Relationships: [
          {
            foreignKeyName: "village_visits_visited_seed_fkey"
            columns: ["visited_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "village_visits_visitor_seed_fkey"
            columns: ["visitor_seed"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      wonder_finds: {
        Row: {
          created_at: string
          first: boolean
          id: string
          realm: string
          reward: number
          seed_id: string
          site: string
        }
        Insert: {
          created_at?: string
          first?: boolean
          id?: string
          realm: string
          reward?: number
          seed_id: string
          site: string
        }
        Update: {
          created_at?: string
          first?: boolean
          id?: string
          realm?: string
          reward?: number
          seed_id?: string
          site?: string
        }
        Relationships: [
          {
            foreignKeyName: "wonder_finds_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "seeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wonder_finds_site_fkey"
            columns: ["site"]
            isOneToOne: false
            referencedRelation: "wonder_sites"
            referencedColumns: ["key"]
          },
        ]
      }
      wonder_sites: {
        Row: {
          key: string
          kind: string
          x: number
          y: number
        }
        Insert: {
          key: string
          kind: string
          x: number
          y: number
        }
        Update: {
          key?: string
          kind?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abandon_village: { Args: { _seed: string }; Returns: undefined }
      charter_tax: {
        Args: { _at: string; _charter: string; _created: string }
        Returns: number
      }
      claim_referral: { Args: { _ref: string; _seed: string }; Returns: number }
      claim_visit: {
        Args: { _seed: string; _visited: string }
        Returns: number
      }
      claim_wonder: { Args: { _seed: string; _site: string }; Returns: number }
      estate_assessment: {
        Args: { _pop: number; _wealth: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      princely_audience: { Args: { _seed: string }; Returns: string }
      princely_knight: { Args: { _seed: string }; Returns: string }
      princely_swap: { Args: { _seed: string }; Returns: string }
      princely_task_def: {
        Args: { _step: number }
        Returns: Record<string, unknown>
      }
      princely_task_met: {
        Args: { _seed: string; _since: string; _task: string }
        Returns: boolean
      }
      purge_user_data: { Args: { _uid: string }; Returns: undefined }
      road_done: { Args: { _a: string; _b: string }; Returns: string }
      send_letter: {
        Args: { _body: string; _from: string; _to: string }
        Returns: string
      }
      tax_receipt_start: { Args: never; Returns: string }
      touch_activity: { Args: { _lang?: string }; Returns: undefined }
      update_mayor: {
        Args: {
          _age: number
          _gender: string
          _owner: string
          _seed: string
          _traits: string[]
        }
        Returns: undefined
      }
      village_balance: { Args: { _seed: string }; Returns: number }
      village_capped_tax: {
        Args: { _at: string; _seed: string }
        Returns: number
      }
      village_civic_wealth: {
        Args: { _at: string; _seed: string }
        Returns: number
      }
      village_dowry: {
        Args: { _at: string; _created: string }
        Returns: number
      }
      village_estate_tax: {
        Args: { _at: string; _seed: string }
        Returns: number
      }
      village_estate_tax_legacy: {
        Args: { _at: string; _seed: string }
        Returns: number
      }
      village_raids: {
        Args: { _at: string; _created: string; _seed: string }
        Returns: number
      }
      village_tax: { Args: { _at: string; _created: string }; Returns: number }
      village_tax_pop: {
        Args: { _at: string; _h: number; _seed: string }
        Returns: number
      }
      village_weddings: {
        Args: { _at: string; _seed: string }
        Returns: {
          dowry: number
          last_at: string
          n: number
        }[]
      }
      visit_reward: { Args: { _age_hours: number }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
