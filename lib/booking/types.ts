/**
 * Database type definitions generated from Supabase schema
 * These types provide type safety for database queries
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type user_role = 'owner' | 'operations_staff' | 'instructor' | 'demo_viewer';

export type booking_status = 
  | 'draft'
  | 'held'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'reschedule_required';

export type licence_stage =
  | 'assessment'
  | 'learner_preparation'
  | 'learner_test'
  | 'practical_training'
  | 'licence_preparation'
  | 'test_scheduled'
  | 'completed';

export type payment_status =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid'
  | 'refunded'
  | 'partially_refunded';

export interface Database {
  public: {
    Tables: {
      dashboard_users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: user_role
          is_active: boolean
          mfa_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: user_role
          is_active?: boolean
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: user_role
          is_active?: boolean
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      telegram_accounts: {
        Row: {
          id: string
          dashboard_user_id: string
          telegram_user_id: number
          chat_id: number
          is_linked: boolean
          linked_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          dashboard_user_id: string
          telegram_user_id: number
          chat_id: number
          is_linked?: boolean
          linked_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dashboard_user_id?: string
          telegram_user_id?: number
          chat_id?: number
          is_linked?: boolean
          linked_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          setup_buffer_minutes: number
          travel_buffer_minutes: number
          price_cents: number
          deposit_cents: number
          capacity: number
          prerequisites: string[] | null
          required_resources: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_minutes: number
          setup_buffer_minutes?: number
          travel_buffer_minutes?: number
          price_cents: number
          deposit_cents?: number
          capacity?: number
          prerequisites?: string[] | null
          required_resources?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          setup_buffer_minutes?: number
          travel_buffer_minutes?: number
          price_cents?: number
          deposit_cents?: number
          capacity?: number
          prerequisites?: string[] | null
          required_resources?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      instructors: {
        Row: {
          id: string
          user_id: string
          qualifications: string[] | null
          certified_courses: string[] | null
          working_hours_start: string
          working_hours_end: string
          working_days: number[] | null
          hourly_rate_cents: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          qualifications?: string[] | null
          certified_courses?: string[] | null
          working_hours_start?: string
          working_hours_end?: string
          working_days?: number[] | null
          hourly_rate_cents?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          qualifications?: string[] | null
          certified_courses?: string[] | null
          working_hours_start?: string
          working_hours_end?: string
          working_days?: number[] | null
          hourly_rate_cents?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          type: string
          model: string | null
          license_plate: string | null
          is_available: boolean
          permitted_courses: string[] | null
          maintenance_schedule: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          model?: string | null
          license_plate?: string | null
          is_available?: boolean
          permitted_courses?: string[] | null
          maintenance_schedule?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          model?: string | null
          license_plate?: string | null
          is_available?: boolean
          permitted_courses?: string[] | null
          maintenance_schedule?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          riding_level: string | null
          riding_experience: string | null
          has_own_motorcycle: boolean
          own_motorcycle_details: string | null
          learner_license_number: string | null
          learner_license_expiry: string | null
          licence_stage: licence_stage
          communication_consent: boolean
          communication_preference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          riding_level?: string | null
          riding_experience?: string | null
          has_own_motorcycle?: boolean
          own_motorcycle_details?: string | null
          learner_license_number?: string | null
          learner_license_expiry?: string | null
          licence_stage?: licence_stage
          communication_consent?: boolean
          communication_preference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          riding_level?: string | null
          riding_experience?: string | null
          has_own_motorcycle?: boolean
          own_motorcycle_details?: string | null
          learner_license_number?: string | null
          learner_license_expiry?: string | null
          licence_stage?: licence_stage
          communication_consent?: boolean
          communication_preference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          customer_id: string
          course_id: string
          instructor_id: string | null
          status: booking_status
          start_time: string
          end_time: string
          location: string | null
          price_cents: number
          deposit_paid_cents: number
          payment_status: payment_status
          refund_status: string | null
          source: string
          created_by: string
          confirmed_at: string | null
          confirmed_by: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_number: string
          customer_id: string
          course_id: string
          instructor_id?: string | null
          status?: booking_status
          start_time: string
          end_time: string
          location?: string | null
          price_cents: number
          deposit_paid_cents?: number
          payment_status?: payment_status
          refund_status?: string | null
          source?: string
          created_by: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_number?: string
          customer_id?: string
          course_id?: string
          instructor_id?: string | null
          status?: booking_status
          start_time?: string
          end_time?: string
          location?: string | null
          price_cents?: number
          deposit_paid_cents?: number
          payment_status?: payment_status
          refund_status?: string | null
          source?: string
          created_by?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      booking_resources: {
        Row: {
          id: string
          booking_id: string
          resource_id: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          resource_id: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          resource_id?: string
          created_at?: string
        }
      }
      availability_blocks: {
        Row: {
          id: string
          instructor_id: string | null
          resource_id: string | null
          block_type: string
          reason: string | null
          start_time: string
          end_time: string
          is_recurring: boolean
          recurrence_pattern: Json | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          instructor_id?: string | null
          resource_id?: string | null
          block_type: string
          reason?: string | null
          start_time: string
          end_time: string
          is_recurring?: boolean
          recurrence_pattern?: Json | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string | null
          resource_id?: string | null
          block_type?: string
          reason?: string | null
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          recurrence_pattern?: Json | null
          created_by?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount_cents: number
          payment_method: string
          payment_type: string
          status: string
          transaction_reference: string | null
          paid_at: string | null
          processed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount_cents: number
          payment_method: string
          payment_type: string
          status?: string
          transaction_reference?: string | null
          paid_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount_cents?: number
          payment_method?: string
          payment_type?: string
          status?: string
          transaction_reference?: string | null
          paid_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      licence_milestones: {
        Row: {
          id: string
          customer_id: string
          stage: licence_stage
          status: string
          scheduled_date: string | null
          completed_date: string | null
          instructor_notes: string | null
          outcome: string | null
          next_recommended_action: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          stage: licence_stage
          status?: string
          scheduled_date?: string | null
          completed_date?: string | null
          instructor_notes?: string | null
          outcome?: string | null
          next_recommended_action?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          stage?: licence_stage
          status?: string
          scheduled_date?: string | null
          completed_date?: string | null
          instructor_notes?: string | null
          outcome?: string | null
          next_recommended_action?: string | null
          created_by?: string
          created_at?: string
        }
      }
      audit_events: {
        Row: {
          id: string
          event_type: string
          entity_type: string
          entity_id: string
          actor_user_id: string
          actor_channel: string
          before_values: Json | null
          after_values: Json | null
          request_context: Json | null
          correlation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          entity_type: string
          entity_id: string
          actor_user_id: string
          actor_channel?: string
          before_values?: Json | null
          after_values?: Json | null
          request_context?: Json | null
          correlation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          entity_type?: string
          entity_id?: string
          actor_user_id?: string
          actor_channel?: string
          before_values?: Json | null
          after_values?: Json | null
          request_context?: Json | null
          correlation_id?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: user_role
      booking_status: booking_status
      licence_stage: licence_stage
      payment_status: payment_status
    }
  }
}
