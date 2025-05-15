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
      building_notes: {
        Row: {
          building_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          building_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          building_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_notes_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      elements: {
        Row: {
          created_at: string
          floor_plan_id: string
          id: string
          rotation: number | null
          size: number | null
          type: string
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          floor_plan_id: string
          id?: string
          rotation?: number | null
          size?: number | null
          type: string
          updated_at?: string
          x: number
          y: number
        }
        Update: {
          created_at?: string
          floor_plan_id?: string
          id?: string
          rotation?: number | null
          size?: number | null
          type?: string
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "elements_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "floor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plans: {
        Row: {
          building_id: string | null
          created_at: string
          floor_number: number | null
          id: string
          name: string
          pdf_data: string | null
          pdf_url: string | null
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          floor_number?: number | null
          id?: string
          name: string
          pdf_data?: string | null
          pdf_url?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          floor_number?: number | null
          id?: string
          name?: string
          pdf_data?: string | null
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invitation_token: string | null
          invited_email: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_token?: string | null
          invited_email?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invitation_token?: string | null
          invited_email?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          buildings_limit: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          buildings_limit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          buildings_limit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_building_counts: {
        Row: {
          buildings_count: number | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buildings_count?: number | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buildings_count?: number | null
          created_at?: string
          id?: string
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
      accept_org_invitation: {
        Args: { token: string }
        Returns: boolean
      }
      create_organization_with_admin: {
        Args: { org_name: string; admin_user_id: string }
        Returns: string
      }
      invite_org_member: {
        Args: { org_id: string; email: string; invite_role?: string }
        Returns: string
      }
      is_org_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string }
        Returns: boolean
      }
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
