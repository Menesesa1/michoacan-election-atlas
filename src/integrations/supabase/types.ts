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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alertas_crisis: {
        Row: {
          batch_id: string
          created_at: string
          descripcion: string
          detectada_en: string
          distrito: string
          fuente: string
          id: string
          prioridad: string
          timestamp: string
          titulo: string
          url_fuente: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          descripcion: string
          detectada_en?: string
          distrito?: string
          fuente: string
          id?: string
          prioridad: string
          timestamp?: string
          titulo: string
          url_fuente?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          descripcion?: string
          detectada_en?: string
          distrito?: string
          fuente?: string
          id?: string
          prioridad?: string
          timestamp?: string
          titulo?: string
          url_fuente?: string | null
        }
        Relationships: []
      }
      alertas_crisis_runs: {
        Row: {
          duracion_ms: number | null
          ejecutada_en: string
          error: string | null
          fuentes_consultadas: number
          id: string
          informativas: number
          preventivas: number
          total_alertas: number
          trigger: string
          urgentes: number
        }
        Insert: {
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          fuentes_consultadas?: number
          id?: string
          informativas?: number
          preventivas?: number
          total_alertas?: number
          trigger?: string
          urgentes?: number
        }
        Update: {
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          fuentes_consultadas?: number
          id?: string
          informativas?: number
          preventivas?: number
          total_alertas?: number
          trigger?: string
          urgentes?: number
        }
        Relationships: []
      }
      candidato_analisis: {
        Row: {
          candidato_id: string
          created_at: string
          id: string
          model: string
          output_json: Json
          tipo: string
          user_id: string
        }
        Insert: {
          candidato_id: string
          created_at?: string
          id?: string
          model?: string
          output_json: Json
          tipo: string
          user_id: string
        }
        Update: {
          candidato_id?: string
          created_at?: string
          id?: string
          model?: string
          output_json?: Json
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidato_analisis_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          bio_breve: string | null
          cargo_buscado: string | null
          created_at: string
          es_propio: boolean
          fase: string
          foto_url: string | null
          id: string
          metricas_redes: Json
          nivel: string
          nombre: string
          notas: string | null
          partido: string
          redes: Json | null
          tags: string[] | null
          territorio: string
          trayectoria: Json
          updated_at: string
          user_id: string
          war_room: Json
        }
        Insert: {
          bio_breve?: string | null
          cargo_buscado?: string | null
          created_at?: string
          es_propio?: boolean
          fase?: string
          foto_url?: string | null
          id?: string
          metricas_redes?: Json
          nivel: string
          nombre: string
          notas?: string | null
          partido: string
          redes?: Json | null
          tags?: string[] | null
          territorio: string
          trayectoria?: Json
          updated_at?: string
          user_id: string
          war_room?: Json
        }
        Update: {
          bio_breve?: string | null
          cargo_buscado?: string | null
          created_at?: string
          es_propio?: boolean
          fase?: string
          foto_url?: string | null
          id?: string
          metricas_redes?: Json
          nivel?: string
          nombre?: string
          notas?: string | null
          partido?: string
          redes?: Json | null
          tags?: string[] | null
          territorio?: string
          trayectoria?: Json
          updated_at?: string
          user_id?: string
          war_room?: Json
        }
        Relationships: []
      }
      estrategias_guardadas: {
        Row: {
          created_at: string
          id: string
          nivel: string
          output_json: Json
          snapshot_json: Json
          territorio: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel: string
          output_json: Json
          snapshot_json: Json
          territorio: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel?: string
          output_json?: Json
          snapshot_json?: Json
          territorio?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
