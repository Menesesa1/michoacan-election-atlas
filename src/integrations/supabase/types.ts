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
          batch_id: string | null
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
          batch_id?: string | null
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
          batch_id?: string | null
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
      social_menciones: {
        Row: {
          batch_id: string
          candidato_id: string | null
          created_at: string
          detectada_en: string
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento: string | null
          fuente: string | null
          hashtags: string[] | null
          id: string
          municipio: string | null
          publicada_en: string | null
          sentimiento: number
          tema: string | null
          titulo: string
          url: string | null
        }
        Insert: {
          batch_id: string
          candidato_id?: string | null
          created_at?: string
          detectada_en?: string
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento?: string | null
          fuente?: string | null
          hashtags?: string[] | null
          id?: string
          municipio?: string | null
          publicada_en?: string | null
          sentimiento: number
          tema?: string | null
          titulo: string
          url?: string | null
        }
        Update: {
          batch_id?: string
          candidato_id?: string | null
          created_at?: string
          detectada_en?: string
          entidad_nombre?: string
          entidad_tipo?: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento?: string | null
          fuente?: string | null
          hashtags?: string[] | null
          id?: string
          municipio?: string | null
          publicada_en?: string | null
          sentimiento?: number
          tema?: string | null
          titulo?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_menciones_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      social_resumen: {
        Row: {
          batch_id: string
          candidato_id: string | null
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          generado_en: string
          id: string
          pct_negativo: number | null
          pct_neutro: number | null
          pct_positivo: number | null
          sentimiento_promedio: number | null
          top_hashtags: Json | null
          top_temas: Json | null
          total_menciones: number
        }
        Insert: {
          batch_id: string
          candidato_id?: string | null
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          generado_en?: string
          id?: string
          pct_negativo?: number | null
          pct_neutro?: number | null
          pct_positivo?: number | null
          sentimiento_promedio?: number | null
          top_hashtags?: Json | null
          top_temas?: Json | null
          total_menciones?: number
        }
        Update: {
          batch_id?: string
          candidato_id?: string | null
          entidad_nombre?: string
          entidad_tipo?: Database["public"]["Enums"]["social_entidad_tipo"]
          generado_en?: string
          id?: string
          pct_negativo?: number | null
          pct_neutro?: number | null
          pct_positivo?: number | null
          sentimiento_promedio?: number | null
          top_hashtags?: Json | null
          top_temas?: Json | null
          total_menciones?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_resumen_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      social_runs: {
        Row: {
          batch_id: string
          duracion_ms: number | null
          ejecutada_en: string
          entidades_procesadas: number
          error: string | null
          id: string
          total_menciones: number
          trigger: string
          user_id: string | null
        }
        Insert: {
          batch_id: string
          duracion_ms?: number | null
          ejecutada_en?: string
          entidades_procesadas?: number
          error?: string | null
          id?: string
          total_menciones?: number
          trigger?: string
          user_id?: string | null
        }
        Update: {
          batch_id?: string
          duracion_ms?: number | null
          ejecutada_en?: string
          entidades_procesadas?: number
          error?: string | null
          id?: string
          total_menciones?: number
          trigger?: string
          user_id?: string | null
        }
        Relationships: []
      }
      solicitudes_acceso_anticipado: {
        Row: {
          cargo: string | null
          comentario: string | null
          created_at: string
          email: string
          id: string
          modulo: string
          nombre: string
          organizacion: string | null
          prioridad_percibida: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          comentario?: string | null
          created_at?: string
          email: string
          id?: string
          modulo: string
          nombre: string
          organizacion?: string | null
          prioridad_percibida?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          comentario?: string | null
          created_at?: string
          email?: string
          id?: string
          modulo?: string
          nombre?: string
          organizacion?: string | null
          prioridad_percibida?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trends_candidato: {
        Row: {
          candidato_id: string
          citas: Json | null
          comparativos: Json | null
          contexto_narrativo: string | null
          created_at: string
          ejecutada_en: string
          geo: string
          id: string
          pico_interes: number | null
          promedio_interes: number | null
          rango_temporal: string
          raw_serpapi: Json | null
          related_rising: Json | null
          related_top: Json | null
          serie_temporal: Json | null
          termino: string
          user_id: string
        }
        Insert: {
          candidato_id: string
          citas?: Json | null
          comparativos?: Json | null
          contexto_narrativo?: string | null
          created_at?: string
          ejecutada_en?: string
          geo?: string
          id?: string
          pico_interes?: number | null
          promedio_interes?: number | null
          rango_temporal?: string
          raw_serpapi?: Json | null
          related_rising?: Json | null
          related_top?: Json | null
          serie_temporal?: Json | null
          termino: string
          user_id: string
        }
        Update: {
          candidato_id?: string
          citas?: Json | null
          comparativos?: Json | null
          contexto_narrativo?: string | null
          created_at?: string
          ejecutada_en?: string
          geo?: string
          id?: string
          pico_interes?: number | null
          promedio_interes?: number | null
          rango_temporal?: string
          raw_serpapi?: Json | null
          related_rising?: Json | null
          related_top?: Json | null
          serie_temporal?: Json | null
          termino?: string
          user_id?: string
        }
        Relationships: []
      }
      trends_estatal: {
        Row: {
          batch_id: string
          citas: Json | null
          contexto_narrativo: string | null
          created_at: string
          ejecutada_en: string
          geo: string
          id: string
          raw_serpapi: Json | null
          related: Json | null
          serie_temporal: Json | null
          termino: string
          tipo: string
          valor_interes: number | null
          variacion_pct: number | null
        }
        Insert: {
          batch_id: string
          citas?: Json | null
          contexto_narrativo?: string | null
          created_at?: string
          ejecutada_en?: string
          geo?: string
          id?: string
          raw_serpapi?: Json | null
          related?: Json | null
          serie_temporal?: Json | null
          termino: string
          tipo: string
          valor_interes?: number | null
          variacion_pct?: number | null
        }
        Update: {
          batch_id?: string
          citas?: Json | null
          contexto_narrativo?: string | null
          created_at?: string
          ejecutada_en?: string
          geo?: string
          id?: string
          raw_serpapi?: Json | null
          related?: Json | null
          serie_temporal?: Json | null
          termino?: string
          tipo?: string
          valor_interes?: number | null
          variacion_pct?: number | null
        }
        Relationships: []
      }
      trends_runs: {
        Row: {
          batch_id: string | null
          duracion_ms: number | null
          ejecutada_en: string
          error: string | null
          id: string
          total_terminos: number
          trigger: string
        }
        Insert: {
          batch_id?: string | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          id?: string
          total_terminos?: number
          trigger?: string
        }
        Update: {
          batch_id?: string | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          id?: string
          total_terminos?: number
          trigger?: string
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
      social_entidad_tipo: "estatal" | "candidato_propio" | "rival"
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
      social_entidad_tipo: ["estatal", "candidato_propio", "rival"],
    },
  },
} as const
