-- ============================================================================
-- Provision working role-based demo profiles in org1
-- ============================================================================

WITH target_users AS (
  SELECT id, email
  FROM auth.users
  WHERE email IN (
    'owner.demo@pinnaclehealth.org',
    'admin.demo@pinnaclehealth.org',
    'compliance.demo@pinnaclehealth.org',
    'risk.demo@pinnaclehealth.org',
    'analyst.demo@pinnaclehealth.org',
    'viewer.demo@pinnaclehealth.org'
  )
),
org AS (
  SELECT id
  FROM organizations
  WHERE slug = 'pinnacle-health'
  LIMIT 1
)
INSERT INTO user_profiles (
  id,
  organization_id,
  role,
  first_name,
  last_name,
  email,
  is_active
)
SELECT
  u.id,
  o.id,
  CASE u.email
    WHEN 'owner.demo@pinnaclehealth.org' THEN 'owner'::user_role
    WHEN 'admin.demo@pinnaclehealth.org' THEN 'admin'::user_role
    WHEN 'compliance.demo@pinnaclehealth.org' THEN 'compliance_officer'::user_role
    WHEN 'risk.demo@pinnaclehealth.org' THEN 'risk_manager'::user_role
    WHEN 'analyst.demo@pinnaclehealth.org' THEN 'analyst'::user_role
    ELSE 'viewer'::user_role
  END,
  CASE u.email
    WHEN 'owner.demo@pinnaclehealth.org' THEN 'Olivia'
    WHEN 'admin.demo@pinnaclehealth.org' THEN 'Aiden'
    WHEN 'compliance.demo@pinnaclehealth.org' THEN 'Maya'
    WHEN 'risk.demo@pinnaclehealth.org' THEN 'Ravi'
    WHEN 'analyst.demo@pinnaclehealth.org' THEN 'Noah'
    ELSE 'Liam'
  END,
  'Demo',
  u.email,
  TRUE
FROM target_users u
CROSS JOIN org o
ON CONFLICT (id) DO UPDATE
SET
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active,
  updated_at = now();
