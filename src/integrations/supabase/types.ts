export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      academic_periods: {
        Row: {
          code: string;
          created_at: string;
          ends_on: string;
          id: string;
          name: string;
          starts_on: string;
          status: Database["public"]["Enums"]["academic_period_status"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          ends_on: string;
          id?: string;
          name: string;
          starts_on: string;
          status?: Database["public"]["Enums"]["academic_period_status"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          ends_on?: string;
          id?: string;
          name?: string;
          starts_on?: string;
          status?: Database["public"]["Enums"]["academic_period_status"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "academic_periods_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          completed_on: string | null;
          created_at: string;
          enrolled_on: string;
          id: string;
          period_id: string;
          status: Database["public"]["Enums"]["enrollment_status"];
          student_profile_id: string;
          study_group_id: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          completed_on?: string | null;
          created_at?: string;
          enrolled_on?: string;
          id?: string;
          period_id: string;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_profile_id: string;
          study_group_id: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          completed_on?: string | null;
          created_at?: string;
          enrolled_on?: string;
          id?: string;
          period_id?: string;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_profile_id?: string;
          study_group_id?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "academic_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_profile_id_fkey";
            columns: ["student_profile_id"];
            isOneToOne: false;
            referencedRelation: "student_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_study_group_id_fkey";
            columns: ["study_group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["membership_status"];
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          id?: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          id?: string;
          permission?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      student_profiles: {
        Row: {
          avatar_url: string | null;
          birth_date: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          notes: string | null;
          phone: string | null;
          student_number: string;
          tenant_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          birth_date?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          student_number: string;
          tenant_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          birth_date?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          student_number?: string;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      study_groups: {
        Row: {
          capacity: number;
          code: string;
          created_at: string;
          id: string;
          level: string | null;
          name: string;
          period_id: string;
          room: string | null;
          status: Database["public"]["Enums"]["study_group_status"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          code: string;
          created_at?: string;
          id?: string;
          level?: string | null;
          name: string;
          period_id: string;
          room?: string | null;
          status?: Database["public"]["Enums"]["study_group_status"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          code?: string;
          created_at?: string;
          id?: string;
          level?: string | null;
          name?: string;
          period_id?: string;
          room?: string | null;
          status?: Database["public"]["Enums"]["study_group_status"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_groups_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "academic_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_assignments: {
        Row: {
          assigned_on: string;
          assignment_role: Database["public"]["Enums"]["teacher_assignment_role"];
          created_at: string;
          id: string;
          study_group_id: string;
          teacher_user_id: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          assigned_on?: string;
          assignment_role?: Database["public"]["Enums"]["teacher_assignment_role"];
          created_at?: string;
          id?: string;
          study_group_id: string;
          teacher_user_id: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          assigned_on?: string;
          assignment_role?: Database["public"]["Enums"]["teacher_assignment_role"];
          created_at?: string;
          id?: string;
          study_group_id?: string;
          teacher_user_id?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_study_group_id_fkey";
            columns: ["study_group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teacher_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _tenant_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string };
        Returns: boolean;
      };
      shares_tenant_with: {
        Args: { _other_user_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      academic_period_status: "draft" | "active" | "archived";
      app_role: "owner" | "admin" | "instructor" | "staff" | "student";
      enrollment_status: "active" | "completed" | "suspended" | "dropped";
      membership_status: "invited" | "active" | "suspended" | "revoked";
      study_group_status: "draft" | "active" | "archived";
      teacher_assignment_role: "lead" | "assistant";
      tenant_status: "active" | "suspended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      academic_period_status: ["draft", "active", "archived"],
      app_role: ["owner", "admin", "instructor", "staff", "student"],
      enrollment_status: ["active", "completed", "suspended", "dropped"],
      membership_status: ["invited", "active", "suspended", "revoked"],
      study_group_status: ["draft", "active", "archived"],
      teacher_assignment_role: ["lead", "assistant"],
      tenant_status: ["active", "suspended"],
    },
  },
} as const;
