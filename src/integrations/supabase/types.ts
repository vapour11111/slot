export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          area_id: string
          area_name: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          area_id: string
          area_name: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          area_id?: string
          area_name?: string
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_paid: number | null
          booking_id: number
          entry_time: string | null
          exit_time: string | null
          payment_status: string | null
          slot_id: string
          status: string | null
          vehicle_number: string
        }
        Insert: {
          amount_paid?: number | null
          booking_id?: number
          entry_time?: string | null
          exit_time?: string | null
          payment_status?: string | null
          slot_id: string
          status?: string | null
          vehicle_number: string
        }
        Update: {
          amount_paid?: number | null
          booking_id?: number
          entry_time?: string | null
          exit_time?: string | null
          payment_status?: string | null
          slot_id?: string
          status?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "bookings_vehicle_number_fkey"
            columns: ["vehicle_number"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["vehicle_number"]
          },
        ]
      }
      parking_slots: {
        Row: {
          area_id: string
          slot_id: string
          status: string | null
        }
        Insert: {
          area_id: string
          slot_id: string
          status?: string | null
        }
        Update: {
          area_id?: string
          slot_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_slots_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["area_id"]
          },
        ]
      }
      past_booking: {
        Row: {
          amount_paid: number | null
          area_name: string
          booking_id: number
          cancelled_at: string | null
          contact_number: string
          created_at: string | null
          customer_name: string
          entry_time: string
          exit_time: string | null
          id: string
          payment_status: string | null
          slot_id: string
          status: string
          vehicle_number: string
        }
        Insert: {
          amount_paid?: number | null
          area_name: string
          booking_id: number
          cancelled_at?: string | null
          contact_number: string
          created_at?: string | null
          customer_name: string
          entry_time: string
          exit_time?: string | null
          id?: string
          payment_status?: string | null
          slot_id: string
          status: string
          vehicle_number: string
        }
        Update: {
          amount_paid?: number | null
          area_name?: string
          booking_id?: number
          cancelled_at?: string | null
          contact_number?: string
          created_at?: string | null
          customer_name?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          payment_status?: string | null
          slot_id?: string
          status?: string
          vehicle_number?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: number
          payment_id: number
          payment_method: string
          payment_time: string | null
        }
        Insert: {
          amount: number
          booking_id: number
          payment_id?: number
          payment_method: string
          payment_time?: string | null
        }
        Update: {
          amount?: number
          booking_id?: number
          payment_id?: number
          payment_method?: string
          payment_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      vehicles: {
        Row: {
          contact_number: string
          customer_name: string
          vehicle_number: string
        }
        Insert: {
          contact_number: string
          customer_name: string
          vehicle_number: string
        }
        Update: {
          contact_number?: string
          customer_name?: string
          vehicle_number?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
