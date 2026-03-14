-- ============================================================================
-- Healthcare Vendor Risk Management Platform - Database Schema
-- HIPAA Compliant, Multi-Tenant Architecture on Supabase
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CUSTOM TYPES / ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'compliance_officer',
  'risk_manager',
  'analyst',
  'viewer'
);

CREATE TYPE vendor_status AS ENUM (
  'active',
  'inactive',
  'pending_review',
  'onboarding',
  'offboarding',
  'suspended',
  'archived'
);

CREATE TYPE risk_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'minimal'
);

CREATE TYPE assessment_status AS ENUM (
  'draft',
  'in_progress',
  'under_review',
  'completed',
  'expired',
  'cancelled'
);

CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non_compliant',
  'partially_compliant',
  'not_assessed',
  'in_remediation',
  'waived'
);

CREATE TYPE incident_severity AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

CREATE TYPE incident_status AS ENUM (
  'reported',
  'investigating',
  'contained',
  'remediation',
  'resolved',
  'closed'
);

CREATE TYPE alert_type AS ENUM (
  'contract_expiring',
  'baa_expiring',
  'assessment_due',
  'compliance_gap',
  'incident_reported',
  'risk_score_change',
  'document_expiring',
  'remediation_overdue',
  'vendor_status_change',
  'system'
);

CREATE TYPE alert_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'info'
);

CREATE TYPE document_type AS ENUM (
  'policy',
  'procedure',
  'certificate',
  'audit_report',
  'baa',
  'contract',
  'soc2_report',
  'penetration_test',
  'risk_assessment',
  'insurance',
  'other'
);

CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_review',
  'active',
  'expired',
  'terminated',
  'renewed'
);

CREATE TYPE baa_status AS ENUM (
  'draft',
  'pending_review',
  'pending_signature',
  'active',
  'expired',
  'terminated',
  'amended'
);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  domain      TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  settings    JSONB NOT NULL DEFAULT '{}',
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'viewer',
  first_name      TEXT,
  last_name       TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  job_title       TEXT,
  department      TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------
CREATE TABLE vendors (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  slug                   TEXT NOT NULL,
  description            TEXT,
  website                TEXT,
  category               TEXT,
  status                 vendor_status NOT NULL DEFAULT 'pending_review',
  risk_score             INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level             risk_level,
  primary_contact_name   TEXT,
  primary_contact_email  TEXT,
  primary_contact_phone  TEXT,
  address                TEXT,
  city                   TEXT,
  state                  TEXT,
  zip_code               TEXT,
  country                TEXT DEFAULT 'US',
  phi_access             BOOLEAN NOT NULL DEFAULT FALSE,
  data_classification    TEXT[],
  hipaa_compliant        BOOLEAN NOT NULL DEFAULT FALSE,
  soc2_certified         BOOLEAN NOT NULL DEFAULT FALSE,
  hitrust_certified      BOOLEAN NOT NULL DEFAULT FALSE,
  tags                   TEXT[],
  metadata               JSONB DEFAULT '{}',
  onboarded_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- vendor_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE vendor_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  title      TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- risk_assessments
-- ---------------------------------------------------------------------------
CREATE TABLE risk_assessments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id          UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assessor_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  status             assessment_status NOT NULL DEFAULT 'draft',
  risk_score         INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level         risk_level,
  framework          TEXT,
  questionnaire_data JSONB DEFAULT '{}',
  findings           JSONB DEFAULT '[]',
  recommendations    JSONB DEFAULT '[]',
  due_date           TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  next_review_date   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- assessment_responses
-- ---------------------------------------------------------------------------
CREATE TABLE assessment_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
  question_id    TEXT NOT NULL,
  question_text  TEXT NOT NULL,
  response       TEXT,
  score          INTEGER CHECK (score >= 0),
  notes          TEXT,
  evidence_url   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- compliance_frameworks
-- ---------------------------------------------------------------------------
CREATE TABLE compliance_frameworks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  version         TEXT,
  description     TEXT,
  requirements    JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- compliance_items
-- ---------------------------------------------------------------------------
CREATE TABLE compliance_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
  framework_id    UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  requirement_key TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          compliance_status NOT NULL DEFAULT 'not_assessed',
  evidence_url    TEXT,
  notes           TEXT,
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- contracts
-- ---------------------------------------------------------------------------
CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  contract_type   TEXT,
  status          contract_status NOT NULL DEFAULT 'draft',
  start_date      DATE,
  end_date        DATE,
  renewal_date    DATE,
  value           DECIMAL(15, 2),
  auto_renew      BOOLEAN NOT NULL DEFAULT FALSE,
  terms           JSONB DEFAULT '{}',
  document_url    TEXT,
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- business_associate_agreements
-- ---------------------------------------------------------------------------
CREATE TABLE business_associate_agreements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id                UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contract_id              UUID REFERENCES contracts(id) ON DELETE SET NULL,
  status                   baa_status NOT NULL DEFAULT 'draft',
  version                  INTEGER NOT NULL DEFAULT 1,
  effective_date           DATE,
  expiration_date          DATE,
  phi_scope                TEXT,
  safeguards               JSONB DEFAULT '{}',
  breach_notification_terms JSONB DEFAULT '{}',
  termination_terms        JSONB DEFAULT '{}',
  document_url             TEXT,
  signed_by_org            TEXT,
  signed_by_vendor         TEXT,
  signed_at                TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_associate_agreements ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------------
CREATE TABLE incidents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id            UUID REFERENCES vendors(id) ON DELETE SET NULL,
  reported_by          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  assigned_to          UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  severity             incident_severity NOT NULL DEFAULT 'medium',
  status               incident_status NOT NULL DEFAULT 'reported',
  category             TEXT,
  affected_systems     TEXT[],
  phi_compromised      BOOLEAN NOT NULL DEFAULT FALSE,
  individuals_affected INTEGER DEFAULT 0,
  root_cause           TEXT,
  resolution           TEXT,
  timeline             JSONB DEFAULT '[]',
  reported_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- incident_updates
-- ---------------------------------------------------------------------------
CREATE TABLE incident_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  content     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
  uploaded_by     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  description     TEXT,
  document_type   document_type NOT NULL DEFAULT 'other',
  file_url        TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  tags            TEXT[],
  metadata        JSONB DEFAULT '{}',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type            alert_type NOT NULL,
  priority        alert_priority NOT NULL DEFAULT 'medium',
  title           TEXT NOT NULL,
  message         TEXT,
  source          TEXT,
  reference_id    UUID,
  reference_type  TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  details         JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- remediation_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE remediation_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id   UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
  incident_id     UUID REFERENCES incidents(id) ON DELETE SET NULL,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium',
  status          TEXT NOT NULL DEFAULT 'open',
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE remediation_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);

-- user_profiles
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- vendors
CREATE INDEX idx_vendors_organization_id ON vendors(organization_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_risk_level ON vendors(risk_level);
CREATE INDEX idx_vendors_organization_status ON vendors(organization_id, status);
CREATE INDEX idx_vendors_slug ON vendors(organization_id, slug);
CREATE INDEX idx_vendors_created_at ON vendors(created_at);
CREATE INDEX idx_vendors_phi_access ON vendors(organization_id, phi_access) WHERE phi_access = TRUE;

-- vendor_contacts
CREATE INDEX idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);

-- risk_assessments
CREATE INDEX idx_risk_assessments_organization_id ON risk_assessments(organization_id);
CREATE INDEX idx_risk_assessments_vendor_id ON risk_assessments(vendor_id);
CREATE INDEX idx_risk_assessments_assessor_id ON risk_assessments(assessor_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_due_date ON risk_assessments(due_date);
CREATE INDEX idx_risk_assessments_created_at ON risk_assessments(created_at);

-- assessment_responses
CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_question_id ON assessment_responses(assessment_id, question_id);

-- compliance_frameworks
CREATE INDEX idx_compliance_frameworks_organization_id ON compliance_frameworks(organization_id);
CREATE INDEX idx_compliance_frameworks_name ON compliance_frameworks(organization_id, name);

-- compliance_items
CREATE INDEX idx_compliance_items_organization_id ON compliance_items(organization_id);
CREATE INDEX idx_compliance_items_vendor_id ON compliance_items(vendor_id);
CREATE INDEX idx_compliance_items_framework_id ON compliance_items(framework_id);
CREATE INDEX idx_compliance_items_status ON compliance_items(status);
CREATE INDEX idx_compliance_items_created_at ON compliance_items(created_at);

-- contracts
CREATE INDEX idx_contracts_organization_id ON contracts(organization_id);
CREATE INDEX idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_renewal_date ON contracts(renewal_date);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

-- business_associate_agreements
CREATE INDEX idx_baa_organization_id ON business_associate_agreements(organization_id);
CREATE INDEX idx_baa_vendor_id ON business_associate_agreements(vendor_id);
CREATE INDEX idx_baa_contract_id ON business_associate_agreements(contract_id);
CREATE INDEX idx_baa_status ON business_associate_agreements(status);
CREATE INDEX idx_baa_expiration_date ON business_associate_agreements(expiration_date);
CREATE INDEX idx_baa_created_at ON business_associate_agreements(created_at);

-- incidents
CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_vendor_id ON incidents(vendor_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_phi_compromised ON incidents(organization_id, phi_compromised) WHERE phi_compromised = TRUE;
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- incident_updates
CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX idx_incident_updates_user_id ON incident_updates(user_id);

-- documents
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_vendor_id ON documents(vendor_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_expires_at ON documents(expires_at);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- alerts
CREATE INDEX idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_is_read ON alerts(organization_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_reference ON alerts(reference_id, reference_type);

-- audit_logs
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- remediation_tasks
CREATE INDEX idx_remediation_tasks_organization_id ON remediation_tasks(organization_id);
CREATE INDEX idx_remediation_tasks_assessment_id ON remediation_tasks(assessment_id);
CREATE INDEX idx_remediation_tasks_incident_id ON remediation_tasks(incident_id);
CREATE INDEX idx_remediation_tasks_vendor_id ON remediation_tasks(vendor_id);
CREATE INDEX idx_remediation_tasks_assigned_to ON remediation_tasks(assigned_to);
CREATE INDEX idx_remediation_tasks_status ON remediation_tasks(status);
CREATE INDEX idx_remediation_tasks_due_date ON remediation_tasks(due_date);
CREATE INDEX idx_remediation_tasks_created_at ON remediation_tasks(created_at);

-- ============================================================================
-- HELPER FUNCTIONS (depends on user_profiles table)
-- ============================================================================

-- Get the organization_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Get the role for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- organizations policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- user_profiles policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid() OR (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin')));

CREATE POLICY "Admins can delete profiles in their organization"
  ON user_profiles FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- vendors policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view vendors in their organization"
  ON vendors FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert vendors in their organization"
  ON vendors FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager'));

CREATE POLICY "Users can update vendors in their organization"
  ON vendors FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager'));

CREATE POLICY "Admins can delete vendors in their organization"
  ON vendors FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- vendor_contacts policies (scoped via vendor -> organization)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view vendor contacts in their organization"
  ON vendor_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id
      AND vendors.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can insert vendor contacts in their organization"
  ON vendor_contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id
      AND vendors.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update vendor contacts in their organization"
  ON vendor_contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id
      AND vendors.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can delete vendor contacts in their organization"
  ON vendor_contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id
      AND vendors.organization_id = get_user_organization_id()
  ));

-- ---------------------------------------------------------------------------
-- risk_assessments policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view assessments in their organization"
  ON risk_assessments FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert assessments in their organization"
  ON risk_assessments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager', 'analyst'));

CREATE POLICY "Users can update assessments in their organization"
  ON risk_assessments FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager', 'analyst'));

CREATE POLICY "Admins can delete assessments in their organization"
  ON risk_assessments FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- assessment_responses policies (scoped via assessment -> organization)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view assessment responses in their organization"
  ON assessment_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM risk_assessments WHERE risk_assessments.id = assessment_responses.assessment_id
      AND risk_assessments.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can insert assessment responses in their organization"
  ON assessment_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM risk_assessments WHERE risk_assessments.id = assessment_responses.assessment_id
      AND risk_assessments.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update assessment responses in their organization"
  ON assessment_responses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM risk_assessments WHERE risk_assessments.id = assessment_responses.assessment_id
      AND risk_assessments.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can delete assessment responses in their organization"
  ON assessment_responses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM risk_assessments WHERE risk_assessments.id = assessment_responses.assessment_id
      AND risk_assessments.organization_id = get_user_organization_id()
  ));

-- ---------------------------------------------------------------------------
-- compliance_frameworks policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view frameworks in their organization"
  ON compliance_frameworks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert frameworks in their organization"
  ON compliance_frameworks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Users can update frameworks in their organization"
  ON compliance_frameworks FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Admins can delete frameworks in their organization"
  ON compliance_frameworks FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- compliance_items policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view compliance items in their organization"
  ON compliance_items FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert compliance items in their organization"
  ON compliance_items FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager'));

CREATE POLICY "Users can update compliance items in their organization"
  ON compliance_items FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager'));

CREATE POLICY "Admins can delete compliance items in their organization"
  ON compliance_items FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- contracts policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view contracts in their organization"
  ON contracts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert contracts in their organization"
  ON contracts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Users can update contracts in their organization"
  ON contracts FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Admins can delete contracts in their organization"
  ON contracts FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- business_associate_agreements policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view BAAs in their organization"
  ON business_associate_agreements FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert BAAs in their organization"
  ON business_associate_agreements FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Users can update BAAs in their organization"
  ON business_associate_agreements FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer'));

CREATE POLICY "Admins can delete BAAs in their organization"
  ON business_associate_agreements FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- incidents policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view incidents in their organization"
  ON incidents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert incidents in their organization"
  ON incidents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update incidents in their organization"
  ON incidents FOR UPDATE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager', 'analyst'));

CREATE POLICY "Admins can delete incidents in their organization"
  ON incidents FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- incident_updates policies (scoped via incident -> organization)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view incident updates in their organization"
  ON incident_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM incidents WHERE incidents.id = incident_updates.incident_id
      AND incidents.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can insert incident updates in their organization"
  ON incident_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM incidents WHERE incidents.id = incident_updates.incident_id
      AND incidents.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update incident updates in their organization"
  ON incident_updates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete incident updates in their organization"
  ON incident_updates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM incidents WHERE incidents.id = incident_updates.incident_id
      AND incidents.organization_id = get_user_organization_id()
      AND get_user_role() IN ('owner', 'admin')
  ));

-- ---------------------------------------------------------------------------
-- documents policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view documents in their organization"
  ON documents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert documents in their organization"
  ON documents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update documents in their organization"
  ON documents FOR UPDATE
  USING (organization_id = get_user_organization_id() AND (uploaded_by = auth.uid() OR get_user_role() IN ('owner', 'admin', 'compliance_officer')));

CREATE POLICY "Admins can delete documents in their organization"
  ON documents FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- alerts policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND (user_id = auth.uid() OR get_user_role() IN ('owner', 'admin'))
  );

-- ---------------------------------------------------------------------------
-- audit_logs policies (read-only for most users; insert allowed)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- No UPDATE or DELETE policies on audit_logs: audit trail is immutable

-- ---------------------------------------------------------------------------
-- remediation_tasks policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view remediation tasks in their organization"
  ON remediation_tasks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert remediation tasks in their organization"
  ON remediation_tasks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager', 'analyst'));

CREATE POLICY "Users can update remediation tasks in their organization"
  ON remediation_tasks FOR UPDATE
  USING (organization_id = get_user_organization_id() AND (assigned_to = auth.uid() OR get_user_role() IN ('owner', 'admin', 'compliance_officer', 'risk_manager')));

CREATE POLICY "Admins can delete remediation tasks in their organization"
  ON remediation_tasks FOR DELETE
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('owner', 'admin'));

-- ============================================================================
-- 7. TRIGGERS FOR updated_at
-- ============================================================================

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_vendors
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_risk_assessments
  BEFORE UPDATE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_compliance_items
  BEFORE UPDATE ON compliance_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_contracts
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_business_associate_agreements
  BEFORE UPDATE ON business_associate_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_incidents
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_remediation_tasks
  BEFORE UPDATE ON remediation_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
