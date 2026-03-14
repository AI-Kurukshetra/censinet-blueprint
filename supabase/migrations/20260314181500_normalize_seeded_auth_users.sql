-- ============================================================================
-- Normalize seeded auth.users rows to match GoTrue expectations
-- ============================================================================

WITH seeded AS (
  SELECT id
  FROM auth.users
  WHERE email IN (
    'sarah.chen@pinnaclehealth.org',
    'james.patterson@pinnaclehealth.org',
    'maria.gonzalez@pinnaclehealth.org',
    'robert.williams@lakewoodmed.com',
    'priya.sharma@lakewoodmed.com'
  )
)
UPDATE auth.users u
SET
  aud = 'authenticated',
  role = 'authenticated',
  encrypted_password = extensions.crypt('ChangeMeNow!123', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  invited_at = NULL,
  confirmation_token = '',
  confirmation_sent_at = NULL,
  recovery_token = '',
  recovery_sent_at = NULL,
  email_change_token_new = '',
  email_change = '',
  email_change_sent_at = NULL,
  email_change_token_current = '',
  email_change_confirm_status = 0,
  phone = NULL,
  phone_confirmed_at = NULL,
  phone_change = '',
  phone_change_token = '',
  phone_change_sent_at = NULL,
  reauthentication_token = '',
  reauthentication_sent_at = NULL,
  banned_until = NULL,
  deleted_at = NULL,
  is_sso_user = FALSE,
  is_anonymous = FALSE,
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb),
  updated_at = now()
FROM seeded s
WHERE u.id = s.id;

-- Keep one clean email identity row per seeded user.
DELETE FROM auth.identities i
USING auth.users u
WHERE i.user_id = u.id
  AND u.email IN (
    'sarah.chen@pinnaclehealth.org',
    'james.patterson@pinnaclehealth.org',
    'maria.gonzalez@pinnaclehealth.org',
    'robert.williams@lakewoodmed.com',
    'priya.sharma@lakewoodmed.com'
  )
  AND i.provider = 'email';

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  'email',
  u.email,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email IN (
  'sarah.chen@pinnaclehealth.org',
  'james.patterson@pinnaclehealth.org',
  'maria.gonzalez@pinnaclehealth.org',
  'robert.williams@lakewoodmed.com',
  'priya.sharma@lakewoodmed.com'
);
