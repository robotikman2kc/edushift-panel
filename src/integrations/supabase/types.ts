export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      guru: {
        Row: {
          created_at: string
          email: string
          id: string
          mata_pelajaran: string
          nama_guru: string
          nip: string
          telepon: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mata_pelajaran: string
          nama_guru: string
          nip: string
          telepon?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mata_pelajaran?: string
          nama_guru?: string
          nip?: string
          telepon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kelas: {
        Row: {
          created_at: string
          id: string
          jurusan: string | null
          kapasitas: number | null
          nama_kelas: string
          status: string
          tahun_ajaran: string
          tingkat: string
          updated_at: string
          wali_kelas_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan?: string | null
          kapasitas?: number | null
          nama_kelas: string
          status?: string
          tahun_ajaran: string
          tingkat: string
          updated_at?: string
          wali_kelas_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jurusan?: string | null
          kapasitas?: number | null
          nama_kelas?: string
          status?: string
          tahun_ajaran?: string
          tingkat?: string
          updated_at?: string
          wali_kelas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_wali_kelas_id_fkey"
            columns: ["wali_kelas_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
        ]
      }
      siswa: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          jenis_kelamin: string | null
          kelas_id: string | null
          nama_orang_tua: string | null
          nama_siswa: string
          nis: string
          status: string
          tanggal_lahir: string | null
          telepon_orang_tua: string | null
          tempat_lahir: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jenis_kelamin?: string | null
          kelas_id?: string | null
          nama_orang_tua?: string | null
          nama_siswa: string
          nis: string
          status?: string
          tanggal_lahir?: string | null
          telepon_orang_tua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jenis_kelamin?: string | null
          kelas_id?: string | null
          nama_orang_tua?: string | null
          nama_siswa?: string
          nis?: string
          status?: string
          tanggal_lahir?: string | null
          telepon_orang_tua?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          nama: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nama: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nama?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
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
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "guru"
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
      user_role: ["admin", "guru"],
    },
  },
} as const
