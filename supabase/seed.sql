-- ============================================================================
-- Healthcare Vendor Risk Management Platform - Seed Data
-- ============================================================================
-- This seed creates deterministic auth users first so user_profiles FK inserts succeed.
-- Default password for all seeded users: ChangeMeNow!123
-- ============================================================================

BEGIN;

-- ============================================================================
-- AUTH USERS (required for user_profiles.id FK)
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'sarah.chen@pinnaclehealth.org', extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'james.patterson@pinnaclehealth.org', extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated', 'authenticated', 'maria.gonzalez@pinnaclehealth.org', extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated', 'authenticated', 'robert.williams@lakewoodmed.com', extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'priya.sharma@lakewoodmed.com', extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"sarah.chen@pinnaclehealth.org"}', 'email', 'sarah.chen@pinnaclehealth.org', now(), now(), now()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"james.patterson@pinnaclehealth.org"}', 'email', 'james.patterson@pinnaclehealth.org', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"maria.gonzalez@pinnaclehealth.org"}', 'email', 'maria.gonzalez@pinnaclehealth.org', now(), now(), now()),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","email":"robert.williams@lakewoodmed.com"}', 'email', 'robert.williams@lakewoodmed.com', now(), now(), now()),
  (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '{"sub":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","email":"priya.sharma@lakewoodmed.com"}', 'email', 'priya.sharma@lakewoodmed.com', now(), now(), now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
INSERT INTO organizations (id, name, slug, domain, subscription_tier, settings, logo_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pinnacle Health System', 'pinnacle-health', 'pinnaclehealth.org', 'enterprise', '{"max_vendors": 100, "hipaa_mode": true, "sso_enabled": true}', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lakewood Regional Medical Center', 'lakewood-medical', 'lakewoodmed.com', 'professional', '{"max_vendors": 50, "hipaa_mode": true, "sso_enabled": false}', NULL);

-- ============================================================================
-- USER PROFILES
-- ============================================================================
INSERT INTO user_profiles (id, organization_id, role, first_name, last_name, email, phone, job_title, department, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner',              'Sarah',   'Chen',       'sarah.chen@pinnaclehealth.org',   '(555) 100-0001', 'Chief Information Security Officer', 'Information Security', TRUE),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'admin',              'James',   'Patterson',  'james.patterson@pinnaclehealth.org','(555) 100-0002', 'IT Security Manager',               'Information Security', TRUE),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'compliance_officer', 'Maria',   'Gonzalez',   'maria.gonzalez@pinnaclehealth.org','(555) 100-0003', 'HIPAA Compliance Officer',          'Compliance',           TRUE),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'owner',              'Robert',  'Williams',   'robert.williams@lakewoodmed.com', '(555) 200-0001', 'VP of Information Technology',      'IT Administration',    TRUE),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'analyst',            'Priya',   'Sharma',     'priya.sharma@lakewoodmed.com',    '(555) 200-0002', 'Security Analyst',                  'IT Security',          TRUE);

-- ============================================================================
-- VENDORS  (org1 gets 8 vendors, org2 gets 4 vendors)
-- ============================================================================

-- Fixed vendor UUIDs so we can reference them later
-- org1 vendors
INSERT INTO vendors (id, organization_id, name, slug, description, website, category, status, risk_score, risk_level, primary_contact_name, primary_contact_email, primary_contact_phone, address, city, state, zip_code, country, phi_access, data_classification, hipaa_compliant, soc2_certified, hitrust_certified, tags, metadata, onboarded_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Epic Systems',          'epic-systems',          'Electronic health records and clinical information systems',                   'https://www.epic.com',            'EHR',                  'active',         25, 'low',      'Lisa Park',        'lisa.park@epic.com',          '(608) 271-9000', '1979 Milky Way',          'Verona',        'WI', '53593', 'US', TRUE,  ARRAY['PHI','PII','ePHI'],       TRUE,  TRUE,  TRUE,  ARRAY['ehr','clinical','tier-1'],                  '{"annual_revenue": "4B+", "employee_count": 12500}',  '2023-03-15T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Cerner Health',         'cerner-health',         'Health information technology solutions and EHR platform',                     'https://www.cerner.com',          'EHR',                  'active',         30, 'low',      'Tom Bradley',      'tom.bradley@cerner.com',      '(816) 221-1024', '2800 Rockcreek Pkwy',     'North Kansas City','MO','64117','US', TRUE,  ARRAY['PHI','PII','ePHI'],       TRUE,  TRUE,  FALSE, ARRAY['ehr','clinical','tier-1'],                  '{"annual_revenue": "5B+", "employee_count": 28000}',  '2023-06-01T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'McKesson',              'mckesson',              'Pharmaceutical distribution and health information technology',                'https://www.mckesson.com',        'Supply Chain',         'active',         45, 'medium',   'Nancy Rivera',     'nancy.rivera@mckesson.com',   '(415) 983-8300', '6555 State Hwy 161',      'Irving',        'TX', '75039', 'US', TRUE,  ARRAY['PHI','PII'],              TRUE,  TRUE,  FALSE, ARRAY['pharmacy','supply-chain','tier-1'],         '{"annual_revenue": "264B+", "employee_count": 67000}','2022-11-20T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Philips Healthcare',    'philips-healthcare',    'Medical imaging, patient monitoring, and health informatics',                  'https://www.philips.com/healthcare','Medical Devices',     'active',         50, 'medium',   'Erik van der Berg', 'erik.vanderberg@philips.com', '(978) 659-3000', '3000 Minuteman Rd',       'Andover',       'MA', '01810', 'US', TRUE,  ARRAY['PHI','device-data'],      TRUE,  FALSE, FALSE, ARRAY['imaging','monitoring','tier-2'],            '{"annual_revenue": "18B+", "employee_count": 78000}','2023-01-10T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Nuance Communications', 'nuance-communications', 'AI-powered clinical speech recognition and medical transcription',             'https://www.nuance.com',          'Clinical Software',    'active',         35, 'medium',   'David Kim',        'david.kim@nuance.com',        '(781) 565-5000', '1 Wayside Rd',            'Burlington',    'MA', '01803', 'US', TRUE,  ARRAY['PHI','ePHI'],             TRUE,  TRUE,  FALSE, ARRAY['ai','transcription','tier-2'],              '{"annual_revenue": "1.5B", "employee_count": 7100}', '2023-04-22T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Iron Mountain',         'iron-mountain',         'Records management, data backup, and secure document storage for healthcare', 'https://www.ironmountain.com',    'Data Storage',         'active',         40, 'medium',   'Karen Foster',     'karen.foster@ironmountain.com','(800) 899-8766','1 Federal St',             'Boston',        'MA', '02110', 'US', FALSE, ARRAY['PII','backup-data'],      TRUE,  TRUE,  FALSE, ARRAY['storage','records','tier-2'],               '{"annual_revenue": "5B+", "employee_count": 24000}', '2022-08-05T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'CrowdStrike',           'crowdstrike',           'Endpoint security, threat intelligence, and incident response',               'https://www.crowdstrike.com',     'Cybersecurity',        'active',         20, 'low',      'Alex Moreno',      'alex.moreno@crowdstrike.com', '(888) 512-8906', '206 E 9th St',            'Austin',        'TX', '78701', 'US', FALSE, ARRAY['security-logs'],          FALSE, TRUE,  FALSE, ARRAY['security','endpoint','tier-2'],             '{"annual_revenue": "3B+", "employee_count": 8700}',  '2023-02-14T00:00:00Z'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Imprivata',             'imprivata',             'Digital identity and access management for healthcare organizations',         'https://www.imprivata.com',       'Identity Management',  'pending_review', 60, 'high',     'Rachel Nguyen',    'rachel.nguyen@imprivata.com', '(781) 674-2700', '20 Lexington St',         'Waltham',       'MA', '02451', 'US', TRUE,  ARRAY['PHI','credentials'],      TRUE,  TRUE,  FALSE, ARRAY['identity','sso','onboarding'],              '{"annual_revenue": "200M", "employee_count": 700}',  NULL);

-- org2 vendors
INSERT INTO vendors (id, organization_id, name, slug, description, website, category, status, risk_score, risk_level, primary_contact_name, primary_contact_email, primary_contact_phone, address, city, state, zip_code, country, phi_access, data_classification, hipaa_compliant, soc2_certified, hitrust_certified, tags, metadata, onboarded_at) VALUES
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Vocera',                'vocera',                'Clinical communication and workflow solutions for hospitals',                  'https://www.vocera.com',          'Communications',       'active',         35, 'medium',   'Daniel Hughes',    'daniel.hughes@vocera.com',    '(408) 882-5100', '525 Race St',             'San Jose',      'CA', '95126', 'US', TRUE,  ARRAY['PHI','PII'],              TRUE,  TRUE,  FALSE, ARRAY['communications','clinical','tier-1'],      '{"annual_revenue": "200M", "employee_count": 800}',  '2023-05-10T00:00:00Z'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'MedHost',               'medhost',               'Enterprise health information systems and emergency department solutions',     'https://www.medhost.com',         'EHR',                  'active',         55, 'high',     'Jennifer Clark',   'jennifer.clark@medhost.com',  '(615) 761-1000', '5001 Meridian Blvd',      'Franklin',      'TN', '37067', 'US', TRUE,  ARRAY['PHI','PII','ePHI'],       TRUE,  FALSE, FALSE, ARRAY['ehr','emergency','tier-1'],                 '{"annual_revenue": "100M", "employee_count": 500}',  '2022-09-01T00:00:00Z'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'CloudWave',             'cloudwave',             'Cloud hosting and managed services for healthcare IT infrastructure',         'https://www.gocloudwave.com',     'Cloud Infrastructure', 'active',         42, 'medium',   'Michael Torres',   'michael.torres@cloudwave.com','(508) 429-9549', '561 Virginia Rd',         'Concord',       'MA', '01742', 'US', TRUE,  ARRAY['PHI','ePHI','backup-data']  ,TRUE,  TRUE,  FALSE, ARRAY['cloud','hosting','tier-1'],                 '{"annual_revenue": "50M", "employee_count": 150}',   '2023-07-15T00:00:00Z'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Zynex Medical',         'zynex-medical',         'Electrotherapy and patient monitoring devices for pain management',            'https://www.zynexmed.com',        'Medical Devices',      'onboarding',     65, 'high',     'Samantha Lee',     'samantha.lee@zynexmed.com',   '(303) 703-4906', '9555 Maroon Circle',      'Lone Tree',     'CO', '80124', 'US', FALSE, ARRAY['device-data','PII'],      FALSE, FALSE, FALSE, ARRAY['devices','monitoring','onboarding'],        '{"annual_revenue": "150M", "employee_count": 700}',  NULL);

-- ============================================================================
-- VENDOR CONTACTS
-- ============================================================================
INSERT INTO vendor_contacts (vendor_id, name, email, phone, title, is_primary) VALUES
  ((SELECT id FROM vendors WHERE slug = 'epic-systems'          AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Lisa Park',         'lisa.park@epic.com',            '(608) 271-9000', 'Account Manager',              TRUE),
  ((SELECT id FROM vendors WHERE slug = 'epic-systems'          AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Brian Yoo',         'brian.yoo@epic.com',            '(608) 271-9100', 'Technical Support Lead',       FALSE),
  ((SELECT id FROM vendors WHERE slug = 'cerner-health'         AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Tom Bradley',       'tom.bradley@cerner.com',        '(816) 221-1024', 'Senior Account Executive',     TRUE),
  ((SELECT id FROM vendors WHERE slug = 'mckesson'              AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Nancy Rivera',      'nancy.rivera@mckesson.com',     '(415) 983-8300', 'Client Relations Director',    TRUE),
  ((SELECT id FROM vendors WHERE slug = 'philips-healthcare'    AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Erik van der Berg', 'erik.vanderberg@philips.com',   '(978) 659-3000', 'Healthcare Solutions Manager',  TRUE),
  ((SELECT id FROM vendors WHERE slug = 'nuance-communications' AND organization_id = '11111111-1111-1111-1111-111111111111'), 'David Kim',         'david.kim@nuance.com',          '(781) 565-5000', 'Enterprise Account Manager',   TRUE),
  ((SELECT id FROM vendors WHERE slug = 'crowdstrike'           AND organization_id = '11111111-1111-1111-1111-111111111111'), 'Alex Moreno',       'alex.moreno@crowdstrike.com',   '(888) 512-8906', 'Healthcare Vertical Lead',     TRUE),
  ((SELECT id FROM vendors WHERE slug = 'vocera'                AND organization_id = '22222222-2222-2222-2222-222222222222'), 'Daniel Hughes',     'daniel.hughes@vocera.com',      '(408) 882-5100', 'Regional Sales Manager',       TRUE),
  ((SELECT id FROM vendors WHERE slug = 'medhost'               AND organization_id = '22222222-2222-2222-2222-222222222222'), 'Jennifer Clark',    'jennifer.clark@medhost.com',    '(615) 761-1000', 'Customer Success Manager',     TRUE),
  ((SELECT id FROM vendors WHERE slug = 'cloudwave'             AND organization_id = '22222222-2222-2222-2222-222222222222'), 'Michael Torres',    'michael.torres@cloudwave.com',  '(508) 429-9549', 'Solutions Architect',          TRUE),
  ((SELECT id FROM vendors WHERE slug = 'zynex-medical'         AND organization_id = '22222222-2222-2222-2222-222222222222'), 'Samantha Lee',      'samantha.lee@zynexmed.com',     '(303) 703-4906', 'Business Development Manager', TRUE);

-- ============================================================================
-- COMPLIANCE FRAMEWORKS
-- ============================================================================
INSERT INTO compliance_frameworks (id, organization_id, name, version, description, requirements) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'HIPAA Security Rule',   '2024', 'HIPAA Security Rule administrative, physical, and technical safeguards',   '[{"key": "164.308", "title": "Administrative Safeguards"}, {"key": "164.310", "title": "Physical Safeguards"}, {"key": "164.312", "title": "Technical Safeguards"}, {"key": "164.314", "title": "Organizational Requirements"}, {"key": "164.316", "title": "Policies and Procedures"}]'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'HIPAA Privacy Rule',    '2024', 'Standards for the protection of individually identifiable health information','[{"key": "164.502", "title": "Uses and Disclosures"}, {"key": "164.504", "title": "Business Associates"}, {"key": "164.510", "title": "Disclosures for Public Health"}, {"key": "164.520", "title": "Notice of Privacy Practices"}, {"key": "164.524", "title": "Access to PHI"}]'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'SOC 2 Type II',         '2024', 'Service Organization Control 2 Trust Services Criteria',                    '[{"key": "CC1", "title": "Control Environment"}, {"key": "CC2", "title": "Communication and Information"}, {"key": "CC3", "title": "Risk Assessment"}, {"key": "CC6", "title": "Logical and Physical Access Controls"}, {"key": "CC7", "title": "System Operations"}, {"key": "CC8", "title": "Change Management"}]'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'HITRUST CSF',           'v11',  'Health Information Trust Alliance Common Security Framework',               '[{"key": "01.0", "title": "Information Security Management Program"}, {"key": "02.0", "title": "Access Control"}, {"key": "06.0", "title": "Audit Logging & Monitoring"}, {"key": "09.0", "title": "Network Protection"}, {"key": "10.0", "title": "Transmission Protection"}]'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'HIPAA Security Rule',   '2024', 'HIPAA Security Rule administrative, physical, and technical safeguards',   '[{"key": "164.308", "title": "Administrative Safeguards"}, {"key": "164.310", "title": "Physical Safeguards"}, {"key": "164.312", "title": "Technical Safeguards"}]'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'NIST Cybersecurity Framework', 'v2.0', 'National Institute of Standards and Technology Cybersecurity Framework', '[{"key": "ID", "title": "Identify"}, {"key": "PR", "title": "Protect"}, {"key": "DE", "title": "Detect"}, {"key": "RS", "title": "Respond"}, {"key": "RC", "title": "Recover"}]');

-- ============================================================================
-- RISK ASSESSMENTS
-- ============================================================================
INSERT INTO risk_assessments (id, organization_id, vendor_id, assessor_id, title, description, status, risk_score, risk_level, framework, questionnaire_data, findings, recommendations, due_date, completed_at, next_review_date) VALUES
  -- org1 assessments
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Epic Systems Annual HIPAA Risk Assessment 2025',
    'Comprehensive annual risk assessment of Epic EHR platform covering PHI access controls, encryption, and audit logging',
    'completed', 25, 'low', 'HIPAA Security Rule',
    '{"total_questions": 85, "answered": 85, "category_scores": {"access_control": 92, "encryption": 95, "audit_logging": 88, "incident_response": 90}}',
    '[{"id": "F-001", "title": "Audit log retention below recommended 7 years", "severity": "low", "status": "remediated"}]',
    '[{"id": "R-001", "title": "Extend audit log retention to 7 years per best practice", "priority": "low", "status": "implemented"}]',
    '2025-06-30T00:00:00Z', '2025-05-15T00:00:00Z', '2026-05-15T00:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'McKesson Supply Chain Security Assessment Q1 2026',
    'Quarterly security review of pharmaceutical distribution and data handling practices',
    'in_progress', 45, 'medium', 'HIPAA Security Rule',
    '{"total_questions": 60, "answered": 38, "category_scores": {"data_handling": 78, "access_control": 80}}',
    '[{"id": "F-002", "title": "Multi-factor authentication not enforced for all admin accounts", "severity": "medium", "status": "open"}]',
    '[]',
    '2026-03-31T00:00:00Z', NULL, NULL),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'imprivata' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Imprivata Onboarding Security Assessment',
    'Initial vendor risk assessment for Imprivata identity management solution prior to deployment',
    'under_review', 60, 'high', 'HITRUST CSF',
    '{"total_questions": 75, "answered": 75, "category_scores": {"identity_mgmt": 70, "access_control": 65, "encryption": 80, "monitoring": 72}}',
    '[{"id": "F-003", "title": "Privileged access review process not documented", "severity": "high", "status": "open"}, {"id": "F-004", "title": "Missing disaster recovery testing evidence", "severity": "medium", "status": "open"}]',
    '[{"id": "R-002", "title": "Require documented privileged access review quarterly", "priority": "high"}, {"id": "R-003", "title": "Provide DR test results from last 12 months", "priority": "medium"}]',
    '2026-04-15T00:00:00Z', NULL, NULL),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'philips-healthcare' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Philips Healthcare Medical Device Security Assessment',
    'Assessment of medical imaging device security controls, network segmentation, and firmware update processes',
    'completed', 50, 'medium', 'HIPAA Security Rule',
    '{"total_questions": 55, "answered": 55, "category_scores": {"device_security": 72, "network_segmentation": 80, "patching": 65, "encryption": 78}}',
    '[{"id": "F-005", "title": "Firmware update cycle exceeds 90-day window", "severity": "medium", "status": "in_remediation"}]',
    '[{"id": "R-004", "title": "Establish 60-day firmware patching SLA with vendor", "priority": "medium"}]',
    '2025-12-31T00:00:00Z', '2025-11-20T00:00:00Z', '2026-11-20T00:00:00Z'),

  -- org2 assessments
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'MedHost EHR Annual Risk Assessment 2025',
    'Annual risk assessment covering MedHost emergency department and inpatient EHR systems',
    'completed', 55, 'high', 'HIPAA Security Rule',
    '{"total_questions": 70, "answered": 70, "category_scores": {"access_control": 68, "encryption": 72, "audit_logging": 65, "incident_response": 60}}',
    '[{"id": "F-006", "title": "Session timeout not configured per HIPAA minimum", "severity": "high", "status": "in_remediation"}, {"id": "F-007", "title": "Incomplete encryption at rest for archived records", "severity": "medium", "status": "open"}]',
    '[{"id": "R-005", "title": "Configure 15-minute session timeout on all clinical workstations", "priority": "high"}, {"id": "R-006", "title": "Encrypt archived record storage volumes", "priority": "medium"}]',
    '2025-09-30T00:00:00Z', '2025-09-10T00:00:00Z', '2026-09-10T00:00:00Z'),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'zynex-medical' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Zynex Medical Onboarding Risk Assessment',
    'Pre-onboarding risk evaluation of Zynex Medical patient monitoring devices',
    'draft', NULL, NULL, 'NIST Cybersecurity Framework',
    '{"total_questions": 50, "answered": 0}',
    '[]', '[]',
    '2026-05-01T00:00:00Z', NULL, NULL);

-- ============================================================================
-- ASSESSMENT RESPONSES (sample responses for the completed Epic assessment)
-- ============================================================================
INSERT INTO assessment_responses (assessment_id, question_id, question_text, response, score, notes, evidence_url) VALUES
  ((SELECT id FROM risk_assessments WHERE title LIKE 'Epic Systems Annual%'),
    '164.312.a.1', 'Does the vendor implement access controls to limit ePHI access to authorized users?',
    'Yes. Role-based access control (RBAC) is enforced with granular permissions. All access requires unique user credentials and MFA.',
    95, 'Verified via SOC 2 Type II report and live demo', 'https://docs.pinnaclehealth.org/evidence/epic-rbac-2025.pdf'),
  ((SELECT id FROM risk_assessments WHERE title LIKE 'Epic Systems Annual%'),
    '164.312.a.2.iv', 'Are encryption mechanisms in place for ePHI at rest and in transit?',
    'AES-256 encryption at rest for all database storage. TLS 1.3 enforced for data in transit. Key management via HSM.',
    98, 'Encryption standards exceed minimum requirements', 'https://docs.pinnaclehealth.org/evidence/epic-encryption-2025.pdf'),
  ((SELECT id FROM risk_assessments WHERE title LIKE 'Epic Systems Annual%'),
    '164.312.b', 'Does the vendor maintain audit controls that record and examine ePHI activity?',
    'Comprehensive audit logging for all read, write, and delete operations. Logs retained for 6 years with tamper-evident storage.',
    88, 'Retention is 6 years; best practice recommends 7', NULL),
  ((SELECT id FROM risk_assessments WHERE title LIKE 'Epic Systems Annual%'),
    '164.308.a.6', 'Does the vendor have documented security incident procedures?',
    'Incident response plan reviewed annually. Tabletop exercises conducted quarterly. 24/7 security operations center staffed.',
    92, 'Strong incident response program; reviewed IR plan documentation', 'https://docs.pinnaclehealth.org/evidence/epic-ir-plan-2025.pdf');

-- ============================================================================
-- COMPLIANCE ITEMS
-- ============================================================================
INSERT INTO compliance_items (organization_id, vendor_id, framework_id, requirement_key, title, description, status, evidence_url, notes, due_date, completed_at) VALUES
  -- org1 HIPAA Security Rule items for Epic
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM compliance_frameworks WHERE name = 'HIPAA Security Rule' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    '164.308', 'Administrative Safeguards - Epic Systems', 'Security management process, workforce security, and information access management',
    'compliant', 'https://docs.pinnaclehealth.org/compliance/epic-admin-safeguards.pdf', 'Full compliance verified during 2025 annual assessment', '2026-06-30T00:00:00Z', '2025-05-15T00:00:00Z'),
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM compliance_frameworks WHERE name = 'HIPAA Security Rule' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    '164.312', 'Technical Safeguards - Epic Systems', 'Access controls, audit controls, integrity controls, and transmission security',
    'compliant', 'https://docs.pinnaclehealth.org/compliance/epic-tech-safeguards.pdf', 'AES-256 and TLS 1.3 verified', '2026-06-30T00:00:00Z', '2025-05-15T00:00:00Z'),

  -- org1 HIPAA compliance for McKesson
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM compliance_frameworks WHERE name = 'HIPAA Security Rule' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    '164.308', 'Administrative Safeguards - McKesson', 'Security management process and access management for supply chain systems',
    'partially_compliant', NULL, 'MFA enforcement gap identified in Q1 2026 assessment', '2026-03-31T00:00:00Z', NULL),

  -- org1 SOC 2 items for CrowdStrike
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'crowdstrike' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM compliance_frameworks WHERE name = 'SOC 2 Type II' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'CC6', 'Logical and Physical Access Controls - CrowdStrike', 'Evaluation of CrowdStrike endpoint platform access control mechanisms',
    'compliant', 'https://docs.pinnaclehealth.org/compliance/cs-soc2-cc6.pdf', 'SOC 2 Type II report reviewed and validated', '2026-12-31T00:00:00Z', '2025-08-20T00:00:00Z'),
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'crowdstrike' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM compliance_frameworks WHERE name = 'SOC 2 Type II' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'CC7', 'System Operations - CrowdStrike', 'Monitoring, detection, and response to system anomalies and security events',
    'compliant', 'https://docs.pinnaclehealth.org/compliance/cs-soc2-cc7.pdf', 'Continuous monitoring capabilities validated', '2026-12-31T00:00:00Z', '2025-08-20T00:00:00Z'),

  -- org2 HIPAA items for MedHost
  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    (SELECT id FROM compliance_frameworks WHERE name = 'HIPAA Security Rule' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    '164.312', 'Technical Safeguards - MedHost', 'Access controls, session management, and encryption for MedHost EHR',
    'non_compliant', NULL, 'Session timeout and encryption at rest issues identified', '2026-04-30T00:00:00Z', NULL),

  -- org2 NIST items for CloudWave
  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'cloudwave' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    (SELECT id FROM compliance_frameworks WHERE name = 'NIST Cybersecurity Framework' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'PR', 'Protect - CloudWave', 'Data security, access control, and protective technology for hosted infrastructure',
    'compliant', 'https://docs.lakewoodmed.com/compliance/cloudwave-nist-pr.pdf', 'All protective controls validated', '2026-07-31T00:00:00Z', '2025-07-15T00:00:00Z');

-- ============================================================================
-- CONTRACTS
-- ============================================================================
INSERT INTO contracts (id, organization_id, vendor_id, title, contract_type, status, start_date, end_date, renewal_date, value, auto_renew, terms, document_url, signed_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'Epic EHR Enterprise License Agreement', 'Software License', 'active', '2023-01-01', '2028-12-31', '2028-06-30', 4500000.00, FALSE,
    '{"payment_schedule": "annual", "sla_uptime": "99.95%", "support_hours": "24/7", "data_center_location": "US-only"}',
    'https://docs.pinnaclehealth.org/contracts/epic-ela-2023.pdf', '2022-12-15T00:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'cerner-health' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'Cerner Ambulatory Care Module License', 'Software License', 'active', '2023-06-01', '2026-05-31', '2026-02-28', 1200000.00, TRUE,
    '{"payment_schedule": "annual", "sla_uptime": "99.9%", "support_hours": "business hours + on-call"}',
    'https://docs.pinnaclehealth.org/contracts/cerner-ambulatory-2023.pdf', '2023-05-20T00:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'McKesson Pharmaceutical Distribution Agreement', 'Service Agreement', 'active', '2022-11-01', '2025-10-31', '2025-07-31', 8500000.00, TRUE,
    '{"payment_schedule": "monthly", "delivery_sla": "next-day", "controlled_substance_handling": true}',
    'https://docs.pinnaclehealth.org/contracts/mckesson-dist-2022.pdf', '2022-10-15T00:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'crowdstrike' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'CrowdStrike Falcon Endpoint Protection', 'Software License', 'active', '2023-02-01', '2026-01-31', '2025-10-31', 320000.00, TRUE,
    '{"payment_schedule": "annual", "endpoints_covered": 5000, "support_tier": "premium", "threat_hunting": true}',
    'https://docs.pinnaclehealth.org/contracts/crowdstrike-falcon-2023.pdf', '2023-01-25T00:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'iron-mountain' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'Iron Mountain Records Storage and Destruction Services', 'Service Agreement', 'active', '2022-08-01', '2025-07-31', '2025-04-30', 180000.00, TRUE,
    '{"payment_schedule": "monthly", "destruction_method": "NIST 800-88", "pickup_frequency": "weekly"}',
    'https://docs.pinnaclehealth.org/contracts/ironmtn-storage-2022.pdf', '2022-07-20T00:00:00Z'),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'MedHost Enterprise EHR System Agreement', 'Software License', 'active', '2022-09-01', '2027-08-31', '2027-03-31', 2800000.00, FALSE,
    '{"payment_schedule": "annual", "sla_uptime": "99.9%", "support_hours": "24/7", "modules": ["ED", "inpatient", "lab"]}',
    'https://docs.lakewoodmed.com/contracts/medhost-ehr-2022.pdf', '2022-08-15T00:00:00Z'),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'cloudwave' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'CloudWave OpSus Managed Cloud Hosting', 'Service Agreement', 'active', '2023-07-01', '2026-06-30', '2026-03-31', 960000.00, TRUE,
    '{"payment_schedule": "monthly", "sla_uptime": "99.99%", "disaster_recovery": true, "rpo_hours": 1, "rto_hours": 4}',
    'https://docs.lakewoodmed.com/contracts/cloudwave-hosting-2023.pdf', '2023-06-20T00:00:00Z'),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'vocera' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'Vocera Clinical Communication Platform License', 'Software License', 'active', '2023-05-01', '2026-04-30', '2026-01-31', 450000.00, TRUE,
    '{"payment_schedule": "annual", "devices_covered": 500, "support_tier": "standard"}',
    'https://docs.lakewoodmed.com/contracts/vocera-comm-2023.pdf', '2023-04-18T00:00:00Z');

-- ============================================================================
-- BUSINESS ASSOCIATE AGREEMENTS
-- ============================================================================
INSERT INTO business_associate_agreements (organization_id, vendor_id, contract_id, status, version, effective_date, expiration_date, phi_scope, safeguards, breach_notification_terms, termination_terms, document_url, signed_by_org, signed_by_vendor, signed_at) VALUES
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM contracts WHERE title LIKE 'Epic EHR Enterprise%'),
    'active', 2, '2023-01-01', '2028-12-31',
    'All electronic protected health information (ePHI) created, received, maintained, or transmitted through the Epic EHR platform including patient demographics, clinical records, lab results, and prescription data.',
    '{"administrative": ["workforce training", "access management", "security officer designation"], "physical": ["facility access controls", "workstation security", "device media controls"], "technical": ["access control", "audit controls", "integrity controls", "transmission security"]}',
    '{"notification_period_hours": 24, "method": "written and electronic", "content": ["nature of breach", "types of PHI involved", "steps to mitigate", "corrective actions"]}',
    '{"return_or_destroy_phi": true, "survival_clauses": ["indemnification", "breach notification"], "transition_period_days": 90}',
    'https://docs.pinnaclehealth.org/baa/epic-baa-v2-2023.pdf', 'Sarah Chen, CISO', 'Lisa Park, VP Legal', '2022-12-15T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'cerner-health' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM contracts WHERE title LIKE 'Cerner Ambulatory%'),
    'active', 1, '2023-06-01', '2026-05-31',
    'ePHI related to ambulatory care visits including patient scheduling, clinical notes, prescriptions, and referral data.',
    '{"administrative": ["workforce training", "access management"], "physical": ["facility access controls"], "technical": ["encryption", "access control", "audit logging"]}',
    '{"notification_period_hours": 48, "method": "written", "content": ["nature of breach", "PHI types", "mitigation steps"]}',
    '{"return_or_destroy_phi": true, "transition_period_days": 60}',
    'https://docs.pinnaclehealth.org/baa/cerner-baa-2023.pdf', 'Sarah Chen, CISO', 'Tom Bradley, Legal Counsel', '2023-05-20T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    (SELECT id FROM contracts WHERE title LIKE 'McKesson Pharmaceutical%'),
    'active', 1, '2022-11-01', '2025-10-31',
    'Patient prescription data, medication histories, and controlled substance dispensing records transmitted via pharmacy information systems.',
    '{"administrative": ["security awareness training", "incident procedures"], "physical": ["secure facilities"], "technical": ["encryption at rest and in transit", "access controls"]}',
    '{"notification_period_hours": 24, "method": "written and verbal", "content": ["breach description", "PHI types", "remediation plan"]}',
    '{"return_or_destroy_phi": true, "transition_period_days": 30}',
    'https://docs.pinnaclehealth.org/baa/mckesson-baa-2022.pdf', 'Sarah Chen, CISO', 'Nancy Rivera, VP Compliance', '2022-10-15T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'nuance-communications' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    NULL,
    'active', 1, '2023-04-22', '2026-04-21',
    'Clinical dictation audio, transcribed medical reports, and physician notes processed through Dragon Medical speech recognition platform.',
    '{"administrative": ["security training", "access reviews"], "technical": ["AES-256 encryption", "role-based access", "SOC 2 compliance"]}',
    '{"notification_period_hours": 48, "method": "electronic", "content": ["breach scope", "PHI categories", "corrective actions"]}',
    '{"return_or_destroy_phi": true, "transition_period_days": 60}',
    'https://docs.pinnaclehealth.org/baa/nuance-baa-2023.pdf', 'Maria Gonzalez, Compliance Officer', 'David Kim, Legal', '2023-04-15T00:00:00Z'),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    (SELECT id FROM contracts WHERE title LIKE 'MedHost Enterprise%'),
    'active', 1, '2022-09-01', '2027-08-31',
    'All ePHI processed in emergency department, inpatient, and laboratory modules including patient demographics, clinical notes, lab results, and medication administration records.',
    '{"administrative": ["workforce security", "security management", "contingency plan"], "physical": ["facility security", "device controls"], "technical": ["access control", "audit controls", "encryption"]}',
    '{"notification_period_hours": 24, "method": "written and electronic", "content": ["breach nature", "PHI scope", "mitigation", "corrective actions"]}',
    '{"return_or_destroy_phi": true, "survival_clauses": ["indemnification"], "transition_period_days": 120}',
    'https://docs.lakewoodmed.com/baa/medhost-baa-2022.pdf', 'Robert Williams, VP IT', 'Jennifer Clark, General Counsel', '2022-08-10T00:00:00Z'),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'cloudwave' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    (SELECT id FROM contracts WHERE title LIKE 'CloudWave OpSus%'),
    'active', 1, '2023-07-01', '2026-06-30',
    'All ePHI stored and processed within CloudWave managed hosting environment including backups, disaster recovery copies, and archived data.',
    '{"administrative": ["security management", "risk analysis"], "physical": ["data center controls", "environmental safeguards"], "technical": ["encryption", "access logging", "intrusion detection"]}',
    '{"notification_period_hours": 12, "method": "electronic and verbal", "content": ["breach details", "affected systems", "data scope", "remediation timeline"]}',
    '{"return_or_destroy_phi": true, "transition_period_days": 90}',
    'https://docs.lakewoodmed.com/baa/cloudwave-baa-2023.pdf', 'Robert Williams, VP IT', 'Michael Torres, CEO', '2023-06-18T00:00:00Z');

-- ============================================================================
-- INCIDENTS
-- ============================================================================
INSERT INTO incidents (id, organization_id, vendor_id, reported_by, assigned_to, title, description, severity, status, category, affected_systems, phi_compromised, individuals_affected, root_cause, resolution, timeline, reported_at, resolved_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'McKesson Portal Unauthorized Access Attempt',
    'Multiple failed login attempts detected on the McKesson pharmacy portal from an unrecognized IP range. Account lockout triggered for 3 pharmacy technician accounts.',
    'medium', 'resolved', 'Unauthorized Access',
    ARRAY['McKesson Pharmacy Portal', 'Active Directory'],
    FALSE, 0,
    'Credential stuffing attack using leaked credentials from an unrelated third-party breach. No McKesson-specific credentials were compromised.',
    'Affected accounts locked and passwords reset. IP range blocked at firewall. MFA enforcement accelerated for all pharmacy portal users.',
    '[{"timestamp": "2025-11-15T08:30:00Z", "event": "Anomalous login attempts detected by SIEM"}, {"timestamp": "2025-11-15T08:45:00Z", "event": "Accounts locked automatically"}, {"timestamp": "2025-11-15T09:00:00Z", "event": "Incident reported to security team"}, {"timestamp": "2025-11-15T14:00:00Z", "event": "Root cause identified as credential stuffing"}, {"timestamp": "2025-11-16T10:00:00Z", "event": "Remediation completed; MFA enforced"}]',
    '2025-11-15T09:00:00Z', '2025-11-16T10:00:00Z'),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'philips-healthcare' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Philips PACS Server Vulnerability Disclosure',
    'Philips disclosed a critical vulnerability (CVE-2025-XXXXX) in their PACS imaging server software affecting versions prior to 4.2.1. Vulnerability could allow remote code execution.',
    'critical', 'remediation', 'Vulnerability',
    ARRAY['Philips IntelliSpace PACS', 'Radiology Network Segment'],
    FALSE, 0,
    'Software vulnerability in DICOM image parsing library allowing buffer overflow.',
    NULL,
    '[{"timestamp": "2026-01-20T14:00:00Z", "event": "Philips security advisory received"}, {"timestamp": "2026-01-20T16:00:00Z", "event": "Affected systems identified; 3 PACS servers"}, {"timestamp": "2026-01-21T08:00:00Z", "event": "Network segmentation rules tightened"}, {"timestamp": "2026-01-22T00:00:00Z", "event": "Patch scheduled for maintenance window 2026-02-01"}]',
    '2026-01-20T16:00:00Z', NULL),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'MedHost Unencrypted Backup Tape Discovery',
    'During routine inventory, an unencrypted backup tape containing MedHost ED patient data from Q2 2025 was discovered in a storage area without proper access controls.',
    'high', 'closed', 'Data Exposure',
    ARRAY['MedHost ED Module', 'Backup Infrastructure'],
    TRUE, 1250,
    'Backup encryption policy was not applied to legacy tape rotation schedule. Manual process oversight allowed unencrypted tape to be created.',
    'Tape secured and destroyed per NIST 800-88. Backup encryption verified on all active tape sets. Legacy tape schedule updated to enforce encryption. HHS breach notification filed.',
    '[{"timestamp": "2025-10-05T11:00:00Z", "event": "Unencrypted tape discovered during audit"}, {"timestamp": "2025-10-05T11:30:00Z", "event": "Tape secured in locked evidence storage"}, {"timestamp": "2025-10-05T14:00:00Z", "event": "Incident reported; breach assessment initiated"}, {"timestamp": "2025-10-07T09:00:00Z", "event": "PHI exposure confirmed for 1,250 patients"}, {"timestamp": "2025-10-10T00:00:00Z", "event": "HHS breach notification submitted"}, {"timestamp": "2025-10-15T00:00:00Z", "event": "Patient notification letters sent"}, {"timestamp": "2025-10-20T00:00:00Z", "event": "All backup tapes verified encrypted; incident closed"}]',
    '2025-10-05T14:00:00Z', '2025-10-20T00:00:00Z');

-- ============================================================================
-- INCIDENT UPDATES
-- ============================================================================
INSERT INTO incident_updates (incident_id, user_id, content, is_internal) VALUES
  ((SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'SIEM alert triggered at 08:30. Detected 147 failed login attempts across 3 pharmacy tech accounts from IP range 185.220.x.x over a 15-minute window. Automated lockout engaged.',
    TRUE),
  ((SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Confirmed no PHI was accessed. All three accounts were locked before any successful authentication occurred. Credential source traced to third-party data dump.',
    FALSE),
  ((SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'MFA rollout accelerated. All pharmacy portal users now require hardware token or authenticator app. IP block list updated on perimeter firewall.',
    FALSE),

  ((SELECT id FROM incidents WHERE title LIKE 'Philips PACS%'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Philips advisory received. CVE impacts IntelliSpace PACS versions prior to 4.2.1. Our environment has 3 affected servers in the radiology VLAN.',
    TRUE),
  ((SELECT id FROM incidents WHERE title LIKE 'Philips PACS%'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Applied additional network ACLs to restrict PACS server inbound traffic to known DICOM sources only. Monitoring enhanced with custom IDS signatures for exploitation attempts.',
    TRUE),

  ((SELECT id FROM incidents WHERE title LIKE 'MedHost Unencrypted%'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Unencrypted tape discovered during Q4 storage audit. Tape labeled "MEDHOST-ED-BKP-20250615" contained ED patient records. Immediately secured in evidence locker.',
    TRUE),
  ((SELECT id FROM incidents WHERE title LIKE 'MedHost Unencrypted%'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Forensic analysis complete. Tape contains 1,250 unique patient records including names, DOBs, MRNs, and chief complaints. No SSNs or financial data present.',
    TRUE),
  ((SELECT id FROM incidents WHERE title LIKE 'MedHost Unencrypted%'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'HHS breach notification submitted via online portal. Patient notification letters prepared and sent via certified mail. Credit monitoring offered to all affected individuals.',
    FALSE);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
INSERT INTO documents (organization_id, vendor_id, uploaded_by, name, description, document_type, file_url, file_size, mime_type, version, tags, metadata, expires_at) VALUES
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Epic Systems SOC 2 Type II Report 2025', 'Annual SOC 2 Type II audit report covering security, availability, and confidentiality trust services criteria',
    'soc2_report', 'https://docs.pinnaclehealth.org/vendor-docs/epic-soc2-2025.pdf', 2456780, 'application/pdf', 1,
    ARRAY['soc2', 'audit', 'annual'], '{"audit_firm": "Deloitte", "period": "2024-07-01 to 2025-06-30"}', '2026-06-30T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Epic Systems BAA v2', 'Signed Business Associate Agreement version 2 with Epic Systems',
    'baa', 'https://docs.pinnaclehealth.org/vendor-docs/epic-baa-v2-signed.pdf', 845200, 'application/pdf', 2,
    ARRAY['baa', 'hipaa', 'signed'], '{"signatories": ["Sarah Chen", "Lisa Park"]}', '2028-12-31T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'crowdstrike' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'CrowdStrike Penetration Test Report Q3 2025', 'Third-party penetration test results for CrowdStrike Falcon platform integration',
    'penetration_test', 'https://docs.pinnaclehealth.org/vendor-docs/cs-pentest-q3-2025.pdf', 1890000, 'application/pdf', 1,
    ARRAY['pentest', 'security', 'quarterly'], '{"testing_firm": "Rapid7", "scope": "external and internal"}', '2026-09-30T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'McKesson Cyber Insurance Certificate 2025-2026', 'Certificate of cyber liability insurance coverage',
    'insurance', 'https://docs.pinnaclehealth.org/vendor-docs/mckesson-cyber-insurance-2025.pdf', 320000, 'application/pdf', 1,
    ARRAY['insurance', 'cyber-liability'], '{"carrier": "AIG", "coverage_limit": "$50M", "deductible": "$1M"}', '2026-10-31T00:00:00Z'),

  ('11111111-1111-1111-1111-111111111111',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Pinnacle Health Vendor Risk Management Policy', 'Organization-wide policy governing third-party vendor risk assessment and management',
    'policy', 'https://docs.pinnaclehealth.org/policies/vendor-risk-mgmt-policy-v3.pdf', 567800, 'application/pdf', 3,
    ARRAY['policy', 'vendor-risk', 'organization-wide'], '{"approved_by": "CISO", "review_cycle": "annual"}', '2026-12-31T00:00:00Z'),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'MedHost Risk Assessment Report 2025', 'Completed annual risk assessment report for MedHost EHR systems',
    'risk_assessment', 'https://docs.lakewoodmed.com/vendor-docs/medhost-risk-assessment-2025.pdf', 1234500, 'application/pdf', 1,
    ARRAY['risk-assessment', 'annual', 'ehr'], '{"assessor": "Priya Sharma"}', '2026-09-10T00:00:00Z'),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'cloudwave' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'CloudWave SOC 2 Type II Report 2025', 'SOC 2 Type II report for CloudWave managed hosting services',
    'soc2_report', 'https://docs.lakewoodmed.com/vendor-docs/cloudwave-soc2-2025.pdf', 2100000, 'application/pdf', 1,
    ARRAY['soc2', 'audit', 'hosting'], '{"audit_firm": "KPMG", "period": "2024-07-01 to 2025-06-30"}', '2026-06-30T00:00:00Z'),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'MedHost BAA Signed Copy', 'Executed Business Associate Agreement with MedHost',
    'baa', 'https://docs.lakewoodmed.com/vendor-docs/medhost-baa-signed.pdf', 780000, 'application/pdf', 1,
    ARRAY['baa', 'hipaa', 'signed'], '{"signatories": ["Robert Williams", "Jennifer Clark"]}', '2027-08-31T00:00:00Z');

-- ============================================================================
-- ALERTS
-- ============================================================================
INSERT INTO alerts (organization_id, user_id, type, priority, title, message, source, reference_type, is_read) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'contract_expiring', 'high',
    'McKesson Contract Expiring in 30 Days',
    'The McKesson Pharmaceutical Distribution Agreement expires on 2025-10-31. Renewal review deadline is 2025-07-31. Please initiate renewal discussions.',
    'contract_monitor', 'contracts', FALSE),

  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'assessment_due', 'medium',
    'McKesson Q1 2026 Assessment Overdue',
    'The McKesson Supply Chain Security Assessment Q1 2026 is due by 2026-03-31 and is currently in progress. 22 questions remain unanswered.',
    'assessment_scheduler', 'risk_assessments', FALSE),

  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'incident_reported', 'critical',
    'Critical Vulnerability: Philips PACS Server',
    'A critical vulnerability (CVE-2025-XXXXX) has been disclosed affecting Philips IntelliSpace PACS. 3 servers in your environment are affected. Patch pending.',
    'incident_tracker', 'incidents', FALSE),

  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'compliance_gap', 'high',
    'McKesson HIPAA Administrative Safeguards Gap',
    'McKesson is partially compliant with HIPAA 164.308 Administrative Safeguards. MFA enforcement gap requires remediation before next audit cycle.',
    'compliance_monitor', 'compliance_items', FALSE),

  ('11111111-1111-1111-1111-111111111111', NULL,
    'risk_score_change', 'medium',
    'Imprivata Risk Score Elevated to High',
    'Imprivata risk score has been assessed at 60 (High) based on the onboarding security assessment. Two findings require attention before deployment.',
    'risk_engine', 'vendors', FALSE),

  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'baa_expiring', 'medium',
    'McKesson BAA Expiring 2025-10-31',
    'The Business Associate Agreement with McKesson expires on 2025-10-31. Coordinate BAA renewal alongside contract renewal.',
    'baa_monitor', 'business_associate_agreements', FALSE),

  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'compliance_gap', 'critical',
    'MedHost HIPAA Technical Safeguards Non-Compliant',
    'MedHost is non-compliant with HIPAA 164.312 Technical Safeguards. Session timeout and encryption at rest issues must be resolved urgently.',
    'compliance_monitor', 'compliance_items', FALSE),

  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'document_expiring', 'low',
    'CloudWave SOC 2 Report Expiring 2026-06-30',
    'The CloudWave SOC 2 Type II report expires on 2026-06-30. Request updated report from vendor.',
    'document_monitor', 'documents', FALSE),

  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'vendor_status_change', 'info',
    'Zynex Medical Onboarding In Progress',
    'Zynex Medical has been moved to onboarding status. Risk assessment must be completed before activation.',
    'vendor_lifecycle', 'vendors', TRUE);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'vendor.create', 'vendors',
    (SELECT id FROM vendors WHERE slug = 'epic-systems' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    '{"vendor_name": "Epic Systems", "action_detail": "Vendor created and set to active status"}',
    '10.0.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),

  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'assessment.complete', 'risk_assessments',
    (SELECT id FROM risk_assessments WHERE title LIKE 'Epic Systems Annual%'),
    '{"assessment_title": "Epic Systems Annual HIPAA Risk Assessment 2025", "risk_score": 25, "risk_level": "low"}',
    '10.0.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'incident.create', 'incidents',
    (SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    '{"incident_title": "McKesson Portal Unauthorized Access Attempt", "severity": "medium"}',
    '10.0.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'incident.resolve', 'incidents',
    (SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    '{"incident_title": "McKesson Portal Unauthorized Access Attempt", "resolution": "Accounts reset, IP blocked, MFA enforced"}',
    '10.0.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'document.upload', 'documents', NULL,
    '{"document_name": "Epic Systems SOC 2 Type II Report 2025", "document_type": "soc2_report"}',
    '10.0.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),

  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'incident.create', 'incidents',
    (SELECT id FROM incidents WHERE title LIKE 'MedHost Unencrypted%'),
    '{"incident_title": "MedHost Unencrypted Backup Tape Discovery", "severity": "high", "phi_compromised": true}',
    '10.0.2.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),

  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'incident.close', 'incidents',
    (SELECT id FROM incidents WHERE title LIKE 'MedHost Unencrypted%'),
    '{"incident_title": "MedHost Unencrypted Backup Tape Discovery", "resolution": "Tape destroyed, encryption verified, HHS notified"}',
    '10.0.2.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),

  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'vendor.create', 'vendors',
    (SELECT id FROM vendors WHERE slug = 'zynex-medical' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    '{"vendor_name": "Zynex Medical", "action_detail": "Vendor created in onboarding status"}',
    '10.0.2.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

-- ============================================================================
-- REMEDIATION TASKS
-- ============================================================================
INSERT INTO remediation_tasks (organization_id, assessment_id, incident_id, vendor_id, assigned_to, title, description, priority, status, due_date, completed_at) VALUES
  -- From McKesson assessment finding
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM risk_assessments WHERE title LIKE 'McKesson Supply Chain%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Enforce MFA on all McKesson admin accounts',
    'Multi-factor authentication must be enforced for all administrative accounts accessing the McKesson pharmacy portal. Coordinate with McKesson support to enable organization-wide MFA policy.',
    'high', 'in_progress', '2026-04-15T00:00:00Z', NULL),

  -- From Imprivata assessment findings
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM risk_assessments WHERE title LIKE 'Imprivata Onboarding%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'imprivata' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Obtain documented privileged access review process from Imprivata',
    'Request and review Imprivata documented process for quarterly privileged access reviews. Must include review cadence, approval workflow, and evidence retention.',
    'high', 'open', '2026-04-01T00:00:00Z', NULL),

  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM risk_assessments WHERE title LIKE 'Imprivata Onboarding%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'imprivata' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Obtain Imprivata disaster recovery test evidence',
    'Request DR test results from the last 12 months including RTO/RPO achievement, failover documentation, and lessons learned.',
    'medium', 'open', '2026-04-15T00:00:00Z', NULL),

  -- From Philips PACS incident
  ('11111111-1111-1111-1111-111111111111',
    NULL,
    (SELECT id FROM incidents WHERE title LIKE 'Philips PACS%'),
    (SELECT id FROM vendors WHERE slug = 'philips-healthcare' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Apply Philips PACS firmware patch for CVE-2025-XXXXX',
    'Schedule and apply Philips IntelliSpace PACS patch to version 4.2.1 or later on all 3 affected servers during next maintenance window. Validate patch and test DICOM connectivity post-update.',
    'critical', 'in_progress', '2026-02-01T00:00:00Z', NULL),

  -- From Philips assessment finding
  ('11111111-1111-1111-1111-111111111111',
    (SELECT id FROM risk_assessments WHERE title LIKE 'Philips Healthcare Medical%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'philips-healthcare' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Establish 60-day firmware patching SLA with Philips',
    'Negotiate and formalize a 60-day firmware patching SLA with Philips Healthcare for all medical imaging devices. Include escalation procedures for critical vulnerabilities.',
    'medium', 'open', '2026-03-31T00:00:00Z', NULL),

  -- From MedHost assessment findings (org2)
  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM risk_assessments WHERE title LIKE 'MedHost EHR Annual%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Configure 15-minute session timeout on MedHost clinical workstations',
    'Update MedHost configuration to enforce 15-minute inactivity timeout on all clinical workstations per HIPAA session management requirements. Test with nursing staff for workflow impact.',
    'high', 'in_progress', '2026-04-30T00:00:00Z', NULL),

  ('22222222-2222-2222-2222-222222222222',
    (SELECT id FROM risk_assessments WHERE title LIKE 'MedHost EHR Annual%'),
    NULL,
    (SELECT id FROM vendors WHERE slug = 'medhost' AND organization_id = '22222222-2222-2222-2222-222222222222'),
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Encrypt MedHost archived record storage volumes',
    'Enable AES-256 encryption on all archived record storage volumes used by MedHost. Coordinate with CloudWave hosting team for storage-layer encryption configuration.',
    'medium', 'open', '2026-05-31T00:00:00Z', NULL),

  -- Completed task from McKesson incident
  ('11111111-1111-1111-1111-111111111111',
    NULL,
    (SELECT id FROM incidents WHERE title LIKE 'McKesson Portal%'),
    (SELECT id FROM vendors WHERE slug = 'mckesson' AND organization_id = '11111111-1111-1111-1111-111111111111'),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Reset compromised pharmacy technician credentials',
    'Reset passwords and revoke sessions for the 3 pharmacy technician accounts targeted in the credential stuffing attack. Issue new credentials and enforce MFA enrollment.',
    'critical', 'completed', '2025-11-16T00:00:00Z', '2025-11-16T10:00:00Z');

COMMIT;
