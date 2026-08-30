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
      acoes_corretivas: {
        Row: {
          data_conclusao: string | null
          data_criacao: string
          descricao: string
          id: string
          nao_conformidade_id: string
          numero: string
          observacao: string | null
          prazo: string | null
          responsavel: string | null
          status: string
          user_id: string
        }
        Insert: {
          data_conclusao?: string | null
          data_criacao?: string
          descricao: string
          id?: string
          nao_conformidade_id: string
          numero?: string
          observacao?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          data_conclusao?: string | null
          data_criacao?: string
          descricao?: string
          id?: string
          nao_conformidade_id?: string
          numero?: string
          observacao?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_corretivas_nao_conformidade_id_fkey"
            columns: ["nao_conformidade_id"]
            isOneToOne: false
            referencedRelation: "nao_conformidades"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          ativo: boolean
          categoria: string | null
          data_criacao: string
          descricao: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      fotos_acao_corretiva: {
        Row: {
          acao_corretiva_id: string
          data_upload: string
          descricao: string | null
          id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          acao_corretiva_id: string
          data_upload?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          acao_corretiva_id?: string
          data_upload?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_acao_corretiva_acao_corretiva_id_fkey"
            columns: ["acao_corretiva_id"]
            isOneToOne: false
            referencedRelation: "acoes_corretivas"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_inspecao: {
        Row: {
          data_upload: string
          descricao: string | null
          id: string
          inspecao_id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          data_upload?: string
          descricao?: string | null
          id?: string
          inspecao_id: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          data_upload?: string
          descricao?: string | null
          id?: string
          inspecao_id?: string
          nome_arquivo?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_inspecao_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_item_inspecao: {
        Row: {
          data_upload: string
          descricao: string | null
          id: string
          item_inspecao_id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          data_upload?: string
          descricao?: string | null
          id?: string
          item_inspecao_id: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          data_upload?: string
          descricao?: string | null
          id?: string
          item_inspecao_id?: string
          nome_arquivo?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_item_inspecao_item_inspecao_id_fkey"
            columns: ["item_inspecao_id"]
            isOneToOne: false
            referencedRelation: "itens_inspecao"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_nao_conformidade: {
        Row: {
          data_upload: string
          descricao: string | null
          id: string
          nao_conformidade_id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          data_upload?: string
          descricao?: string | null
          id?: string
          nao_conformidade_id: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          data_upload?: string
          descricao?: string | null
          id?: string
          nao_conformidade_id?: string
          nome_arquivo?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_nao_conformidade_nao_conformidade_id_fkey"
            columns: ["nao_conformidade_id"]
            isOneToOne: false
            referencedRelation: "nao_conformidades"
            referencedColumns: ["id"]
          },
        ]
      }
      inspecoes: {
        Row: {
          data: string
          data_criacao: string
          horario: string | null
          id: string
          local: string | null
          numero: string
          obra_id: string | null
          observacoes: string | null
          responsavel: string | null
          status: string
          tipo_inspecao: string | null
          user_id: string
        }
        Insert: {
          data?: string
          data_criacao?: string
          horario?: string | null
          id?: string
          local?: string | null
          numero?: string
          obra_id?: string | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo_inspecao?: string | null
          user_id?: string
        }
        Update: {
          data?: string
          data_criacao?: string
          horario?: string | null
          id?: string
          local?: string | null
          numero?: string
          obra_id?: string | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo_inspecao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_checklist: {
        Row: {
          ativo: boolean
          categoria: string | null
          checklist_id: string
          id: string
          ordem: number
          pergunta: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          checklist_id: string
          id?: string
          ordem?: number
          pergunta: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          checklist_id?: string
          id?: string
          ordem?: number
          pergunta?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_inspecao: {
        Row: {
          categoria: string | null
          data_criacao: string
          id: string
          inspecao_id: string
          numero: number
          observacao: string | null
          ordem: number
          pergunta: string | null
          resposta: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          data_criacao?: string
          id?: string
          inspecao_id: string
          numero?: number
          observacao?: string | null
          ordem?: number
          pergunta?: string | null
          resposta?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          categoria?: string | null
          data_criacao?: string
          id?: string
          inspecao_id?: string
          numero?: number
          observacao?: string | null
          ordem?: number
          pergunta?: string | null
          resposta?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_inspecao_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          categoria: string | null
          data_criacao: string
          descricao: string
          id: string
          inspecao_id: string | null
          item_inspecao_id: string | null
          numero: string
          obra_id: string | null
          observacao: string | null
          prazo: string | null
          responsavel: string | null
          severidade: string
          status: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          data_criacao?: string
          descricao: string
          id?: string
          inspecao_id?: string | null
          item_inspecao_id?: string | null
          numero?: string
          obra_id?: string | null
          observacao?: string | null
          prazo?: string | null
          responsavel?: string | null
          severidade?: string
          status?: string
          user_id?: string
        }
        Update: {
          categoria?: string | null
          data_criacao?: string
          descricao?: string
          id?: string
          inspecao_id?: string | null
          item_inspecao_id?: string | null
          numero?: string
          obra_id?: string | null
          observacao?: string | null
          prazo?: string | null
          responsavel?: string | null
          severidade?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_item_inspecao_id_fkey"
            columns: ["item_inspecao_id"]
            isOneToOne: false
            referencedRelation: "itens_inspecao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          data_criacao: string
          empresa: string | null
          endereco: string | null
          id: string
          nome: string
          responsavel: string | null
          status: string
          user_id: string
        }
        Insert: {
          data_criacao?: string
          empresa?: string | null
          endereco?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          data_criacao?: string
          empresa?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          data_criacao: string
          empresa: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          data_criacao?: string
          empresa?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          data_criacao?: string
          empresa?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      respostas_inspecao: {
        Row: {
          id: string
          inspecao_id: string
          item_checklist_id: string | null
          observacao: string | null
          resposta: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          inspecao_id: string
          item_checklist_id?: string | null
          observacao?: string | null
          resposta?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          inspecao_id?: string
          item_checklist_id?: string | null
          observacao?: string | null
          resposta?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_inspecao_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_inspecao_item_checklist_id_fkey"
            columns: ["item_checklist_id"]
            isOneToOne: false
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_principal: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "inspetor" | "responsavel"
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
      app_role: ["admin", "inspetor", "responsavel"],
    },
  },
} as const
