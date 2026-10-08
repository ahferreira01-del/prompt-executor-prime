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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      clients: {
        Row: {
          annual_revenue: number | null
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          annual_revenue?: number | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          annual_revenue?: number | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          employee_count: number
          id: string
          name: string
          owner_id: string
          segment: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_count: number
          id?: string
          name: string
          owner_id: string
          segment: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_count?: number
          id?: string
          name?: string
          owner_id?: string
          segment?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_answers: {
        Row: {
          answer_value: string
          company_id: string
          diagnostic_id: string
          id: string
          question_id: string
        }
        Insert: {
          answer_value: string
          company_id: string
          diagnostic_id: string
          id?: string
          question_id: string
        }
        Update: {
          answer_value?: string
          company_id?: string
          diagnostic_id?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_answers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_answers_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_questions: {
        Row: {
          category: string
          code: string
          display_order: number
          id: string
          question_text: string
          required: boolean
        }
        Insert: {
          category: string
          code: string
          display_order: number
          id?: string
          question_text: string
          required?: boolean
        }
        Update: {
          category?: string
          code?: string
          display_order?: number
          id?: string
          question_text?: string
          required?: boolean
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          company_id: string
          completed_at: string | null
          id: string
          risk_configuration_id: string
          risk_score: number | null
          started_at: string
          status: Database["public"]["Enums"]["diagnostic_status"]
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          id?: string
          risk_configuration_id: string
          risk_score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["diagnostic_status"]
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          id?: string
          risk_configuration_id?: string
          risk_score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["diagnostic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_risk_configuration_id_fkey"
            columns: ["risk_configuration_id"]
            isOneToOne: false
            referencedRelation: "risk_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_capabilities: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          id: string
          process_id: string | null
          technology_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          process_id?: string | null
          technology_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          process_id?: string | null
          technology_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_capabilities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_capabilities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_capabilities_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_capabilities_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          area: string
          company_id: string
          created_at: string
          email: string | null
          id: string
          job_title: string
          name: string
          tenure_months: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          area: string
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          job_title: string
          name: string
          tenure_months: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          area?: string
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          job_title?: string
          name?: string
          tenure_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_runs: {
        Row: {
          company_id: string
          created: number
          created_at: string
          entity: string
          id: string
          kind: string
          message: string | null
          received: number
          skipped: number
          status: string
        }
        Insert: {
          company_id: string
          created?: number
          created_at?: string
          entity?: string
          id?: string
          kind: string
          message?: string | null
          received?: number
          skipped?: number
          status: string
        }
        Update: {
          company_id?: string
          created?: number
          created_at?: string
          entity?: string
          id?: string
          kind?: string
          message?: string | null
          received?: number
          skipped?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_token: string | null
          company_id: string
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_status: string | null
          provider: string
          sync_enabled: boolean
          updated_at: string
          webhook_key: string
        }
        Insert: {
          api_token?: string | null
          company_id: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          provider?: string
          sync_enabled?: boolean
          updated_at?: string
          webhook_key?: string
        }
        Update: {
          api_token?: string | null
          company_id?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          provider?: string
          sync_enabled?: boolean
          updated_at?: string
          webhook_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_activities: {
        Row: {
          activity_date: string
          activity_type: string | null
          client_id: string | null
          company_id: string
          employee_id: string
          id: string
          process_id: string | null
          source_key: string | null
          technology_id: string | null
          theme: string | null
        }
        Insert: {
          activity_date?: string
          activity_type?: string | null
          client_id?: string | null
          company_id: string
          employee_id: string
          id?: string
          process_id?: string | null
          source_key?: string | null
          technology_id?: string | null
          theme?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string | null
          client_id?: string | null
          company_id?: string
          employee_id?: string
          id?: string
          process_id?: string | null
          source_key?: string | null
          technology_id?: string | null
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_activities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_activities_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_activities_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      mitigation_recommendations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          indicator_id: string | null
          reason: string
          recommendation_text: string
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          indicator_id?: string | null
          reason: string
          recommendation_text: string
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          indicator_id?: string | null
          reason?: string
          recommendation_text?: string
          recommendation_type?: Database["public"]["Enums"]["recommendation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "mitigation_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitigation_recommendations_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "risk_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          area: string
          company_id: string
          created_at: string
          criticality: Database["public"]["Enums"]["risk_level"]
          description: string
          documentation_level: Database["public"]["Enums"]["documentation_level"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area: string
          company_id: string
          created_at?: string
          criticality: Database["public"]["Enums"]["risk_level"]
          description: string
          documentation_level?: Database["public"]["Enums"]["documentation_level"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area?: string
          company_id?: string
          created_at?: string
          criticality?: Database["public"]["Enums"]["risk_level"]
          description?: string
          documentation_level?: Database["public"]["Enums"]["documentation_level"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_configurations: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          doc_complete: number
          doc_none: number
          doc_partial: number
          id: string
          revenue_mode: string
          version: number
          weight_concentration: number
          weight_coverage: number
          weight_criticality: number
          weight_documentation: number
          weight_revenue: number
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          doc_complete?: number
          doc_none?: number
          doc_partial?: number
          id?: string
          revenue_mode?: string
          version: number
          weight_concentration?: number
          weight_coverage?: number
          weight_criticality?: number
          weight_documentation?: number
          weight_revenue?: number
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          doc_complete?: number
          doc_none?: number
          doc_partial?: number
          id?: string
          revenue_mode?: string
          version?: number
          weight_concentration?: number
          weight_coverage?: number
          weight_criticality?: number
          weight_documentation?: number
          weight_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_indicators: {
        Row: {
          calculated_at: string
          classification: string | null
          client_id: string | null
          company_id: string
          diagnostic_id: string | null
          employee_id: string | null
          id: string
          indicator_type: string
          numeric_value: number | null
          process_id: string | null
          risk_configuration_id: string
          technology_id: string | null
        }
        Insert: {
          calculated_at?: string
          classification?: string | null
          client_id?: string | null
          company_id: string
          diagnostic_id?: string | null
          employee_id?: string | null
          id?: string
          indicator_type: string
          numeric_value?: number | null
          process_id?: string | null
          risk_configuration_id: string
          technology_id?: string | null
        }
        Update: {
          calculated_at?: string
          classification?: string | null
          client_id?: string | null
          company_id?: string
          diagnostic_id?: string | null
          employee_id?: string | null
          id?: string
          indicator_type?: string
          numeric_value?: number | null
          process_id?: string | null
          risk_configuration_id?: string
          technology_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_indicators_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_risk_configuration_id_fkey"
            columns: ["risk_configuration_id"]
            isOneToOne: false
            referencedRelation: "risk_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_indicators_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "technologies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_classifications: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          subject: string
          technology: string
          ticket_id: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          id?: string
          subject: string
          technology: string
          ticket_id: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          subject?: string
          technology?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_classifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_classifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          company_id: string
          content: string
          created_at: string
          employee_id: string | null
          external_id: string | null
          external_status: string | null
          id: string
          resolved_at: string | null
          source: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          employee_id?: string | null
          external_id?: string | null
          external_status?: string | null
          id?: string
          resolved_at?: string | null
          source?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          employee_id?: string | null
          external_id?: string | null
          external_status?: string | null
          id?: string
          resolved_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_company_role: {
        Args: {
          _company_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id?: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "analyst" | "viewer"
      diagnostic_status: "DRAFT" | "COMPLETED"
      documentation_level: "NONE" | "PARTIAL" | "COMPLETE"
      recommendation_type:
        | "TRAINING"
        | "DOCUMENTATION"
        | "OPERATIONAL_BACKUP"
        | "KNOWLEDGE_SHARING"
      risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
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
      app_role: ["admin", "manager", "analyst", "viewer"],
      diagnostic_status: ["DRAFT", "COMPLETED"],
      documentation_level: ["NONE", "PARTIAL", "COMPLETE"],
      recommendation_type: [
        "TRAINING",
        "DOCUMENTATION",
        "OPERATIONAL_BACKUP",
        "KNOWLEDGE_SHARING",
      ],
      risk_level: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    },
  },
} as const
