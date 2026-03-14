import type { User } from '@supabase/supabase-js'
import type { Database } from './database'

export type { Database } from './database'
export type {
  UserRole,
  VendorStatus,
  RiskLevel,
  AssessmentStatus,
  ComplianceStatus,
  IncidentSeverity,
  IncidentStatus,
  AlertType,
  AlertPriority,
  DocumentType,
  ContractStatus,
  BaaStatus,
} from './database'

// Table row type helpers
export type Organization = Database['public']['Tables']['organizations']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorContact = Database['public']['Tables']['vendor_contacts']['Row']
export type RiskAssessment = Database['public']['Tables']['risk_assessments']['Row']
export type AssessmentResponse = Database['public']['Tables']['assessment_responses']['Row']
export type ComplianceFramework = Database['public']['Tables']['compliance_frameworks']['Row']
export type ComplianceItem = Database['public']['Tables']['compliance_items']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type BusinessAssociateAgreement = Database['public']['Tables']['business_associate_agreements']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type IncidentUpdate = Database['public']['Tables']['incident_updates']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type RemediationTask = Database['public']['Tables']['remediation_tasks']['Row']

// Application-level types

export interface UserWithProfile extends User {
  profile: UserProfile
}

export interface DashboardMetrics {
  total_vendors: number
  high_risk_vendors: number
  pending_assessments: number
  compliance_rate: number
  active_incidents: number
  expiring_contracts: number
  recent_alerts_count: number
  risk_score_avg: number
}

export interface VendorWithAssessments extends Vendor {
  risk_assessments: RiskAssessment[]
  contracts: Contract[]
  compliance_items: ComplianceItem[]
}

export interface AssessmentWithVendor extends RiskAssessment {
  vendor: Vendor
  responses: AssessmentResponse[]
}

export interface Pagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  pagination?: Pagination
}

export interface FilterParams {
  search?: string
  status?: string
  risk_level?: string
  category?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
