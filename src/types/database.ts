// These types MUST match the SQL enums in supabase/migrations exactly.
export type UserRole = 'owner' | 'admin' | 'compliance_officer' | 'risk_manager' | 'analyst' | 'viewer'
export type VendorStatus = 'active' | 'inactive' | 'pending_review' | 'onboarding' | 'offboarding' | 'suspended' | 'archived'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal'
export type AssessmentStatus = 'draft' | 'in_progress' | 'under_review' | 'completed' | 'expired' | 'cancelled'
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed' | 'in_remediation' | 'waived'
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'reported' | 'investigating' | 'contained' | 'remediation' | 'resolved' | 'closed'
export type AlertType = 'contract_expiring' | 'baa_expiring' | 'assessment_due' | 'compliance_gap' | 'incident_reported' | 'risk_score_change' | 'document_expiring' | 'remediation_overdue' | 'vendor_status_change' | 'system'
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type DocumentType = 'policy' | 'procedure' | 'certificate' | 'audit_report' | 'baa' | 'contract' | 'soc2_report' | 'penetration_test' | 'risk_assessment' | 'insurance' | 'other'
export type ContractStatus = 'draft' | 'pending_review' | 'active' | 'expired' | 'terminated' | 'renewed'
export type BaaStatus = 'draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'amended'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          subscription_tier: string
          settings: Record<string, unknown>
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          subscription_tier?: string
          settings?: Record<string, unknown>
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          subscription_tier?: string
          settings?: Record<string, unknown>
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          organization_id: string
          role: UserRole
          first_name: string | null
          last_name: string | null
          email: string
          phone: string | null
          job_title: string | null
          department: string | null
          avatar_url: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          role?: UserRole
          first_name?: string | null
          last_name?: string | null
          email: string
          phone?: string | null
          job_title?: string | null
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: UserRole
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string | null
          job_title?: string | null
          department?: string | null
          avatar_url?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          website: string | null
          category: string | null
          status: VendorStatus
          risk_score: number | null
          risk_level: RiskLevel | null
          primary_contact_name: string | null
          primary_contact_email: string | null
          primary_contact_phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          phi_access: boolean
          data_classification: string[] | null
          hipaa_compliant: boolean
          soc2_certified: boolean
          hitrust_certified: boolean
          tags: string[] | null
          metadata: Record<string, unknown> | null
          onboarded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          website?: string | null
          category?: string | null
          status?: VendorStatus
          risk_score?: number | null
          risk_level?: RiskLevel | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          phi_access?: boolean
          data_classification?: string[] | null
          hipaa_compliant?: boolean
          soc2_certified?: boolean
          hitrust_certified?: boolean
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          website?: string | null
          category?: string | null
          status?: VendorStatus
          risk_score?: number | null
          risk_level?: RiskLevel | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          phi_access?: boolean
          data_classification?: string[] | null
          hipaa_compliant?: boolean
          soc2_certified?: boolean
          hitrust_certified?: boolean
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          id: string
          vendor_id: string
          name: string
          email: string | null
          phone: string | null
          title: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          email?: string | null
          phone?: string | null
          title?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          title?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string
          assessor_id: string | null
          title: string
          description: string | null
          status: AssessmentStatus
          risk_score: number | null
          risk_level: RiskLevel | null
          framework: string | null
          questionnaire_data: Record<string, unknown> | null
          findings: Record<string, unknown>[] | null
          recommendations: Record<string, unknown>[] | null
          due_date: string | null
          completed_at: string | null
          next_review_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id: string
          assessor_id?: string | null
          title: string
          description?: string | null
          status?: AssessmentStatus
          risk_score?: number | null
          risk_level?: RiskLevel | null
          framework?: string | null
          questionnaire_data?: Record<string, unknown> | null
          findings?: Record<string, unknown>[] | null
          recommendations?: Record<string, unknown>[] | null
          due_date?: string | null
          completed_at?: string | null
          next_review_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string
          assessor_id?: string | null
          title?: string
          description?: string | null
          status?: AssessmentStatus
          risk_score?: number | null
          risk_level?: RiskLevel | null
          framework?: string | null
          questionnaire_data?: Record<string, unknown> | null
          findings?: Record<string, unknown>[] | null
          recommendations?: Record<string, unknown>[] | null
          due_date?: string | null
          completed_at?: string | null
          next_review_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          id: string
          assessment_id: string
          question_id: string
          question_text: string
          response: string | null
          score: number | null
          notes: string | null
          evidence_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          question_id: string
          question_text: string
          response?: string | null
          score?: number | null
          notes?: string | null
          evidence_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          question_id?: string
          question_text?: string
          response?: string | null
          score?: number | null
          notes?: string | null
          evidence_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      compliance_frameworks: {
        Row: {
          id: string
          organization_id: string
          name: string
          version: string | null
          description: string | null
          requirements: Record<string, unknown>[] | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          version?: string | null
          description?: string | null
          requirements?: Record<string, unknown>[] | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          version?: string | null
          description?: string | null
          requirements?: Record<string, unknown>[] | null
          created_at?: string
        }
        Relationships: []
      }
      compliance_items: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string | null
          framework_id: string
          requirement_key: string
          title: string
          description: string | null
          status: ComplianceStatus
          evidence_url: string | null
          notes: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id?: string | null
          framework_id: string
          requirement_key: string
          title: string
          description?: string | null
          status?: ComplianceStatus
          evidence_url?: string | null
          notes?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string | null
          framework_id?: string
          requirement_key?: string
          title?: string
          description?: string | null
          status?: ComplianceStatus
          evidence_url?: string | null
          notes?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string
          title: string
          contract_type: string | null
          status: ContractStatus
          start_date: string | null
          end_date: string | null
          renewal_date: string | null
          value: number | null
          auto_renew: boolean
          terms: Record<string, unknown> | null
          document_url: string | null
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id: string
          title: string
          contract_type?: string | null
          status?: ContractStatus
          start_date?: string | null
          end_date?: string | null
          renewal_date?: string | null
          value?: number | null
          auto_renew?: boolean
          terms?: Record<string, unknown> | null
          document_url?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string
          title?: string
          contract_type?: string | null
          status?: ContractStatus
          start_date?: string | null
          end_date?: string | null
          renewal_date?: string | null
          value?: number | null
          auto_renew?: boolean
          terms?: Record<string, unknown> | null
          document_url?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_associate_agreements: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string
          contract_id: string | null
          status: BaaStatus
          version: number
          effective_date: string | null
          expiration_date: string | null
          phi_scope: string | null
          safeguards: Record<string, unknown> | null
          breach_notification_terms: Record<string, unknown> | null
          termination_terms: Record<string, unknown> | null
          document_url: string | null
          signed_by_org: string | null
          signed_by_vendor: string | null
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id: string
          contract_id?: string | null
          status?: BaaStatus
          version?: number
          effective_date?: string | null
          expiration_date?: string | null
          phi_scope?: string | null
          safeguards?: Record<string, unknown> | null
          breach_notification_terms?: Record<string, unknown> | null
          termination_terms?: Record<string, unknown> | null
          document_url?: string | null
          signed_by_org?: string | null
          signed_by_vendor?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string
          contract_id?: string | null
          status?: BaaStatus
          version?: number
          effective_date?: string | null
          expiration_date?: string | null
          phi_scope?: string | null
          safeguards?: Record<string, unknown> | null
          breach_notification_terms?: Record<string, unknown> | null
          termination_terms?: Record<string, unknown> | null
          document_url?: string | null
          signed_by_org?: string | null
          signed_by_vendor?: string | null
          signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string | null
          reported_by: string
          assigned_to: string | null
          title: string
          description: string | null
          severity: IncidentSeverity
          status: IncidentStatus
          category: string | null
          affected_systems: string[] | null
          phi_compromised: boolean
          individuals_affected: number | null
          root_cause: string | null
          resolution: string | null
          timeline: Record<string, unknown>[] | null
          reported_at: string
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id?: string | null
          reported_by: string
          assigned_to?: string | null
          title: string
          description?: string | null
          severity?: IncidentSeverity
          status?: IncidentStatus
          category?: string | null
          affected_systems?: string[] | null
          phi_compromised?: boolean
          individuals_affected?: number | null
          root_cause?: string | null
          resolution?: string | null
          timeline?: Record<string, unknown>[] | null
          reported_at?: string
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string | null
          reported_by?: string
          assigned_to?: string | null
          title?: string
          description?: string | null
          severity?: IncidentSeverity
          status?: IncidentStatus
          category?: string | null
          affected_systems?: string[] | null
          phi_compromised?: boolean
          individuals_affected?: number | null
          root_cause?: string | null
          resolution?: string | null
          timeline?: Record<string, unknown>[] | null
          reported_at?: string
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_updates: {
        Row: {
          id: string
          incident_id: string
          user_id: string
          content: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          user_id: string
          content: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          user_id?: string
          content?: string
          is_internal?: boolean
          created_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          vendor_id: string | null
          uploaded_by: string
          name: string
          description: string | null
          document_type: DocumentType
          file_url: string
          file_size: number | null
          mime_type: string | null
          version: number
          tags: string[] | null
          metadata: Record<string, unknown> | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          vendor_id?: string | null
          uploaded_by: string
          name: string
          description?: string | null
          document_type?: DocumentType
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          version?: number
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          vendor_id?: string | null
          uploaded_by?: string
          name?: string
          description?: string | null
          document_type?: DocumentType
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          version?: number
          tags?: string[] | null
          metadata?: Record<string, unknown> | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          type: AlertType
          priority: AlertPriority
          title: string
          message: string | null
          source: string | null
          reference_id: string | null
          reference_type: string | null
          is_read: boolean
          read_at: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          type: AlertType
          priority: AlertPriority
          title: string
          message?: string | null
          source?: string | null
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          read_at?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          type?: AlertType
          priority?: AlertPriority
          title?: string
          message?: string | null
          source?: string | null
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          read_at?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Record<string, unknown> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      remediation_tasks: {
        Row: {
          id: string
          organization_id: string
          assessment_id: string | null
          incident_id: string | null
          vendor_id: string
          assigned_to: string | null
          title: string
          description: string | null
          priority: string
          status: string
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          assessment_id?: string | null
          incident_id?: string | null
          vendor_id: string
          assigned_to?: string | null
          title: string
          description?: string | null
          priority?: string
          status?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          assessment_id?: string | null
          incident_id?: string | null
          vendor_id?: string
          assigned_to?: string | null
          title?: string
          description?: string | null
          priority?: string
          status?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
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
      user_role: UserRole
      vendor_status: VendorStatus
      risk_level: RiskLevel
      assessment_status: AssessmentStatus
      compliance_status: ComplianceStatus
      incident_severity: IncidentSeverity
      incident_status: IncidentStatus
      alert_type: AlertType
      alert_priority: AlertPriority
      document_type: DocumentType
      contract_status: ContractStatus
      baa_status: BaaStatus
    }
  }
}
