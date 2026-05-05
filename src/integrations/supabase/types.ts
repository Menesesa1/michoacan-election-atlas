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
      api_usage_log: {
        Row: {
          cache_hit: boolean
          costo_estimado_usd: number
          created_at: string
          duracion_ms: number | null
          funcion: string
          id: string
          metadata: Json
          operacion: string | null
          run_id: string | null
          servicio: string
          status: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          cache_hit?: boolean
          costo_estimado_usd?: number
          created_at?: string
          duracion_ms?: number | null
          funcion: string
          id?: string
          metadata?: Json
          operacion?: string | null
          run_id?: string | null
          servicio: string
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          cache_hit?: boolean
          costo_estimado_usd?: number
          created_at?: string
          duracion_ms?: number | null
          funcion?: string
          id?: string
          metadata?: Json
          operacion?: string | null
          run_id?: string | null
          servicio?: string
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
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
      cib_alertas: {
        Row: {
          batch_id: string | null
          candidato_id: string | null
          created_at: string
          descripcion: string
          detectada_en: string
          entidad_nombre: string
          entidad_tipo: string
          evidencia: Json
          id: string
          severidad: string
          tipo_patron: string
          titulo: string
          ventana_fin: string
          ventana_inicio: string
        }
        Insert: {
          batch_id?: string | null
          candidato_id?: string | null
          created_at?: string
          descripcion: string
          detectada_en?: string
          entidad_nombre: string
          entidad_tipo: string
          evidencia?: Json
          id?: string
          severidad: string
          tipo_patron: string
          titulo: string
          ventana_fin: string
          ventana_inicio: string
        }
        Update: {
          batch_id?: string | null
          candidato_id?: string | null
          created_at?: string
          descripcion?: string
          detectada_en?: string
          entidad_nombre?: string
          entidad_tipo?: string
          evidencia?: Json
          id?: string
          severidad?: string
          tipo_patron?: string
          titulo?: string
          ventana_fin?: string
          ventana_inicio?: string
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
      historico_municipios: {
        Row: {
          anio: number
          candidato_ganador: string | null
          created_at: string
          fuente: string
          fuente_urls: Json
          id: string
          ingerido_en: string
          municipio_clave: number
          municipio_nombre: string
          notas: string | null
          participacion_pct: number | null
          partido_ganador: string | null
          partido_segundo: string | null
          pct_ganador: number | null
          pct_segundo: number | null
          updated_at: string
        }
        Insert: {
          anio: number
          candidato_ganador?: string | null
          created_at?: string
          fuente?: string
          fuente_urls?: Json
          id?: string
          ingerido_en?: string
          municipio_clave: number
          municipio_nombre: string
          notas?: string | null
          participacion_pct?: number | null
          partido_ganador?: string | null
          partido_segundo?: string | null
          pct_ganador?: number | null
          pct_segundo?: number | null
          updated_at?: string
        }
        Update: {
          anio?: number
          candidato_ganador?: string | null
          created_at?: string
          fuente?: string
          fuente_urls?: Json
          id?: string
          ingerido_en?: string
          municipio_clave?: number
          municipio_nombre?: string
          notas?: string | null
          participacion_pct?: number | null
          partido_ganador?: string | null
          partido_segundo?: string | null
          pct_ganador?: number | null
          pct_segundo?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      historico_municipios_runs: {
        Row: {
          detalle: Json | null
          duracion_ms: number | null
          ejecutada_en: string
          error: string | null
          finalizado_en: string | null
          id: string
          total_exitosos: number
          total_fallidos: number
          total_solicitados: number
          trigger: string
        }
        Insert: {
          detalle?: Json | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          finalizado_en?: string | null
          id?: string
          total_exitosos?: number
          total_fallidos?: number
          total_solicitados?: number
          trigger?: string
        }
        Update: {
          detalle?: Json | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          finalizado_en?: string | null
          id?: string
          total_exitosos?: number
          total_fallidos?: number
          total_solicitados?: number
          trigger?: string
        }
        Relationships: []
      }
      medios_michoacan_runs: {
        Row: {
          batch_id: string | null
          duracion_ms: number | null
          ejecutada_en: string
          error: string | null
          id: string
          medios_consultados: number
          menciones_creadas: number
          trigger: string
          urls_descubiertas: number
          urls_nuevas: number
        }
        Insert: {
          batch_id?: string | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          id?: string
          medios_consultados?: number
          menciones_creadas?: number
          trigger?: string
          urls_descubiertas?: number
          urls_nuevas?: number
        }
        Update: {
          batch_id?: string | null
          duracion_ms?: number | null
          ejecutada_en?: string
          error?: string | null
          id?: string
          medios_consultados?: number
          menciones_creadas?: number
          trigger?: string
          urls_descubiertas?: number
          urls_nuevas?: number
        }
        Relationships: []
      }
      medios_urls_procesadas: {
        Row: {
          fuente: string
          id: string
          procesada_en: string
          url: string
          url_hash: string
        }
        Insert: {
          fuente: string
          id?: string
          procesada_en?: string
          url: string
          url_hash: string
        }
        Update: {
          fuente?: string
          id?: string
          procesada_en?: string
          url?: string
          url_hash?: string
        }
        Relationships: []
      }
      narrativas_sugeridas: {
        Row: {
          candidato_id: string | null
          cib_alerta_id: string | null
          contexto: string
          created_at: string
          emocion_objetivo: string | null
          entidad_nombre: string
          id: string
          mensaje: string
          plataforma: string | null
          tipo: string
          tono: string | null
          updated_at: string
          urgencia: number
          usado: boolean
          user_id: string
        }
        Insert: {
          candidato_id?: string | null
          cib_alerta_id?: string | null
          contexto: string
          created_at?: string
          emocion_objetivo?: string | null
          entidad_nombre: string
          id?: string
          mensaje: string
          plataforma?: string | null
          tipo: string
          tono?: string | null
          updated_at?: string
          urgencia?: number
          usado?: boolean
          user_id: string
        }
        Update: {
          candidato_id?: string | null
          cib_alerta_id?: string | null
          contexto?: string
          created_at?: string
          emocion_objetivo?: string | null
          entidad_nombre?: string
          id?: string
          mensaje?: string
          plataforma?: string | null
          tipo?: string
          tono?: string | null
          updated_at?: string
          urgencia?: number
          usado?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrativas_sugeridas_cib_alerta_id_fkey"
            columns: ["cib_alerta_id"]
            isOneToOne: false
            referencedRelation: "cib_alertas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacion_preferencias: {
        Row: {
          alertas_crisis: boolean
          alertas_crisis_min_severidad: string
          cib: boolean
          cib_min_severidad: string
          created_at: string
          runs: boolean
          runs_solo_errores: boolean
          salud_municipio: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          alertas_crisis?: boolean
          alertas_crisis_min_severidad?: string
          cib?: boolean
          cib_min_severidad?: string
          created_at?: string
          runs?: boolean
          runs_solo_errores?: boolean
          salud_municipio?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          alertas_crisis?: boolean
          alertas_crisis_min_severidad?: string
          cib?: boolean
          cib_min_severidad?: string
          created_at?: string
          runs?: boolean
          runs_solo_errores?: boolean
          salud_municipio?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          leida: boolean
          leida_en: string | null
          link: string | null
          metadata: Json
          severidad: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          link?: string | null
          metadata?: Json
          severidad?: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          link?: string | null
          metadata?: Json
          severidad?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      salud_municipio_estado: {
        Row: {
          cambiado_en: string
          estado: string
          estado_anterior: string | null
          metadata: Json
          municipio_clave: number
          municipio_nombre: string
          score: number | null
          updated_at: string
        }
        Insert: {
          cambiado_en?: string
          estado: string
          estado_anterior?: string | null
          metadata?: Json
          municipio_clave: number
          municipio_nombre: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          cambiado_en?: string
          estado?: string
          estado_anterior?: string | null
          metadata?: Json
          municipio_clave?: number
          municipio_nombre?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      social_menciones: {
        Row: {
          batch_id: string
          candidato_id: string | null
          colonia_inferida: string | null
          created_at: string
          detectada_en: string
          emociones: Json | null
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento: string | null
          fuente: string | null
          hashtags: string[] | null
          id: string
          municipio: string | null
          publicada_en: string | null
          sarcasmo: boolean | null
          seccion_inferida: number | null
          sentimiento: number
          tema: string | null
          titulo: string
          url: string | null
        }
        Insert: {
          batch_id: string
          candidato_id?: string | null
          colonia_inferida?: string | null
          created_at?: string
          detectada_en?: string
          emociones?: Json | null
          entidad_nombre: string
          entidad_tipo: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento?: string | null
          fuente?: string | null
          hashtags?: string[] | null
          id?: string
          municipio?: string | null
          publicada_en?: string | null
          sarcasmo?: boolean | null
          seccion_inferida?: number | null
          sentimiento: number
          tema?: string | null
          titulo: string
          url?: string | null
        }
        Update: {
          batch_id?: string
          candidato_id?: string | null
          colonia_inferida?: string | null
          created_at?: string
          detectada_en?: string
          emociones?: Json | null
          entidad_nombre?: string
          entidad_tipo?: Database["public"]["Enums"]["social_entidad_tipo"]
          fragmento?: string | null
          fuente?: string | null
          hashtags?: string[] | null
          id?: string
          municipio?: string | null
          publicada_en?: string | null
          sarcasmo?: boolean | null
          seccion_inferida?: number | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      api_usage_diario: {
        Row: {
          cache_hits: number | null
          costo_total_usd: number | null
          dia: string | null
          duracion_promedio_ms: number | null
          errores: number | null
          funcion: string | null
          llamadas: number | null
          servicio: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fanout_run_generic: {
        Args: {
          _error: string
          _link: string
          _resumen: string
          _tipo_label: string
          _user_id: string
        }
        Returns: undefined
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intentar_lock_pipeline: { Args: { _nombre: string }; Returns: boolean }
      liberar_lock_pipeline: { Args: { _nombre: string }; Returns: boolean }
      registrar_uso_api: {
        Args: {
          _cache_hit?: boolean
          _costo?: number
          _duracion_ms?: number
          _funcion: string
          _metadata?: Json
          _operacion?: string
          _run_id?: string
          _servicio: string
          _status?: string
          _tokens_in?: number
          _tokens_out?: number
        }
        Returns: string
      }
      severidad_rank: { Args: { _sev: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "analista" | "cliente"
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
      app_role: ["admin", "analista", "cliente"],
      social_entidad_tipo: ["estatal", "candidato_propio", "rival"],
    },
  },
} as const
