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
      activites: {
        Row: {
          active: boolean
          cooldown_minutes: number | null
          created_at: string
          description: string | null
          id: string
          nom: string
          points_argent: number
          points_bronze: number
          points_dessin_fixe: number
          points_enigme_avec_indice: number
          points_enigme_sans_indice: number
          points_or: number
          points_participation: number
          points_supervisee_bonus: number
          repetable: boolean
          station_id: string
          type: Database["public"]["Enums"]["activite_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          cooldown_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          points_argent?: number
          points_bronze?: number
          points_dessin_fixe?: number
          points_enigme_avec_indice?: number
          points_enigme_sans_indice?: number
          points_or?: number
          points_participation?: number
          points_supervisee_bonus?: number
          repetable?: boolean
          station_id: string
          type?: Database["public"]["Enums"]["activite_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          cooldown_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          points_argent?: number
          points_bronze?: number
          points_dessin_fixe?: number
          points_enigme_avec_indice?: number
          points_enigme_sans_indice?: number
          points_or?: number
          points_participation?: number
          points_supervisee_bonus?: number
          repetable?: boolean
          station_id?: string
          type?: Database["public"]["Enums"]["activite_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activites_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      centres: {
        Row: {
          active: boolean
          code_qr: string
          created_at: string
          id: string
          nom: string
          profil: Database["public"]["Enums"]["centre_profil"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code_qr: string
          created_at?: string
          id?: string
          nom: string
          profil?: Database["public"]["Enums"]["centre_profil"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code_qr?: string
          created_at?: string
          id?: string
          nom?: string
          profil?: Database["public"]["Enums"]["centre_profil"]
          updated_at?: string
        }
        Relationships: []
      }
      enigmes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          indice: string | null
          question: string
          reponse_correcte: string
          station_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          indice?: string | null
          question: string
          reponse_correcte: string
          station_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          indice?: string | null
          question?: string
          reponse_correcte?: string
          station_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enigmes_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      facilitateur_postes: {
        Row: {
          active: boolean
          code_pin: string | null
          facilitateur_id: string
          fin_poste_at: string | null
          id: string
          prise_poste_at: string
          station_id: string | null
        }
        Insert: {
          active?: boolean
          code_pin?: string | null
          facilitateur_id: string
          fin_poste_at?: string | null
          id?: string
          prise_poste_at?: string
          station_id?: string | null
        }
        Update: {
          active?: boolean
          code_pin?: string | null
          facilitateur_id?: string
          fin_poste_at?: string | null
          id?: string
          prise_poste_at?: string
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilitateur_postes_facilitateur_id_fkey"
            columns: ["facilitateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilitateur_postes_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      groupes: {
        Row: {
          active: boolean
          animal: Database["public"]["Enums"]["groupe_animal"]
          centre_id: string
          created_at: string
          id: string
          nb_participants: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          animal: Database["public"]["Enums"]["groupe_animal"]
          centre_id: string
          created_at?: string
          id?: string
          nb_participants?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          animal?: Database["public"]["Enums"]["groupe_animal"]
          centre_id?: string
          created_at?: string
          id?: string
          nb_participants?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupes_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          centre_id: string | null
          created_at: string
          id: string
          nom: string
          prenom: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          centre_id?: string | null
          created_at?: string
          id: string
          nom: string
          prenom: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          centre_id?: string | null
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_centre"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          activite_id: string
          centre_id: string
          created_at: string
          date_record: string
          description: string | null
          groupe_id: string
          id: string
          unite: string | null
          updated_at: string
          valeur: number | null
        }
        Insert: {
          activite_id: string
          centre_id: string
          created_at?: string
          date_record?: string
          description?: string | null
          groupe_id: string
          id?: string
          unite?: string | null
          updated_at?: string
          valeur?: number | null
        }
        Update: {
          activite_id?: string
          centre_id?: string
          created_at?: string
          date_record?: string
          description?: string | null
          groupe_id?: string
          id?: string
          unite?: string | null
          updated_at?: string
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "records_activite_id_fkey"
            columns: ["activite_id"]
            isOneToOne: false
            referencedRelation: "activites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_groupe_id_fkey"
            columns: ["groupe_id"]
            isOneToOne: false
            referencedRelation: "groupes"
            referencedColumns: ["id"]
          },
        ]
      }
      station_occupations: {
        Row: {
          auto_release_at: string | null
          created_at: string
          debut_occupation: string | null
          facilitateur_id: string | null
          fin_occupation: string | null
          groupe_id: string | null
          id: string
          station_id: string
          status: Database["public"]["Enums"]["station_status"]
          updated_at: string
        }
        Insert: {
          auto_release_at?: string | null
          created_at?: string
          debut_occupation?: string | null
          facilitateur_id?: string | null
          fin_occupation?: string | null
          groupe_id?: string | null
          id?: string
          station_id: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Update: {
          auto_release_at?: string | null
          created_at?: string
          debut_occupation?: string | null
          facilitateur_id?: string | null
          fin_occupation?: string | null
          groupe_id?: string | null
          id?: string
          station_id?: string
          status?: Database["public"]["Enums"]["station_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_occupations_facilitateur_id_fkey"
            columns: ["facilitateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_occupations_groupe_id_fkey"
            columns: ["groupe_id"]
            isOneToOne: false
            referencedRelation: "groupes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_occupations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          active: boolean
          categorie: string | null
          code_qr: string
          created_at: string
          description: string | null
          id: string
          nom: string
          type: Database["public"]["Enums"]["station_type"]
          updated_at: string
          zone: string | null
        }
        Insert: {
          active?: boolean
          categorie?: string | null
          code_qr: string
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          type?: Database["public"]["Enums"]["station_type"]
          updated_at?: string
          zone?: string | null
        }
        Update: {
          active?: boolean
          categorie?: string | null
          code_qr?: string
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          type?: Database["public"]["Enums"]["station_type"]
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      tentatives: {
        Row: {
          activite_id: string | null
          ad_hoc_points: number | null
          co_validee: boolean
          commentaire: string | null
          created_at: string
          enigme_id: string | null
          facilitateur_id: string | null
          groupe_id: string
          id: string
          indice_utilise: boolean
          niveau_perf: Database["public"]["Enums"]["perf_niveau"] | null
          points_obtenus: number
          reponse_enigme: string | null
          type: Database["public"]["Enums"]["activite_type"]
        }
        Insert: {
          activite_id?: string | null
          ad_hoc_points?: number | null
          co_validee?: boolean
          commentaire?: string | null
          created_at?: string
          enigme_id?: string | null
          facilitateur_id?: string | null
          groupe_id: string
          id?: string
          indice_utilise?: boolean
          niveau_perf?: Database["public"]["Enums"]["perf_niveau"] | null
          points_obtenus?: number
          reponse_enigme?: string | null
          type: Database["public"]["Enums"]["activite_type"]
        }
        Update: {
          activite_id?: string | null
          ad_hoc_points?: number | null
          co_validee?: boolean
          commentaire?: string | null
          created_at?: string
          enigme_id?: string | null
          facilitateur_id?: string | null
          groupe_id?: string
          id?: string
          indice_utilise?: boolean
          niveau_perf?: Database["public"]["Enums"]["perf_niveau"] | null
          points_obtenus?: number
          reponse_enigme?: string | null
          type?: Database["public"]["Enums"]["activite_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tentatives_activite_id_fkey"
            columns: ["activite_id"]
            isOneToOne: false
            referencedRelation: "activites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tentatives_enigme_id_fkey"
            columns: ["enigme_id"]
            isOneToOne: false
            referencedRelation: "enigmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tentatives_facilitateur_id_fkey"
            columns: ["facilitateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tentatives_groupe_id_fkey"
            columns: ["groupe_id"]
            isOneToOne: false
            referencedRelation: "groupes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculer_points_tentative: {
        Args: {
          p_activite_id: string
          p_ad_hoc_points: number
          p_centre_profil: Database["public"]["Enums"]["centre_profil"]
          p_co_validee: boolean
          p_indice_utilise: boolean
          p_niveau_perf: Database["public"]["Enums"]["perf_niveau"]
          p_type: Database["public"]["Enums"]["activite_type"]
        }
        Returns: number
      }
    }
    Enums: {
      activite_type: "activite" | "enigme" | "dessin_manuel" | "ponctuelle_tech"
      app_role: "admin" | "rev" | "facilitateur" | "animateur"
      centre_profil: "maternelle" | "elementaire"
      groupe_animal: "dauphins" | "tortues" | "requins"
      perf_niveau: "participation" | "bronze" | "argent" | "or"
      station_status: "libre" | "occupee" | "fermee"
      station_type: "autonome" | "supervisee"
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
      activite_type: ["activite", "enigme", "dessin_manuel", "ponctuelle_tech"],
      app_role: ["admin", "rev", "facilitateur", "animateur"],
      centre_profil: ["maternelle", "elementaire"],
      groupe_animal: ["dauphins", "tortues", "requins"],
      perf_niveau: ["participation", "bronze", "argent", "or"],
      station_status: ["libre", "occupee", "fermee"],
      station_type: ["autonome", "supervisee"],
    },
  },
} as const
