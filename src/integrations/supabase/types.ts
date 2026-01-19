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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          user_code: string | null
          name: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          department: string | null
          status: Database["public"]["Enums"]["user_status"]
          avatar: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          user_code?: string | null
          name: string
          email: string
          role?: Database["public"]["Enums"]["user_role"]
          department?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          avatar?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          user_code?: string | null
          name?: string
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
          department?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          avatar?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string | null
          start_collapsed: boolean
          sticky_header: boolean
          top_nav_mode: boolean
          sidebar_style: string | null
          font_size: string | null
          compact_mode: boolean
          email_notifications: Json
          push_notifications: Json
          security_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string | null
          start_collapsed?: boolean
          sticky_header?: boolean
          top_nav_mode?: boolean
          sidebar_style?: string | null
          font_size?: string | null
          compact_mode?: boolean
          email_notifications?: Json
          push_notifications?: Json
          security_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string | null
          start_collapsed?: boolean
          sticky_header?: boolean
          top_nav_mode?: boolean
          sidebar_style?: string | null
          font_size?: string | null
          compact_mode?: boolean
          email_notifications?: Json
          push_notifications?: Json
          security_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_page_access: {
        Row: {
          id: string
          user_id: string
          page: string
          can_view: boolean
          can_edit: boolean
          can_delete: boolean
          can_create: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          page: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          can_create?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          page?: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          can_create?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          can_export_data: boolean
          can_import_data: boolean
          can_manage_users: boolean
          can_view_reports: boolean
          can_manage_settings: boolean
          can_approve_requests: boolean
          can_bulk_operations: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          can_export_data?: boolean
          can_import_data?: boolean
          can_manage_users?: boolean
          can_view_reports?: boolean
          can_manage_settings?: boolean
          can_approve_requests?: boolean
          can_bulk_operations?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          can_export_data?: boolean
          can_import_data?: boolean
          can_manage_users?: boolean
          can_view_reports?: boolean
          can_manage_settings?: boolean
          can_approve_requests?: boolean
          can_bulk_operations?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permits: {
        Row: {
          id: string
          permit_code: string | null
          guest_name: string
          arrival_date: string
          departure_date: string
          nationality: string | null
          passport_no: string | null
          status: Database["public"]["Enums"]["permit_status"]
          uploaded: boolean
          last_updated_at: string | null
          updated_by: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          permit_code?: string | null
          guest_name: string
          arrival_date: string
          departure_date: string
          nationality?: string | null
          passport_no?: string | null
          status?: Database["public"]["Enums"]["permit_status"]
          uploaded?: boolean
          last_updated_at?: string | null
          updated_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          permit_code?: string | null
          guest_name?: string
          arrival_date?: string
          departure_date?: string
          nationality?: string | null
          passport_no?: string | null
          status?: Database["public"]["Enums"]["permit_status"]
          uploaded?: boolean
          last_updated_at?: string | null
          updated_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      permit_history: {
        Row: {
          id: string
          permit_id: string
          action: string
          action_by: string | null
          action_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          permit_id: string
          action: string
          action_by?: string | null
          action_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          permit_id?: string
          action?: string
          action_by?: string | null
          action_at?: string
          metadata?: Json
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_code: string | null
          title: string
          description: string | null
          category: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          created_by: string | null
          assigned_to: string | null
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_code?: string | null
          title: string
          description?: string | null
          category?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          created_by?: string | null
          assigned_to?: string | null
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_code?: string | null
          title?: string
          description?: string | null
          category?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          created_by?: string | null
          assigned_to?: string | null
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          report_type: string
          title: string
          description: string | null
          filters: Json
          created_by: string | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_type: string
          title: string
          description?: string | null
          filters?: Json
          created_by?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_type?: string
          title?: string
          description?: string | null
          filters?: Json
          created_by?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      user_login: {
        Row: {
          id: string
          user_id: string
          login_at: string
          success: boolean
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          login_at?: string
          success?: boolean
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          login_at?: string
          success?: boolean
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "manager" | "staff" | "viewer" | "analyst" | "user"
      user_status: "active" | "inactive"
      permit_status: "pending" | "approved" | "rejected" | "uploaded"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      notification_type: "info" | "warning" | "success" | "error"
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
      user_role: ["admin", "manager", "staff", "viewer", "analyst", "user"],
      user_status: ["active", "inactive"],
      permit_status: ["pending", "approved", "rejected", "uploaded"],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      notification_type: ["info", "warning", "success", "error"],
    },
  },
} as const
