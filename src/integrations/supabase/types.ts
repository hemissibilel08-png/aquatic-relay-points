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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string
          default_points: number | null
          description: string | null
          family: Database["public"]["Enums"]["activity_family"]
          id: string
          is_active: boolean
          name: string
          repeatable: boolean
          requires_facilitator: boolean
          thresholds_elem: Json | null
          thresholds_mat: Json | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_points?: number | null
          description?: string | null
          family?: Database["public"]["Enums"]["activity_family"]
          id?: string
          is_active?: boolean
          name: string
          repeatable?: boolean
          requires_facilitator?: boolean
          thresholds_elem?: Json | null
          thresholds_mat?: Json | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_points?: number | null
          description?: string | null
          family?: Database["public"]["Enums"]["activity_family"]
          id?: string
          is_active?: boolean
          name?: string
          repeatable?: boolean
          requires_facilitator?: boolean
          thresholds_elem?: Json | null
          thresholds_mat?: Json | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      ad_hoc_points: {
        Row: {
          centre_id: string
          created_at: string
          event_id: string
          group_id: string | null
          id: string
          points: number
          reason: string
          staff_id: string | null
          station_id: string | null
          updated_at: string
        }
        Insert: {
          centre_id: string
          created_at?: string
          event_id: string
          group_id?: string | null
          id?: string
          points?: number
          reason: string
          staff_id?: string | null
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          centre_id?: string
          created_at?: string
          event_id?: string
          group_id?: string | null
          id?: string
          points?: number
          reason?: string
          staff_id?: string | null
          station_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_hoc_points_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_points_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_points_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_points_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "station"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt: {
        Row: {
          activity_id: string
          centre_id: string
          created_at: string
          ended_at: string | null
          event_id: string
          group_id: string | null
          id: string
          photo_url: string | null
          points: number
          raw_result: string | null
          started_at: string
          updated_at: string
          validated_by_staff_id: string | null
        }
        Insert: {
          activity_id: string
          centre_id: string
          created_at?: string
          ended_at?: string | null
          event_id: string
          group_id?: string | null
          id?: string
          photo_url?: string | null
          points?: number
          raw_result?: string | null
          started_at?: string
          updated_at?: string
          validated_by_staff_id?: string | null
        }
        Update: {
          activity_id?: string
          centre_id?: string
          created_at?: string
          ended_at?: string | null
          event_id?: string
          group_id?: string | null
          id?: string
          photo_url?: string | null
          points?: number
          raw_result?: string | null
          started_at?: string
          updated_at?: string
          validated_by_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_validated_by_staff_id_fkey"
            columns: ["validated_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      centre: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          profile: Database["public"]["Enums"]["profile_type"]
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          profile?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          profile?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Relationships: []
      }
      event: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          centre_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          updated_at: string
        }
        Insert: {
          centre_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          centre_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
        ]
      }
      occupation: {
        Row: {
          by_centre_id: string | null
          created_at: string
          id: string
          queue_centre_id: string | null
          since: string
          station_id: string
          status: Database["public"]["Enums"]["station_status"]
          updated_at: string
        }
        Insert: {
          by_centre_id?: string | null
          created_at?: string
          id?: string
          queue_centre_id?: string | null
          since?: string
          station_id: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Update: {
          by_centre_id?: string | null
          created_at?: string
          id?: string
          queue_centre_id?: string | null
          since?: string
          station_id?: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occupation_by_centre_id_fkey"
            columns: ["by_centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupation_queue_centre_id_fkey"
            columns: ["queue_centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupation_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "station"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          staff_id: string
          started_at: string
          station_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          staff_id: string
          started_at?: string
          station_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          staff_id?: string
          started_at?: string
          station_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presence_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "station"
            referencedColumns: ["id"]
          },
        ]
      }
      riddle: {
        Row: {
          created_at: string
          hint_malus_elem: number
          hint_malus_mat: number
          hint_text: string | null
          id: string
          is_active: boolean
          points_base: number
          question: string
          solution: string
          station_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hint_malus_elem?: number
          hint_malus_mat?: number
          hint_text?: string | null
          id?: string
          is_active?: boolean
          points_base?: number
          question: string
          solution: string
          station_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hint_malus_elem?: number
          hint_malus_mat?: number
          hint_text?: string | null
          id?: string
          is_active?: boolean
          points_base?: number
          question?: string
          solution?: string
          station_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riddle_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "station"
            referencedColumns: ["id"]
          },
        ]
      }
      riddle_answer: {
        Row: {
          answer_text: string
          centre_id: string
          correct: boolean
          created_at: string
          event_id: string
          group_id: string | null
          hint_used: boolean
          id: string
          points: number
          riddle_id: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          centre_id: string
          correct?: boolean
          created_at?: string
          event_id: string
          group_id?: string | null
          hint_used?: boolean
          id?: string
          points?: number
          riddle_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          centre_id?: string
          correct?: boolean
          created_at?: string
          event_id?: string
          group_id?: string | null
          hint_used?: boolean
          id?: string
          points?: number
          riddle_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riddle_answer_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riddle_answer_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riddle_answer_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riddle_answer_riddle_id_fkey"
            columns: ["riddle_id"]
            isOneToOne: false
            referencedRelation: "riddle"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      station: {
        Row: {
          activity_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          qr_code: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          qr_code: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          qr_code?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id"]
          },
        ]
      }
      zone: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          fallback_zone_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          fallback_zone_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          fallback_zone_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_fallback_zone_id_fkey"
            columns: ["fallback_zone_id"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_rain_mode: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_activity_points: {
        Args: {
          activity_family?: string
          activity_type: string
          attempt_count?: number
          centre_profile?: string
          hint_used?: boolean
          is_co_validated?: boolean
          raw_result?: string
          thresholds_elem?: Json
          thresholds_mat?: Json
        }
        Returns: Json
      }
      create_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      deactivate_rain_mode: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_staff_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      has_facilitator_on_station: {
        Args: { station_id_param: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_facilitateur: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      run_qa_tests: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      activity_family: "precision" | "lance" | "endurance" | "coop"
      activity_type: "autonomie" | "supervisee" | "tech"
      profile_type: "maternelle" | "elementaire"
      staff_role: "admin" | "facilitateur"
      station_status: "libre" | "occupee" | "fermee"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      activity_family: ["precision", "lance", "endurance", "coop"],
      activity_type: ["autonomie", "supervisee", "tech"],
      profile_type: ["maternelle", "elementaire"],
      staff_role: ["admin", "facilitateur"],
      station_status: ["libre", "occupee", "fermee"],
    },
  },
} as const
