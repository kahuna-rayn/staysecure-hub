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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_inventory: {
        Row: {
          approval_status: string | null
          authorized_by: string | null
          created_at: string | null
          created_by: string | null
          data_class: string | null
          date_access_created: string | null
          date_access_revoked: string | null
          department: string | null
          full_name: string
          id: string
          modified_at: string | null
          modified_by: string | null
          role_account_type: string | null
          software: string | null
          status: string | null
          user_id: string | null
          username_email: string
        }
        Insert: {
          approval_status?: string | null
          authorized_by?: string | null
          created_at?: string | null
          created_by?: string | null
          data_class?: string | null
          date_access_created?: string | null
          date_access_revoked?: string | null
          department?: string | null
          full_name: string
          id?: string
          modified_at?: string | null
          modified_by?: string | null
          role_account_type?: string | null
          software?: string | null
          status?: string | null
          user_id?: string | null
          username_email: string
        }
        Update: {
          approval_status?: string | null
          authorized_by?: string | null
          created_at?: string | null
          created_by?: string | null
          data_class?: string | null
          date_access_created?: string | null
          date_access_revoked?: string | null
          department?: string | null
          full_name?: string
          id?: string
          modified_at?: string | null
          modified_by?: string | null
          role_account_type?: string | null
          software?: string | null
          status?: string | null
          user_id?: string | null
          username_email?: string
        }
        Relationships: []
      }
      breach_management_team: {
        Row: {
          activity: string | null
          allow_custom: boolean
          best_practice: string | null
          created_at: string
          id: string
          is_system: boolean
          mandatory: boolean
          member: string | null
          org_practice: string | null
          recommended_designee: string | null
          sequence: number
          team_role: string | null
          updated_at: string
        }
        Insert: {
          activity?: string | null
          allow_custom?: boolean
          best_practice?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          mandatory?: boolean
          member?: string | null
          org_practice?: string | null
          recommended_designee?: string | null
          sequence?: number
          team_role?: string | null
          updated_at?: string
        }
        Update: {
          activity?: string | null
          allow_custom?: boolean
          best_practice?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          mandatory?: boolean
          member?: string | null
          org_practice?: string | null
          recommended_designee?: string | null
          sequence?: number
          team_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breach_management_team_member_fkey"
            columns: ["member"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breach_team_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          breach_team_id: string
          created_at: string
          department_id: string | null
          id: string
          is_primary: boolean
          is_system: boolean
          role_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          breach_team_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean
          is_system?: boolean
          role_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          breach_team_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean
          is_system?: boolean
          role_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breach_team_members_breach_team_id_fkey"
            columns: ["breach_team_id"]
            isOneToOne: false
            referencedRelation: "breach_management_team"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          credential_id: string | null
          date_acquired: string
          expiry_date: string | null
          id: string
          issued_by: string
          name: string
          org_cert: boolean | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          date_acquired: string
          expiry_date?: string | null
          id?: string
          issued_by: string
          name: string
          org_cert?: boolean | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          date_acquired?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string
          name?: string
          org_cert?: boolean | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csba_answers: {
        Row: {
          answer: number
          assessment_date: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer: number
          assessment_date: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer?: number
          assessment_date?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csba_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "csba_assessment_summary_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "csba_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "csba_master"
            referencedColumns: ["question_id"]
          },
        ]
      }
      csba_master: {
        Row: {
          created_at: string
          domain: string | null
          domain_short: string | null
          id: string
          question: string | null
          question_id: string
          recommendation: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          domain_short?: string | null
          id?: string
          question?: string | null
          question_id?: string
          recommendation?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          domain_short?: string | null
          id?: string
          question?: string | null
          question_id?: string
          recommendation?: string | null
          type?: string | null
        }
        Relationships: []
      }
      customer_product_licenses: {
        Row: {
          customer_id: string
          end_date: string | null
          id: string
          language: string
          product_id: string
          seats: number
          start_date: string | null
          term: number
        }
        Insert: {
          customer_id: string
          end_date?: string | null
          id?: string
          language: string
          product_id: string
          seats: number
          start_date?: string | null
          term: number
        }
        Update: {
          customer_id?: string
          end_date?: string | null
          id?: string
          language?: string
          product_id?: string
          seats?: number
          start_date?: string | null
          term?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_product_licenses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_product_licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          customer_name: string
          email: string | null
          endpoints: number | null
          id: string
          is_active: boolean | null
          primary_contact: string | null
          short_name: string
        }
        Insert: {
          customer_name: string
          email?: string | null
          endpoints?: number | null
          id?: string
          is_active?: boolean | null
          primary_contact?: string | null
          short_name: string
        }
        Update: {
          customer_name?: string
          email?: string | null
          endpoints?: number | null
          id?: string
          is_active?: boolean | null
          primary_contact?: string | null
          short_name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_id: string
          completed_at: string | null
          document_id: string
          document_version: number
          due_date: string | null
          notes: string | null
          reminder_sent: boolean
          status: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_id?: string
          completed_at?: string | null
          document_id: string
          document_version: number
          due_date?: string | null
          notes?: string | null
          reminder_sent?: boolean
          status?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_id?: string
          completed_at?: string | null
          document_id?: string
          document_version?: number
          due_date?: string | null
          notes?: string | null
          reminder_sent?: boolean
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      document_departments: {
        Row: {
          department_id: string
          document_id: string
        }
        Insert: {
          department_id: string
          document_id: string
        }
        Update: {
          department_id?: string
          document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_departments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      document_roles: {
        Row: {
          document_id: string
          role_id: string
        }
        Insert: {
          document_id: string
          role_id: string
        }
        Update: {
          document_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "document_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      document_users: {
        Row: {
          document_id: string
          user_id: string
        }
        Insert: {
          document_id: string
          user_id: string
        }
        Update: {
          document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_users_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          document_id: string
          due_days: number | null
          file_name: string | null
          file_type: string | null
          required: boolean
          title: string
          updated_at: string
          url: string | null
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_id?: string
          due_days?: number | null
          file_name?: string | null
          file_type?: string | null
          required?: boolean
          title: string
          updated_at?: string
          url?: string | null
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_id?: string
          due_days?: number | null
          file_name?: string | null
          file_type?: string | null
          required?: boolean
          title?: string
          updated_at?: string
          url?: string | null
          version?: number
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          message: string
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          message: string
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          message?: string
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          achievements: boolean | null
          course_completions: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          lesson_reminders: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          system_alerts: boolean | null
          task_due_dates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: boolean | null
          course_completions?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          lesson_reminders?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_alerts?: boolean | null
          task_due_dates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: boolean | null
          course_completions?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          lesson_reminders?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_alerts?: boolean | null
          task_due_dates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_body_template: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          text_body_template: string | null
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_body_template: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          text_body_template?: string | null
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_body_template?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          text_body_template?: string | null
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      hardware: {
        Row: {
          assigned_date: string
          created_at: string
          id: string
          model: string
          serial_number: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          id?: string
          model: string
          serial_number: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          id?: string
          model?: string
          serial_number?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hardware_inventory: {
        Row: {
          approval_authorized_by: string | null
          approval_created_date: string | null
          approval_status: string | null
          approvers: string | null
          asset_classification: string | null
          asset_location: string | null
          asset_owner: string
          asset_type: string
          created_at: string | null
          device_name: string
          end_of_support_date: string | null
          id: string
          manufacturer: string | null
          model: string | null
          os_edition: string | null
          os_version: string | null
          owner: string | null
          responses: string | null
          serial_number: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approval_authorized_by?: string | null
          approval_created_date?: string | null
          approval_status?: string | null
          approvers?: string | null
          asset_classification?: string | null
          asset_location?: string | null
          asset_owner: string
          asset_type: string
          created_at?: string | null
          device_name: string
          end_of_support_date?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          os_edition?: string | null
          os_version?: string | null
          owner?: string | null
          responses?: string | null
          serial_number: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_authorized_by?: string | null
          approval_created_date?: string | null
          approval_status?: string | null
          approvers?: string | null
          asset_classification?: string | null
          asset_location?: string | null
          asset_owner?: string
          asset_type?: string
          created_at?: string | null
          device_name?: string
          end_of_support_date?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          os_edition?: string | null
          os_version?: string | null
          owner?: string | null
          responses?: string | null
          serial_number?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hib_checklist: {
        Row: {
          additional_information_i: string | null
          additional_information_ii: string | null
          additional_information_iii: string | null
          created_at: string
          hib_clause: number
          hib_clause_description: string | null
          hib_section: string
          id: string
          implementation_status: string | null
          remarks: string | null
          section_number: number | null
          suggested_artefacts: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_information_i?: string | null
          additional_information_ii?: string | null
          additional_information_iii?: string | null
          created_at?: string
          hib_clause: number
          hib_clause_description?: string | null
          hib_section: string
          id?: string
          implementation_status?: string | null
          remarks?: string | null
          section_number?: number | null
          suggested_artefacts?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_information_i?: string | null
          additional_information_ii?: string | null
          additional_information_iii?: string | null
          created_at?: string
          hib_clause?: number
          hib_clause_description?: string | null
          hib_section?: string
          id?: string
          implementation_status?: string | null
          remarks?: string | null
          section_number?: number | null
          suggested_artefacts?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hib_results: {
        Row: {
          created_at: string
          fail: number
          id: string
          implemented: number
          not_implemented: number
          pass: number
          result: string
          section_name: string
          section_number: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fail?: number
          id?: string
          implemented?: number
          not_implemented?: number
          pass?: number
          result: string
          section_name: string
          section_number: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fail?: number
          id?: string
          implemented?: number
          not_implemented?: number
          pass?: number
          result?: string
          section_name?: string
          section_number?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      key_dates: {
        Row: {
          certificate: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          frequency: string | null
          id: string
          key_activity: string | null
          modified_at: string | null
          modified_by: string | null
          updated_due_date: string | null
        }
        Insert: {
          certificate?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          key_activity?: string | null
          modified_at?: string | null
          modified_by?: string | null
          updated_due_date?: string | null
        }
        Update: {
          certificate?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          key_activity?: string | null
          modified_at?: string | null
          modified_by?: string | null
          updated_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_dates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_dates_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          display_name: string | null
          fallback_engine: string | null
          flag_emoji: string | null
          is_active: boolean | null
          is_beta: boolean | null
          name: string
          native_name: string | null
          preferred_engine: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          display_name?: string | null
          fallback_engine?: string | null
          flag_emoji?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          name: string
          native_name?: string | null
          preferred_engine?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          display_name?: string | null
          fallback_engine?: string | null
          flag_emoji?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          name?: string
          native_name?: string | null
          preferred_engine?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      learning_track_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string
          completion_required: boolean | null
          due_date: string | null
          learning_track_id: string
          notes: string | null
          reminder_sent: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          completion_required?: boolean | null
          due_date?: string | null
          learning_track_id: string
          notes?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          completion_required?: boolean | null
          due_date?: string | null
          learning_track_id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_assignments_learning_track_id_fkey"
            columns: ["learning_track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_track_department_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string
          department_id: string
          due_date: string | null
          learning_track_id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          department_id: string
          due_date?: string | null
          learning_track_id: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          department_id?: string
          due_date?: string | null
          learning_track_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_department_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_department_assignments_learning_track_id_fkey"
            columns: ["learning_track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_track_lessons: {
        Row: {
          created_at: string
          id: string
          learning_track_id: string
          lesson_id: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          learning_track_id: string
          lesson_id: string
          order_index: number
        }
        Update: {
          created_at?: string
          id?: string
          learning_track_id?: string
          lesson_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_lessons_learning_track_id_fkey"
            columns: ["learning_track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_track_role_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string
          due_date: string | null
          learning_track_id: string
          notes: string | null
          role_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          due_date?: string | null
          learning_track_id: string
          notes?: string | null
          role_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          due_date?: string | null
          learning_track_id?: string
          notes?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_role_assignments_learning_track_id_fkey"
            columns: ["learning_track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          allow_all_lessons_immediately: boolean | null
          allow_parallel_tracks: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number | null
          end_date: string | null
          id: string
          lessons_per_week: number | null
          max_lessons_per_week: number | null
          schedule_days: number[] | null
          schedule_type: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_all_lessons_immediately?: boolean | null
          allow_parallel_tracks?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          lessons_per_week?: number | null
          max_lessons_per_week?: number | null
          schedule_days?: number[] | null
          schedule_type?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_all_lessons_immediately?: boolean | null
          allow_parallel_tracks?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          lessons_per_week?: number | null
          max_lessons_per_week?: number | null
          schedule_days?: number[] | null
          schedule_type?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_answer_translations: {
        Row: {
          answer_id: string
          character_count: number | null
          content_hash: string | null
          created_at: string | null
          engine_used: string
          explanation_translated: string | null
          id: string
          is_outdated: boolean | null
          language_code: string
          needs_review: boolean | null
          quality_score: number | null
          reviewed_by: string | null
          source_content_hash: string | null
          status: string | null
          text_translated: string
          translated_by: string | null
          translation_cost: number | null
          updated_at: string | null
        }
        Insert: {
          answer_id: string
          character_count?: number | null
          content_hash?: string | null
          created_at?: string | null
          engine_used?: string
          explanation_translated?: string | null
          id?: string
          is_outdated?: boolean | null
          language_code: string
          needs_review?: boolean | null
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          text_translated: string
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          answer_id?: string
          character_count?: number | null
          content_hash?: string | null
          created_at?: string | null
          engine_used?: string
          explanation_translated?: string | null
          id?: string
          is_outdated?: boolean | null
          language_code?: string
          needs_review?: boolean | null
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          text_translated?: string
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answer_translations_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "lesson_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_answers: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          is_correct: boolean | null
          next_node_id: string | null
          node_id: string
          score: number | null
          text: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id: string
          is_correct?: boolean | null
          next_node_id?: string | null
          node_id: string
          score?: number | null
          text: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          next_node_id?: string | null
          node_id?: string
          score?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answers_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "lesson_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_node_translations: {
        Row: {
          character_count: number | null
          content_hash: string | null
          content_translated: string
          created_at: string | null
          engine_used: string
          id: string
          is_outdated: boolean | null
          language_code: string | null
          media_alt_translated: string | null
          needs_review: boolean | null
          node_id: string
          quality_score: number | null
          reviewed_by: string | null
          source_content_hash: string | null
          status: string | null
          translated_by: string | null
          translation_cost: number | null
          updated_at: string | null
        }
        Insert: {
          character_count?: number | null
          content_hash?: string | null
          content_translated: string
          created_at?: string | null
          engine_used: string
          id?: string
          is_outdated?: boolean | null
          language_code?: string | null
          media_alt_translated?: string | null
          needs_review?: boolean | null
          node_id: string
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          character_count?: number | null
          content_hash?: string | null
          content_translated?: string
          created_at?: string | null
          engine_used?: string
          id?: string
          is_outdated?: boolean | null
          language_code?: string | null
          media_alt_translated?: string | null
          needs_review?: boolean | null
          node_id?: string
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_node_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lesson_node_translations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "lesson_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_nodes: {
        Row: {
          allow_multiple: boolean | null
          content: string
          content_hash: string | null
          created_at: string
          embedded_lesson_id: string | null
          id: string
          lesson_id: string
          max_selections: number | null
          media_alt: string | null
          media_type: string | null
          media_url: string | null
          min_selections: number | null
          next_node_id: string | null
          position_x: number | null
          position_y: number | null
          type: string
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean | null
          content: string
          content_hash?: string | null
          created_at?: string
          embedded_lesson_id?: string | null
          id: string
          lesson_id: string
          max_selections?: number | null
          media_alt?: string | null
          media_type?: string | null
          media_url?: string | null
          min_selections?: number | null
          next_node_id?: string | null
          position_x?: number | null
          position_y?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean | null
          content?: string
          content_hash?: string | null
          created_at?: string
          embedded_lesson_id?: string | null
          id?: string
          lesson_id?: string
          max_selections?: number | null
          media_alt?: string | null
          media_type?: string | null
          media_url?: string | null
          min_selections?: number | null
          next_node_id?: string | null
          position_x?: number | null
          position_y?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_nodes_embedded_lesson_id_fkey"
            columns: ["embedded_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_nodes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_translations: {
        Row: {
          character_count: number | null
          created_at: string | null
          description_translated: string | null
          engine_used: string
          id: string
          is_outdated: boolean | null
          language_code: string | null
          lesson_id: string
          needs_review: boolean | null
          quality_score: number | null
          reviewed_by: string | null
          source_content_hash: string | null
          status: string | null
          title_translated: string
          translated_by: string | null
          translation_cost: number | null
          updated_at: string | null
        }
        Insert: {
          character_count?: number | null
          created_at?: string | null
          description_translated?: string | null
          engine_used: string
          id?: string
          is_outdated?: boolean | null
          language_code?: string | null
          lesson_id: string
          needs_review?: boolean | null
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          title_translated: string
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          character_count?: number | null
          created_at?: string | null
          description_translated?: string | null
          engine_used?: string
          id?: string
          is_outdated?: boolean | null
          language_code?: string | null
          lesson_id?: string
          needs_review?: boolean | null
          quality_score?: number | null
          reviewed_by?: string | null
          source_content_hash?: string | null
          status?: string | null
          title_translated?: string
          translated_by?: string | null
          translation_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lesson_translations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          lesson_type: string | null
          quiz_config: Json | null
          start_node_id: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          lesson_type?: string | null
          quiz_config?: Json | null
          start_node_id?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          lesson_type?: string | null
          quiz_config?: Json | null
          start_node_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          building: string | null
          created_at: string
          description: string | null
          floor: string | null
          id: string
          name: string
          room: string | null
          status: string
          updated_at: string
        }
        Insert: {
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          name: string
          room?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          name?: string
          room?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_profile: {
        Row: {
          acra_uen_number: string | null
          address: string | null
          annual_turnover: string | null
          appointed_certification_body: string | null
          charity_registration_number: string | null
          created_at: string
          created_by: string | null
          id: string
          number_of_employees: number | null
          number_of_executives: number | null
          organisation_name: string | null
          organisation_name_short: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          acra_uen_number?: string | null
          address?: string | null
          annual_turnover?: string | null
          appointed_certification_body?: string | null
          charity_registration_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          number_of_employees?: number | null
          number_of_executives?: number | null
          organisation_name?: string | null
          organisation_name_short?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          acra_uen_number?: string | null
          address?: string | null
          annual_turnover?: string | null
          appointed_certification_body?: string | null
          charity_registration_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          number_of_employees?: number | null
          number_of_executives?: number | null
          organisation_name?: string | null
          organisation_name_short?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      org_sig_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role_type: string
          signatory_email: string | null
          signatory_name: string | null
          signatory_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_type: string
          signatory_email?: string | null
          signatory_name?: string | null
          signatory_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_type?: string
          signatory_email?: string | null
          signatory_name?: string | null
          signatory_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      periodic_reviews: {
        Row: {
          activity: string | null
          any_change: boolean | null
          approval_status:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at: string
          approved_by: string | null
          due_date: string | null
          id: string
          submitted_at: string | null
          submitted_by: string | null
          summary_or_evidence: string | null
        }
        Insert: {
          activity?: string | null
          any_change?: boolean | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string
          approved_by?: string | null
          due_date?: string | null
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          summary_or_evidence?: string | null
        }
        Update: {
          activity?: string | null
          any_change?: boolean | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status_enum"]
            | null
          approved_at?: string
          approved_by?: string | null
          due_date?: string | null
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          summary_or_evidence?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "periodic_reviews_log_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_reviews_log_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_location_access: {
        Row: {
          access_purpose: string
          created_at: string
          date_access_created: string
          date_access_revoked: string | null
          full_name: string
          id: string
          location_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_purpose: string
          created_at?: string
          date_access_created: string
          date_access_revoked?: string | null
          full_name: string
          id?: string
          location_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_purpose?: string
          created_at?: string
          date_access_created?: string
          date_access_revoked?: string | null
          full_name?: string
          id?: string
          location_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_location_access_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_location_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_license_assignments: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_type"]
          id: string
          license_id: string
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level_type"]
          id?: string
          license_id: string
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_type"]
          id?: string
          license_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_licenses_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "customer_product_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          version: number | null
        }
        Insert: {
          id?: string
          name: string
          version?: number | null
        }
        Update: {
          id?: string
          name?: string
          version?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          cyber_learner: boolean | null
          dpe_complete: boolean | null
          dpe_learner: boolean | null
          employee_id: string | null
          enrolled_in_learn: boolean | null
          first_name: string | null
          full_name: string | null
          id: string
          language: string | null
          last_login: string | null
          last_name: string | null
          learn_complete: boolean | null
          location: string | null
          location_id: string | null
          manager: string | null
          password_last_changed: string | null
          phone: string | null
          start_date: string | null
          status: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cyber_learner?: boolean | null
          dpe_complete?: boolean | null
          dpe_learner?: boolean | null
          employee_id?: string | null
          enrolled_in_learn?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          last_login?: string | null
          last_name?: string | null
          learn_complete?: boolean | null
          location?: string | null
          location_id?: string | null
          manager?: string | null
          password_last_changed?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cyber_learner?: boolean | null
          dpe_complete?: boolean | null
          dpe_learner?: boolean | null
          employee_id?: string | null
          enrolled_in_learn?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_login?: string | null
          last_name?: string | null
          learn_complete?: boolean | null
          location?: string | null
          location_id?: string | null
          manager?: string | null
          password_last_changed?: string | null
          phone?: string | null
          start_date?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["display_name"]
          },
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_fkey"
            columns: ["manager"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers_data: Json | null
          attempt_number: number
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          id: string
          lesson_id: string
          passed: boolean
          percentage_score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers_data?: Json | null
          attempt_number?: number
          completed_at?: string | null
          correct_answers: number
          created_at?: string | null
          id?: string
          lesson_id: string
          passed: boolean
          percentage_score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers_data?: Json | null
          attempt_number?: number
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          lesson_id?: string
          passed?: boolean
          percentage_score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          is_active: boolean
          name: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          is_active?: boolean
          name: string
          role_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          is_active?: boolean
          name?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      software_inventory: {
        Row: {
          approval_authorized_date: string | null
          asset_classification: string | null
          business_purpose: string | null
          created_at: string | null
          department: string | null
          end_of_support_date: string | null
          id: string
          license_start_date: string | null
          software_name: string
          software_publisher: string | null
          software_version: string | null
          status: string | null
          term: number | null
          updated_at: string | null
        }
        Insert: {
          approval_authorized_date?: string | null
          asset_classification?: string | null
          business_purpose?: string | null
          created_at?: string | null
          department?: string | null
          end_of_support_date?: string | null
          id?: string
          license_start_date?: string | null
          software_name: string
          software_publisher?: string | null
          software_version?: string | null
          status?: string | null
          term?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_authorized_date?: string | null
          asset_classification?: string | null
          business_purpose?: string | null
          created_at?: string | null
          department?: string | null
          end_of_support_date?: string | null
          id?: string
          license_start_date?: string | null
          software_name?: string
          software_publisher?: string | null
          software_version?: string | null
          status?: string | null
          term?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_variable_translations: {
        Row: {
          created_at: string
          default_value: string | null
          display_name: string
          id: string
          language_code: string
          updated_at: string
          variable_id: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          display_name: string
          id?: string
          language_code?: string
          updated_at?: string
          variable_id: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          display_name?: string
          id?: string
          language_code?: string
          updated_at?: string
          variable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_variable_translations_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "template_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      template_variables: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      translation_change_log: {
        Row: {
          affected_translations: number | null
          change_magnitude: string | null
          change_type: string
          character_difference: number | null
          estimated_retranslation_cost: number | null
          field_name: string
          id: string
          lesson_id: string | null
          new_hash: string | null
          new_value: string | null
          old_hash: string | null
          old_value: string | null
          record_id: string
          table_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          affected_translations?: number | null
          change_magnitude?: string | null
          change_type: string
          character_difference?: number | null
          estimated_retranslation_cost?: number | null
          field_name: string
          id?: string
          lesson_id?: string | null
          new_hash?: string | null
          new_value?: string | null
          old_hash?: string | null
          old_value?: string | null
          record_id: string
          table_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          affected_translations?: number | null
          change_magnitude?: string | null
          change_type?: string
          character_difference?: number | null
          estimated_retranslation_cost?: number | null
          field_name?: string
          id?: string
          lesson_id?: string | null
          new_hash?: string | null
          new_value?: string | null
          old_hash?: string | null
          old_value?: string | null
          record_id?: string
          table_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_change_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          actual_duration: number | null
          completed_at: string | null
          completed_items: number | null
          created_at: string | null
          error_message: string | null
          estimated_duration: number | null
          failed_items: number | null
          id: string
          lesson_id: string
          max_retries: number | null
          priority: number | null
          requested_by: string | null
          retry_count: number | null
          status: string | null
          target_language: string | null
          total_characters: number | null
          total_cost: number | null
          total_items: number
          updated_at: string | null
        }
        Insert: {
          actual_duration?: number | null
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration?: number | null
          failed_items?: number | null
          id?: string
          lesson_id: string
          max_retries?: number | null
          priority?: number | null
          requested_by?: string | null
          retry_count?: number | null
          status?: string | null
          target_language?: string | null
          total_characters?: number | null
          total_cost?: number | null
          total_items: number
          updated_at?: string | null
        }
        Update: {
          actual_duration?: number | null
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration?: number | null
          failed_items?: number | null
          id?: string
          lesson_id?: string
          max_retries?: number | null
          priority?: number | null
          requested_by?: string | null
          retry_count?: number | null
          status?: string | null
          target_language?: string | null
          total_characters?: number | null
          total_cost?: number | null
          total_items?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_jobs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_target_language_fkey"
            columns: ["target_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_answer_responses: {
        Row: {
          answer_ids: string[]
          created_at: string | null
          id: string
          lesson_id: string | null
          node_id: string
          response_time_ms: number | null
          scores: number[]
          total_score: number
          user_id: string | null
        }
        Insert: {
          answer_ids: string[]
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          node_id: string
          response_time_ms?: number | null
          scores: number[]
          total_score: number
          user_id?: string | null
        }
        Update: {
          answer_ids?: string[]
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          node_id?: string
          response_time_ms?: number | null
          scores?: number[]
          total_score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answer_responses_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_analytics: {
        Row: {
          completed_at: string | null
          completion_path: string[]
          created_at: string | null
          id: string
          lesson_id: string | null
          nodes_visited: string[]
          retry_count: number | null
          session_id: string
          total_time_spent: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_path: string[]
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          nodes_visited: string[]
          retry_count?: number | null
          session_id: string
          total_time_spent: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_path?: string[]
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          nodes_visited?: string[]
          retry_count?: number | null
          session_id?: string
          total_time_spent?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deletion_audit: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deleted_at: string
          deleted_by: string
          deleted_user_email: string
          deleted_user_id: string
          deleted_user_name: string
          deletion_reason: string | null
          id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by: string
          deleted_user_email: string
          deleted_user_id: string
          deleted_user_name: string
          deletion_reason?: string | null
          id?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string
          deleted_by?: string
          deleted_user_email?: string
          deleted_user_id?: string
          deleted_user_name?: string
          deletion_reason?: string | null
          id?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          department_id: string
          id: string
          is_primary: boolean | null
          pairing_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          department_id: string
          id?: string
          is_primary?: boolean | null
          pairing_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          department_id?: string
          id?: string
          is_primary?: boolean | null
          pairing_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_track_progress: {
        Row: {
          completed_at: string | null
          current_lesson_order: number | null
          enrolled_at: string
          id: string
          learning_track_id: string
          next_available_date: string | null
          progress_percentage: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_lesson_order?: number | null
          enrolled_at?: string
          id?: string
          learning_track_id: string
          next_available_date?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_lesson_order?: number | null
          enrolled_at?: string
          id?: string
          learning_track_id?: string
          next_available_date?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_track_progress_learning_track_id_fkey"
            columns: ["learning_track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          completed_nodes: string[] | null
          current_node_id: string | null
          id: string
          last_accessed: string
          lesson_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_nodes?: string[] | null
          current_node_id?: string | null
          id?: string
          last_accessed?: string
          lesson_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_nodes?: string[] | null
          current_node_id?: string | null
          id?: string
          last_accessed?: string
          lesson_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_phishing_scores: {
        Row: {
          campaign_name: string | null
          id: string
          ip_address: string | null
          phish_date: string
          resource: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          campaign_name?: string | null
          id?: string
          ip_address?: string | null
          phish_date: string
          resource?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string | null
          id?: string
          ip_address?: string | null
          phish_date?: string
          resource?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profile_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          pairing_id: string | null
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          pairing_id?: string | null
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          pairing_id?: string | null
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile_roles_role_id"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      csba_assessment_summary_view: {
        Row: {
          avg_score: number | null
          domain: string | null
          domain_short: string | null
          num_responses: number | null
          question: string | null
          question_id: string | null
          recommendation: string | null
          type: string | null
        }
        Relationships: []
      }
      csba_detailed_insights_view: {
        Row: {
          avg_score: number | null
          domain: string | null
          domain_short: string | null
          question: string | null
          recommendation: string | null
        }
        Relationships: []
      }
      csba_domain_score_view: {
        Row: {
          domain: string | null
          domain_avg: number | null
          domain_short: string | null
          priority: number | null
          std_deviation: number | null
          weighted_percent: number | null
          weighted_score: number | null
        }
        Relationships: []
      }
      csba_key_insights_view: {
        Row: {
          domain: string | null
          insight: string | null
          n: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assess_change_magnitude: {
        Args: { new_value: string; old_value: string }
        Returns: string
      }
      check_outdated_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          needs_fixing: boolean
          outdated_completed: number
          table_name: string
          total_completed: number
        }[]
      }
      debug_outdated_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_outdated: boolean
          language_code: string
          last_modified: string
          lesson_id: string
          lesson_title: string
          translation_updated: string
        }[]
      }
      debug_translation_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          language_code: string
          lesson_id: string
          lesson_title: string
          status: string
          translation_cost: number
        }[]
      }
      fix_existing_outdated_flags: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_content_hash: {
        Args: { content: string; media_alt?: string }
        Returns: string
      }
      generate_document_assignments: {
        Args: { doc_id: string }
        Returns: undefined
      }
      generate_learning_track_assignments: {
        Args: { track_id: string }
        Returns: undefined
      }
      get_active_translation_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          completed_items: number
          created_at: string
          estimated_seconds_remaining: number
          failed_items: number
          id: string
          lesson_title: string
          progress_percentage: number
          status: string
          target_language: string
          total_cost: number
          total_items: number
          updated_at: string
        }[]
      }
      get_current_user_managed_departments: {
        Args: Record<PropertyKey, never>
        Returns: {
          department_id: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_key_dates: {
        Args: Record<PropertyKey, never>
        Returns: {
          certificate: string
          created_at: string
          created_by: string
          due_date: string
          frequency: string
          id: string
          key_activity: string
          modified_at: string
          modified_by: string
          updated_due_date: string
        }[]
      }
      get_lessons_with_outdated_content: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_by: string
          last_modified: string
          lesson_id: string
          lesson_title: string
          outdated_languages: Json
        }[]
      }
      get_lessons_with_outdated_content_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_by: string
          last_modified: string
          lesson_id: string
          lesson_title: string
          outdated_languages: Json
        }[]
      }
      get_monthly_translation_spend: {
        Args: Record<PropertyKey, never>
        Returns: {
          spend_by_language: Json
          total_monthly_spend: number
        }[]
      }
      get_nodes_needing_translation: {
        Args: { language_code: string; lesson_id: string }
        Returns: {
          content: string
          content_hash: string
          last_translation_hash: string
          media_alt: string
          needs_translation: boolean
          node_id: string
        }[]
      }
      get_outdated_lessons: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_by: string
          id: string
          last_modified: string
          node_count: number
          outdated_count: number
          outdated_node_count: number
          title: string
          translation_count: number
        }[]
      }
      get_outdated_lessons_grouped: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_by: string
          last_modified: string
          lesson_id: string
          lesson_title: string
          outdated_languages: Json
        }[]
      }
      get_recent_translation_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_time: string
          activity_type: string
          cost: number
          language_code: string
          lesson_title: string
          user_email: string
        }[]
      }
      get_translation_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          lessons_needing_updates: number
          total_lessons: number
          translated_lessons: number
        }[]
      }
      get_user_assigned_tracks: {
        Args: { user_id: string }
        Returns: {
          assignment_id: string
          completion_required: boolean
          status: string
          track_id: string
        }[]
      }
      get_user_email_by_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_id_by_email: {
        Args: { email: string }
        Returns: {
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_lesson_translations_outdated_manual: {
        Args: { lesson_uuid: string }
        Returns: undefined
      }
      refresh_outdated_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_email_notification: {
        Args: {
          p_email: string
          p_message: string
          p_scheduled_for?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      access_level_type: "admin" | "manager" | "user"
      activity_type:
        | "Risk assessment"
        | "Incident response"
        | "Business continuity"
        | "Data protection"
        | "Access control"
        | "Security monitoring"
        | "Compliance audit"
        | "Training and awareness"
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "client_admin"
        | "manager"
        | "author"
      approval_status_enum:
        | "Not Submitted"
        | "Submitted"
        | "Rejected"
        | "Approved"
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
      access_level_type: ["admin", "manager", "user"],
      activity_type: [
        "Risk assessment",
        "Incident response",
        "Business continuity",
        "Data protection",
        "Access control",
        "Security monitoring",
        "Compliance audit",
        "Training and awareness",
      ],
      app_role: [
        "admin",
        "user",
        "super_admin",
        "client_admin",
        "manager",
        "author",
      ],
      approval_status_enum: [
        "Not Submitted",
        "Submitted",
        "Rejected",
        "Approved",
      ],
    },
  },
} as const
