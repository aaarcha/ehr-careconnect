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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contraptions: {
        Row: {
          change_of_dressing_date: string | null
          date_inserted: string | null
          description: string | null
          details_remarks: string | null
          dislodged_date: string | null
          dislodged_reason: string | null
          due_for_changing: string | null
          id: string
          inserted_by: string | null
          location_site: string | null
          patient_id: string
          type: string
        }
        Insert: {
          change_of_dressing_date?: string | null
          date_inserted?: string | null
          description?: string | null
          details_remarks?: string | null
          dislodged_date?: string | null
          dislodged_reason?: string | null
          due_for_changing?: string | null
          id?: string
          inserted_by?: string | null
          location_site?: string | null
          patient_id: string
          type: string
        }
        Update: {
          change_of_dressing_date?: string | null
          date_inserted?: string | null
          description?: string | null
          details_remarks?: string | null
          dislodged_date?: string | null
          dislodged_reason?: string | null
          due_for_changing?: string | null
          id?: string
          inserted_by?: string | null
          location_site?: string | null
          patient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contraptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          specialty: Database["public"]["Enums"]["doctor_specialty"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          specialty: Database["public"]["Enums"]["doctor_specialty"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          specialty?: Database["public"]["Enums"]["doctor_specialty"]
          updated_at?: string | null
        }
        Relationships: []
      }
      fdar_notes: {
        Row: {
          action: string | null
          created_at: string
          data: string | null
          date_time: string
          focus: string
          id: string
          notes: string | null
          nurse_name: string | null
          patient_id: string
          response: string | null
          updated_at: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          data?: string | null
          date_time?: string
          focus: string
          id?: string
          notes?: string | null
          nurse_name?: string | null
          patient_id: string
          response?: string | null
          updated_at?: string
        }
        Update: {
          action?: string | null
          created_at?: string
          data?: string | null
          date_time?: string
          focus?: string
          id?: string
          notes?: string | null
          nurse_name?: string | null
          patient_id?: string
          response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdar_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_output_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          record_type: string
          recorded_by: string | null
          time: string
          type_description: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          record_type: string
          recorded_by?: string | null
          time?: string
          type_description: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          record_type?: string
          recorded_by?: string | null
          time?: string
          type_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_output_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      iv_fluid_monitoring: {
        Row: {
          bottle_no: number | null
          created_at: string
          date: string
          expected_time_to_consume: string | null
          id: string
          iv_solution: string
          patient_id: string
          remarks: string | null
          room_no: string | null
          running_time: string | null
          time_started: string | null
          updated_at: string
        }
        Insert: {
          bottle_no?: number | null
          created_at?: string
          date?: string
          expected_time_to_consume?: string | null
          id?: string
          iv_solution: string
          patient_id: string
          remarks?: string | null
          room_no?: string | null
          running_time?: string | null
          time_started?: string | null
          updated_at?: string
        }
        Update: {
          bottle_no?: number | null
          created_at?: string
          date?: string
          expected_time_to_consume?: string | null
          id?: string
          iv_solution?: string
          patient_id?: string
          remarks?: string | null
          room_no?: string | null
          running_time?: string | null
          time_started?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iv_fluid_monitoring_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_administration_records: {
        Row: {
          administered_times: Json | null
          created_at: string
          date: string
          dose: string
          id: string
          is_completed: boolean | null
          medication_name: string
          nurse_initials: string | null
          patient_id: string
          room_no: string | null
          route: string
          scheduled_times: Json | null
          updated_at: string
        }
        Insert: {
          administered_times?: Json | null
          created_at?: string
          date?: string
          dose: string
          id?: string
          is_completed?: boolean | null
          medication_name: string
          nurse_initials?: string | null
          patient_id: string
          room_no?: string | null
          route: string
          scheduled_times?: Json | null
          updated_at?: string
        }
        Update: {
          administered_times?: Json | null
          created_at?: string
          date?: string
          dose?: string
          id?: string
          is_completed?: boolean | null
          medication_name?: string
          nurse_initials?: string | null
          patient_id?: string
          room_no?: string | null
          route?: string
          scheduled_times?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administration_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medtechs: {
        Row: {
          account_number: string
          created_at: string | null
          id: string
          name: string
          temp_password: string | null
          user_id: string | null
        }
        Insert: {
          account_number: string
          created_at?: string | null
          id?: string
          name: string
          temp_password?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string
          created_at?: string | null
          id?: string
          name?: string
          temp_password?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      nurses: {
        Row: {
          created_at: string | null
          department: Database["public"]["Enums"]["department_type"]
          id: string
          name: string
          nurse_no: string
        }
        Insert: {
          created_at?: string | null
          department: Database["public"]["Enums"]["department_type"]
          id?: string
          name: string
          nurse_no: string
        }
        Update: {
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_type"]
          id?: string
          name?: string
          nurse_no?: string
        }
        Relationships: []
      }
      pain_assessments: {
        Row: {
          assessment_date: string | null
          description: string | null
          id: string
          intervention: string | null
          location_of_pain: string | null
          pain_tool: string
          patient_id: string
          score: string | null
        }
        Insert: {
          assessment_date?: string | null
          description?: string | null
          id?: string
          intervention?: string | null
          location_of_pain?: string | null
          pain_tool: string
          patient_id: string
          score?: string | null
        }
        Update: {
          assessment_date?: string | null
          description?: string | null
          id?: string
          intervention?: string | null
          location_of_pain?: string | null
          pain_tool?: string
          patient_id?: string
          score?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          document_type: string
          id: string
          patient_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          document_type: string
          id?: string
          patient_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_imaging: {
        Row: {
          category: string | null
          file_path: string | null
          findings: string | null
          id: string
          image_url: string | null
          imaging_date: string | null
          imaging_type: string
          notes: string | null
          patient_id: string
          performed_by: string | null
        }
        Insert: {
          category?: string | null
          file_path?: string | null
          findings?: string | null
          id?: string
          image_url?: string | null
          imaging_date?: string | null
          imaging_type: string
          notes?: string | null
          patient_id: string
          performed_by?: string | null
        }
        Update: {
          category?: string | null
          file_path?: string | null
          findings?: string | null
          id?: string
          image_url?: string | null
          imaging_date?: string | null
          imaging_type?: string
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_imaging_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_imaging_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "radtechs"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_labs: {
        Row: {
          flag: string | null
          id: string
          normal_range: string | null
          notes: string | null
          patient_id: string
          performed_by: string | null
          result_value: number | null
          results: string | null
          test_category: string | null
          test_date: string | null
          test_name: string
          unit: string | null
        }
        Insert: {
          flag?: string | null
          id?: string
          normal_range?: string | null
          notes?: string | null
          patient_id: string
          performed_by?: string | null
          result_value?: number | null
          results?: string | null
          test_category?: string | null
          test_date?: string | null
          test_name: string
          unit?: string | null
        }
        Update: {
          flag?: string | null
          id?: string
          normal_range?: string | null
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
          result_value?: number | null
          results?: string | null
          test_category?: string | null
          test_date?: string | null
          test_name?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_labs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_labs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "medtechs"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medications: {
        Row: {
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          route: string | null
          start_date: string | null
        }
        Insert: {
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          route?: string | null
          start_date?: string | null
        }
        Update: {
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          route?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vital_signs: {
        Row: {
          blood_pressure: string | null
          heart_rate: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          pain_scale: number | null
          patient_id: string
          recorded_at: string | null
          respiratory_rate: number | null
          temperature: number | null
        }
        Insert: {
          blood_pressure?: string | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id: string
          recorded_at?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Update: {
          blood_pressure?: string | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id?: string
          recorded_at?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          admit_to_department:
            | Database["public"]["Enums"]["department_type"]
            | null
          admit_to_location: string | null
          admitting_diagnosis: string | null
          age: number | null
          allergies: string[] | null
          attending_physician_id: string | null
          bmi: number | null
          civil_status: string | null
          contact_number: string | null
          created_at: string | null
          current_medications: string[] | null
          date_of_birth: string
          discharge_diagnosis: string | null
          family_history: Json | null
          height: number | null
          history_present_illness: string | null
          hospital_number: string
          id: string
          name: string
          nationality: string | null
          occupation: string | null
          past_medical_history: Json | null
          patient_number: string | null
          personal_social_history: Json | null
          philhealth: boolean | null
          place_of_birth: string | null
          problem_list: string[] | null
          referred_by: string | null
          religion: string | null
          sex: string
          spouse_guardian_contact: string | null
          spouse_guardian_name: string | null
          status: Database["public"]["Enums"]["patient_status"] | null
          temp_password: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          address?: string | null
          admit_to_department?:
            | Database["public"]["Enums"]["department_type"]
            | null
          admit_to_location?: string | null
          admitting_diagnosis?: string | null
          age?: number | null
          allergies?: string[] | null
          attending_physician_id?: string | null
          bmi?: number | null
          civil_status?: string | null
          contact_number?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          date_of_birth: string
          discharge_diagnosis?: string | null
          family_history?: Json | null
          height?: number | null
          history_present_illness?: string | null
          hospital_number: string
          id?: string
          name: string
          nationality?: string | null
          occupation?: string | null
          past_medical_history?: Json | null
          patient_number?: string | null
          personal_social_history?: Json | null
          philhealth?: boolean | null
          place_of_birth?: string | null
          problem_list?: string[] | null
          referred_by?: string | null
          religion?: string | null
          sex: string
          spouse_guardian_contact?: string | null
          spouse_guardian_name?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          temp_password?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          address?: string | null
          admit_to_department?:
            | Database["public"]["Enums"]["department_type"]
            | null
          admit_to_location?: string | null
          admitting_diagnosis?: string | null
          age?: number | null
          allergies?: string[] | null
          attending_physician_id?: string | null
          bmi?: number | null
          civil_status?: string | null
          contact_number?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          date_of_birth?: string
          discharge_diagnosis?: string | null
          family_history?: Json | null
          height?: number | null
          history_present_illness?: string | null
          hospital_number?: string
          id?: string
          name?: string
          nationality?: string | null
          occupation?: string | null
          past_medical_history?: Json | null
          patient_number?: string | null
          personal_social_history?: Json | null
          philhealth?: boolean | null
          place_of_birth?: string | null
          problem_list?: string[] | null
          referred_by?: string | null
          religion?: string | null
          sex?: string
          spouse_guardian_contact?: string | null
          spouse_guardian_name?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          temp_password?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_attending_physician_id_fkey"
            columns: ["attending_physician_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_assessments: {
        Row: {
          assessment_date: string | null
          cardiovascular_assessment: Json | null
          eent_assessment: Json | null
          gastrointestinal_assessment: Json | null
          genitourinary_assessment: Json | null
          id: string
          musculoskeletal_assessment: Json | null
          neurological_assessment: Json | null
          patient_id: string
          respiratory_assessment: Json | null
          skin_assessment: Json | null
        }
        Insert: {
          assessment_date?: string | null
          cardiovascular_assessment?: Json | null
          eent_assessment?: Json | null
          gastrointestinal_assessment?: Json | null
          genitourinary_assessment?: Json | null
          id?: string
          musculoskeletal_assessment?: Json | null
          neurological_assessment?: Json | null
          patient_id: string
          respiratory_assessment?: Json | null
          skin_assessment?: Json | null
        }
        Update: {
          assessment_date?: string | null
          cardiovascular_assessment?: Json | null
          eent_assessment?: Json | null
          gastrointestinal_assessment?: Json | null
          genitourinary_assessment?: Json | null
          id?: string
          musculoskeletal_assessment?: Json | null
          neurological_assessment?: Json | null
          patient_id?: string
          respiratory_assessment?: Json | null
          skin_assessment?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      radtechs: {
        Row: {
          account_number: string
          created_at: string | null
          id: string
          name: string
          temp_password: string | null
          user_id: string | null
        }
        Insert: {
          account_number: string
          created_at?: string | null
          id?: string
          name: string
          temp_password?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string
          created_at?: string | null
          id?: string
          name?: string
          temp_password?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          patient_alerts: boolean | null
          system_updates: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_save?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          patient_alerts?: boolean | null
          system_updates?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_save?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          patient_alerts?: boolean | null
          system_updates?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          account_number: string | null
          created_at: string | null
          id: string
          patient_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          patient_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string | null
          id?: string
          patient_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_staff_recipients: {
        Args: never
        Returns: {
          display_name: string
          role: string
          user_id: string
        }[]
      }
      get_patient_number: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      department_type:
        | "WARD"
        | "OR"
        | "ICU"
        | "ER"
        | "HEMO"
        | "OUT_PATIENT"
        | "IN_PATIENT"
      doctor_specialty:
        | "Allergy and Immunology"
        | "Anesthesiology"
        | "Cardiology"
        | "Colon and Rectal Surgery"
        | "Dermatology"
        | "Diagnostic Radiology"
        | "Emergency Medicine"
        | "Family Medicine"
        | "General Surgery"
        | "Internal Medicine"
        | "Medical Genetics and Genomics"
        | "Neurological Surgery"
        | "Neurology"
        | "Nuclear Medicine"
        | "Obstetrics and Gynecology"
        | "Occupational Medicine"
        | "Ophthalmology"
        | "Orthopaedic Surgery"
        | "Otolaryngology (ENT)"
        | "Pathology"
        | "Pediatrics"
        | "Physical Medicine and Rehabilitation (PM&R)"
        | "Plastic Surgery"
        | "Preventive Medicine"
        | "Psychiatry"
        | "Radiation Oncology"
        | "Thoracic Surgery"
        | "Urology"
      patient_status: "active" | "archived"
      user_role: "staff" | "medtech" | "radtech" | "patient"
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
      department_type: [
        "WARD",
        "OR",
        "ICU",
        "ER",
        "HEMO",
        "OUT_PATIENT",
        "IN_PATIENT",
      ],
      doctor_specialty: [
        "Allergy and Immunology",
        "Anesthesiology",
        "Cardiology",
        "Colon and Rectal Surgery",
        "Dermatology",
        "Diagnostic Radiology",
        "Emergency Medicine",
        "Family Medicine",
        "General Surgery",
        "Internal Medicine",
        "Medical Genetics and Genomics",
        "Neurological Surgery",
        "Neurology",
        "Nuclear Medicine",
        "Obstetrics and Gynecology",
        "Occupational Medicine",
        "Ophthalmology",
        "Orthopaedic Surgery",
        "Otolaryngology (ENT)",
        "Pathology",
        "Pediatrics",
        "Physical Medicine and Rehabilitation (PM&R)",
        "Plastic Surgery",
        "Preventive Medicine",
        "Psychiatry",
        "Radiation Oncology",
        "Thoracic Surgery",
        "Urology",
      ],
      patient_status: ["active", "archived"],
      user_role: ["staff", "medtech", "radtech", "patient"],
    },
  },
} as const
