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
      access_logs: {
        Row: {
          accessed_at: string
          action: string
          emergency_link_id: string | null
          id: string
          ip: string | null
          patient_id: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          action: string
          emergency_link_id?: string | null
          id?: string
          ip?: string | null
          patient_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          emergency_link_id?: string | null
          id?: string
          ip?: string | null
          patient_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          address: string | null
          created_at: string
          doctor_name: string | null
          id: string
          location: string | null
          map_url: string | null
          notes: string | null
          parent_appointment_id: string | null
          patient_id: string
          responsible_user_id: string | null
          scheduled_at: string
          specialty: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          location?: string | null
          map_url?: string | null
          notes?: string | null
          parent_appointment_id?: string | null
          patient_id: string
          responsible_user_id?: string | null
          scheduled_at: string
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          location?: string | null
          map_url?: string | null
          notes?: string | null
          parent_appointment_id?: string | null
          patient_id?: string
          responsible_user_id?: string | null
          scheduled_at?: string
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_parent_appointment_id_fkey"
            columns: ["parent_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_events: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          doctor_name: string | null
          event_date: string
          id: string
          patient_id: string
          severity: Database["public"]["Enums"]["clinical_severity"]
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["clinical_event_type"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doctor_name?: string | null
          event_date?: string
          id?: string
          patient_id: string
          severity?: Database["public"]["Enums"]["clinical_severity"]
          tags?: string[]
          title: string
          type?: Database["public"]["Enums"]["clinical_event_type"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doctor_name?: string | null
          event_date?: string
          id?: string
          patient_id?: string
          severity?: Database["public"]["Enums"]["clinical_severity"]
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["clinical_event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          appointment_id: string | null
          clinical_event_id: string | null
          created_at: string
          deleted_at: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          doctor_name: string | null
          document_date: string | null
          exam_date: string | null
          expiry_date: string | null
          file_path: string
          file_size: number | null
          id: string
          institution: string | null
          mime_type: string | null
          notes: string | null
          patient_id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinical_event_id?: string | null
          created_at?: string
          deleted_at?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          doctor_name?: string | null
          document_date?: string | null
          exam_date?: string | null
          expiry_date?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          institution?: string | null
          mime_type?: string | null
          notes?: string | null
          patient_id: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinical_event_id?: string | null
          created_at?: string
          deleted_at?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          doctor_name?: string | null
          document_date?: string | null
          exam_date?: string | null
          expiry_date?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          institution?: string | null
          mime_type?: string | null
          notes?: string | null
          patient_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_clinical_event_id_fkey"
            columns: ["clinical_event_id"]
            isOneToOne: false
            referencedRelation: "clinical_events"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_id: string
          phone: string
          priority: number
          relation: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
          phone: string
          priority?: number
          relation?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          phone?: string
          priority?: number
          relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_links: {
        Row: {
          access_count: number
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          patient_id: string
          token: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          patient_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          patient_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          relation: Database["public"]["Enums"]["member_relation"]
          role: Database["public"]["Enums"]["family_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          relation?: Database["public"]["Enums"]["member_relation"]
          role?: Database["public"]["Enums"]["family_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          relation?: Database["public"]["Enums"]["member_relation"]
          role?: Database["public"]["Enums"]["family_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_change_history: {
        Row: {
          changed_at: string
          changed_by: string
          field_changed: string
          id: string
          medication_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_changed: string
          id?: string
          medication_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_changed?: string
          id?: string
          medication_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_change_history_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          created_at: string
          id: string
          logged_by: string | null
          medication_id: string
          patient_id: string
          scheduled_for: string
          status: string
          taken_at: string | null
          taken_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logged_by?: string | null
          medication_id: string
          patient_id: string
          scheduled_for: string
          status?: string
          taken_at?: string | null
          taken_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logged_by?: string | null
          medication_id?: string
          patient_id?: string
          scheduled_for?: string
          status?: string
          taken_at?: string | null
          taken_by?: string | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          form: string | null
          frequency: string | null
          generic_name: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          photo_path: string | null
          prescriber: string | null
          schedule: Json | null
          start_date: string
          status: Database["public"]["Enums"]["medication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          form?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          photo_path?: string | null
          prescriber?: string | null
          schedule?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["medication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          form?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          photo_path?: string | null
          prescriber?: string | null
          schedule?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["medication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_allergies: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_id: string
          severity: Database["public"]["Enums"]["severity_level"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
          severity?: Database["public"]["Enums"]["severity_level"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_conditions: {
        Row: {
          created_at: string
          id: string
          name: string
          patient_id: string
          status: Database["public"]["Enums"]["condition_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
          status?: Database["public"]["Enums"]["condition_status"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["condition_status"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          blood_type: Database["public"]["Enums"]["blood_type"] | null
          created_at: string
          family_id: string
          full_name: string
          id: string
          insurance_name: string | null
          insurance_number: string | null
          photo_url: string | null
          relation: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string
          family_id: string
          full_name: string
          id?: string
          insurance_name?: string | null
          insurance_number?: string | null
          photo_url?: string | null
          relation?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          blood_type?: Database["public"]["Enums"]["blood_type"] | null
          created_at?: string
          family_id?: string
          full_name?: string
          id?: string
          insurance_name?: string | null
          insurance_number?: string | null
          photo_url?: string | null
          relation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
      appointment_status: "scheduled" | "done" | "cancelled"
      appointment_type:
        | "consulta"
        | "exame"
        | "retorno"
        | "procedimento"
        | "fisioterapia"
        | "vacina"
        | "outro"
      blood_type:
        | "A+"
        | "A-"
        | "B+"
        | "B-"
        | "AB+"
        | "AB-"
        | "O+"
        | "O-"
        | "unknown"
      clinical_event_type:
        | "consultation"
        | "exam_result"
        | "procedure"
        | "hospitalization"
        | "diagnosis"
        | "vaccination"
        | "other"
        | "surgery"
        | "symptom"
        | "fall"
        | "medication_change"
        | "follow_up"
        | "crisis"
        | "family_observation"
      clinical_severity: "low" | "medium" | "high" | "critical"
      condition_status: "active" | "inactive"
      document_type:
        | "prescription"
        | "exam"
        | "report"
        | "other"
        | "medical_order"
        | "insurance_card"
        | "personal_doc"
        | "hospital_discharge"
        | "vaccine"
      family_role: "admin" | "member" | "caregiver"
      medication_status: "active" | "paused" | "archived" | "ended"
      member_relation: "child" | "spouse" | "caregiver" | "other"
      member_status: "active" | "invited"
      severity_level: "low" | "medium" | "high"
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
      appointment_status: ["scheduled", "done", "cancelled"],
      appointment_type: [
        "consulta",
        "exame",
        "retorno",
        "procedimento",
        "fisioterapia",
        "vacina",
        "outro",
      ],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      clinical_event_type: [
        "consultation",
        "exam_result",
        "procedure",
        "hospitalization",
        "diagnosis",
        "vaccination",
        "other",
        "surgery",
        "symptom",
        "fall",
        "medication_change",
        "follow_up",
        "crisis",
        "family_observation",
      ],
      clinical_severity: ["low", "medium", "high", "critical"],
      condition_status: ["active", "inactive"],
      document_type: [
        "prescription",
        "exam",
        "report",
        "other",
        "medical_order",
        "insurance_card",
        "personal_doc",
        "hospital_discharge",
        "vaccine",
      ],
      family_role: ["admin", "member", "caregiver"],
      medication_status: ["active", "paused", "archived", "ended"],
      member_relation: ["child", "spouse", "caregiver", "other"],
      member_status: ["active", "invited"],
      severity_level: ["low", "medium", "high"],
    },
  },
} as const
