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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      acoes_corretivas: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "acoes_corretivas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          data_criacao: string
          descricao: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          company_id?: string | null
          data_criacao?: string
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          alerta_7d_enviado: string | null
          company_id: string | null
          contractor_id: string | null
          created_at: string
          doc_type: string
          expiration_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          status: string
          title: string
          user_id: string
          version: number
        }
        Insert: {
          alerta_7d_enviado?: string | null
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          doc_type?: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          title: string
          user_id?: string
          version?: number
        }
        Update: {
          alerta_7d_enviado?: string | null
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          doc_type?: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_job_roles: {
        Row: {
          company_id: string | null
          contractor_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_job_roles_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_memberships: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          cnpj: string | null
          company_id: string | null
          contact_email: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          company_id?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          user_id?: string
        }
        Update: {
          cnpj?: string | null
          company_id?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          alerta_7d_enviado: string | null
          company_id: string | null
          created_at: string
          doc_type: string
          employee_id: string
          expiration_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          status: string
          title: string
          user_id: string
          version: number
        }
        Insert: {
          alerta_7d_enviado?: string | null
          company_id?: string | null
          created_at?: string
          doc_type?: string
          employee_id: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          title: string
          user_id?: string
          version?: number
        }
        Update: {
          alerta_7d_enviado?: string | null
          company_id?: string | null
          created_at?: string
          doc_type?: string
          employee_id?: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          blood_type: string | null
          company_id: string | null
          contractor_id: string | null
          cpf: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_phone: string | null
          id: string
          is_active: boolean
          medical_notes: string | null
          name: string
          notes: string | null
          phone: string | null
          role_title: string | null
          type: string
          user_id: string
        }
        Insert: {
          blood_type?: string | null
          company_id?: string | null
          contractor_id?: string | null
          cpf?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          type?: string
          user_id?: string
        }
        Update: {
          blood_type?: string | null
          company_id?: string | null
          contractor_id?: string | null
          cpf?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_acao_corretiva: {
        Row: {
          acao_corretiva_id: string
          company_id: string | null
          data_upload: string
          descricao: string | null
          id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          acao_corretiva_id: string
          company_id?: string | null
          data_upload?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          acao_corretiva_id?: string
          company_id?: string | null
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
          {
            foreignKeyName: "fotos_acao_corretiva_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_inspecao: {
        Row: {
          company_id: string | null
          data_upload: string
          descricao: string | null
          id: string
          inspecao_id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          data_upload?: string
          descricao?: string | null
          id?: string
          inspecao_id: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
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
            foreignKeyName: "fotos_inspecao_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          data_upload: string
          descricao: string | null
          id: string
          item_inspecao_id: string
          nome_arquivo: string | null
          url: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          data_upload?: string
          descricao?: string | null
          id?: string
          item_inspecao_id: string
          nome_arquivo?: string | null
          url: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
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
            foreignKeyName: "fotos_item_inspecao_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          data_upload: string
          descricao: string | null
          id: string
          nao_conformidade_id: string
          nome_arquivo: string | null
          tipo: string
          url: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          data_upload?: string
          descricao?: string | null
          id?: string
          nao_conformidade_id: string
          nome_arquivo?: string | null
          tipo?: string
          url: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
          data_upload?: string
          descricao?: string | null
          id?: string
          nao_conformidade_id?: string
          nome_arquivo?: string | null
          tipo?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_nao_conformidade_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          assinatura: string | null
          assinatura_cargo: string | null
          assinatura_data: string | null
          assinatura_nome: string | null
          assinatura_obra: string | null
          assinatura_obra_cargo: string | null
          assinatura_obra_data: string | null
          assinatura_obra_nome: string | null
          company_id: string | null
          data: string
          data_criacao: string
          email_engenheiro: string | null
          engenheiro_responsavel: string | null
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
          assinatura?: string | null
          assinatura_cargo?: string | null
          assinatura_data?: string | null
          assinatura_nome?: string | null
          assinatura_obra?: string | null
          assinatura_obra_cargo?: string | null
          assinatura_obra_data?: string | null
          assinatura_obra_nome?: string | null
          company_id?: string | null
          data?: string
          data_criacao?: string
          email_engenheiro?: string | null
          engenheiro_responsavel?: string | null
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
          assinatura?: string | null
          assinatura_cargo?: string | null
          assinatura_data?: string | null
          assinatura_nome?: string | null
          assinatura_obra?: string | null
          assinatura_obra_cargo?: string | null
          assinatura_obra_data?: string | null
          assinatura_obra_nome?: string | null
          company_id?: string | null
          data?: string
          data_criacao?: string
          email_engenheiro?: string | null
          engenheiro_responsavel?: string | null
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
            foreignKeyName: "inspecoes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          id: string
          ordem: number
          pergunta: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          checklist_id: string
          company_id?: string | null
          id?: string
          ordem?: number
          pergunta: string
          user_id?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          checklist_id?: string
          company_id?: string | null
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
          {
            foreignKeyName: "itens_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_inspecao: {
        Row: {
          categoria: string | null
          company_id: string | null
          data_criacao: string
          id: string
          inspecao_id: string
          local: string | null
          norma_regulamentadora: string | null
          normas_regulamentadoras: string[]
          numero: number
          observacao: string | null
          ordem: number
          pergunta: string | null
          resposta: string | null
          risco_potencial: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          company_id?: string | null
          data_criacao?: string
          id?: string
          inspecao_id: string
          local?: string | null
          norma_regulamentadora?: string | null
          normas_regulamentadoras?: string[]
          numero?: number
          observacao?: string | null
          ordem?: number
          pergunta?: string | null
          resposta?: string | null
          risco_potencial?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          categoria?: string | null
          company_id?: string | null
          data_criacao?: string
          id?: string
          inspecao_id?: string
          local?: string | null
          norma_regulamentadora?: string | null
          normas_regulamentadoras?: string[]
          numero?: number
          observacao?: string | null
          ordem?: number
          pergunta?: string | null
          resposta?: string | null
          risco_potencial?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_inspecao_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_inspecao_inspecao_id_fkey"
            columns: ["inspecao_id"]
            isOneToOne: false
            referencedRelation: "inspecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_presenca_participantes: {
        Row: {
          assinatura: string | null
          assinatura_data: string | null
          company_id: string | null
          created_at: string
          employee_id: string | null
          funcao: string | null
          id: string
          lista_id: string
          nome: string
          ordem: number
          user_id: string
        }
        Insert: {
          assinatura?: string | null
          assinatura_data?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          funcao?: string | null
          id?: string
          lista_id: string
          nome: string
          ordem?: number
          user_id: string
        }
        Update: {
          assinatura?: string | null
          assinatura_data?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          funcao?: string | null
          id?: string
          lista_id?: string
          nome?: string
          ordem?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_presenca_participantes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_presenca_participantes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_presenca_participantes_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_presenca"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_presenca: {
        Row: {
          carga_horaria: string | null
          company_id: string | null
          created_at: string
          data: string | null
          empresa: string | null
          horario: string | null
          horario_final: string | null
          horario_inicial: string | null
          id: string
          local: string | null
          modo_assinatura: string
          nome_treinamento: string | null
          tema: string
          user_id: string
        }
        Insert: {
          carga_horaria?: string | null
          company_id?: string | null
          created_at?: string
          data?: string | null
          empresa?: string | null
          horario?: string | null
          horario_final?: string | null
          horario_inicial?: string | null
          id?: string
          local?: string | null
          modo_assinatura?: string
          nome_treinamento?: string | null
          tema: string
          user_id: string
        }
        Update: {
          carga_horaria?: string | null
          company_id?: string | null
          created_at?: string
          data?: string | null
          empresa?: string | null
          horario?: string | null
          horario_final?: string | null
          horario_inicial?: string | null
          id?: string
          local?: string | null
          modo_assinatura?: string
          nome_treinamento?: string | null
          tema?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_presenca_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          acao_imediata: boolean
          categoria: string | null
          company_id: string | null
          data_acao_imediata: string | null
          data_conclusao: string | null
          data_criacao: string
          descricao: string
          descricao_acao_imediata: string | null
          emails_responsaveis: string[]
          gut_gravidade: number | null
          gut_score: number | null
          gut_tendencia: number | null
          gut_urgencia: number | null
          id: string
          inspecao_id: string | null
          item_inspecao_id: string | null
          motivo_rejeicao: string | null
          numero: string
          obra_id: string | null
          observacao: string | null
          prazo: string | null
          responsaveis: string[]
          responsavel: string | null
          severidade: string
          status: string
          ultimo_email_cobranca: string | null
          user_id: string
        }
        Insert: {
          acao_imediata?: boolean
          categoria?: string | null
          company_id?: string | null
          data_acao_imediata?: string | null
          data_conclusao?: string | null
          data_criacao?: string
          descricao: string
          descricao_acao_imediata?: string | null
          emails_responsaveis?: string[]
          gut_gravidade?: number | null
          gut_score?: number | null
          gut_tendencia?: number | null
          gut_urgencia?: number | null
          id?: string
          inspecao_id?: string | null
          item_inspecao_id?: string | null
          motivo_rejeicao?: string | null
          numero?: string
          obra_id?: string | null
          observacao?: string | null
          prazo?: string | null
          responsaveis?: string[]
          responsavel?: string | null
          severidade?: string
          status?: string
          ultimo_email_cobranca?: string | null
          user_id?: string
        }
        Update: {
          acao_imediata?: boolean
          categoria?: string | null
          company_id?: string | null
          data_acao_imediata?: string | null
          data_conclusao?: string | null
          data_criacao?: string
          descricao?: string
          descricao_acao_imediata?: string | null
          emails_responsaveis?: string[]
          gut_gravidade?: number | null
          gut_score?: number | null
          gut_tendencia?: number | null
          gut_urgencia?: number | null
          id?: string
          inspecao_id?: string | null
          item_inspecao_id?: string | null
          motivo_rejeicao?: string | null
          numero?: string
          obra_id?: string | null
          observacao?: string | null
          prazo?: string | null
          responsaveis?: string[]
          responsavel?: string | null
          severidade?: string
          status?: string
          ultimo_email_cobranca?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      nc_links: {
        Row: {
          company_id: string | null
          created_at: string
          expires_at: string
          nao_conformidade_id: string
          token: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          expires_at?: string
          nao_conformidade_id: string
          token?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          expires_at?: string
          nao_conformidade_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nc_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_links_nao_conformidade_id_fkey"
            columns: ["nao_conformidade_id"]
            isOneToOne: false
            referencedRelation: "nao_conformidades"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          company_id: string | null
          data_criacao: string
          email_engenheiro: string | null
          empresa: string | null
          endereco: string | null
          engenheiro_responsavel: string | null
          id: string
          nome: string
          responsavel: string | null
          status: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          data_criacao?: string
          email_engenheiro?: string | null
          empresa?: string | null
          endereco?: string | null
          engenheiro_responsavel?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
          data_criacao?: string
          email_engenheiro?: string | null
          empresa?: string | null
          endereco?: string | null
          engenheiro_responsavel?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pavimentos: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          nome: string
          obra_id: string
          ordem: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome: string
          obra_id: string
          ordem?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          obra_id?: string
          ordem?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pavimentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pavimentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          data_criacao: string
          empresa: string | null
          empresa_logo: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          data_criacao?: string
          empresa?: string | null
          empresa_logo?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          data_criacao?: string
          empresa?: string | null
          empresa_logo?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      respostas_inspecao: {
        Row: {
          company_id: string | null
          id: string
          inspecao_id: string
          item_checklist_id: string | null
          observacao: string | null
          resposta: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          inspecao_id: string
          item_checklist_id?: string | null
          observacao?: string | null
          resposta?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          company_id?: string | null
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
            foreignKeyName: "respostas_inspecao_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      user_company_context: {
        Row: {
          company_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_context_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_context_company_id_user_id_fkey"
            columns: ["company_id", "user_id"]
            isOneToOne: false
            referencedRelation: "company_memberships"
            referencedColumns: ["company_id", "user_id"]
          },
          {
            foreignKeyName: "user_company_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      accept_company_invitation: { Args: { p_token: string }; Returns: string }
      active_company_id: { Args: never; Returns: string }
      can_access_company_file: {
        Args: { p_bucket: string; p_path: string; p_write?: boolean }
        Returns: boolean
      }
      can_manage_company: { Args: { p_company: string }; Returns: boolean }
      can_read_company: { Args: { p_company: string }; Returns: boolean }
      company_logo_for_owner: { Args: { p_owner: string }; Returns: string }
      create_company_invitation: {
        Args: { p_email: string }
        Returns: {
          company_name: string
          invitation_id: string
          token: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_principal: { Args: { _user_id: string }; Returns: boolean }
      is_company_member: { Args: { p_company: string }; Returns: boolean }
      salvar_lista_treinamento: {
        Args: { p_dados: Json; p_id: string; p_participantes: Json }
        Returns: string
      }
      select_company: { Args: { p_company: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
