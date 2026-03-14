-- ============================================================================
-- Disable legacy seeded users that have unstable auth behavior
-- ============================================================================
-- Keep rows for historical foreign-key references, but make accounts non-loginable.

WITH legacy_users AS (
  SELECT id, email
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
  email = 'disabled+' || u.id::text || '@invalid.local',
  encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  banned_until = now() + interval '100 years',
  raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || '{"legacy_disabled": true}'::jsonb,
  updated_at = now()
FROM legacy_users l
WHERE u.id = l.id;

WITH legacy_users AS (
  SELECT id
  FROM auth.users
  WHERE email LIKE 'disabled+%@invalid.local'
)
DELETE FROM auth.identities i
USING legacy_users l
WHERE i.user_id = l.id
  AND i.provider = 'email';

UPDATE user_profiles
SET
  is_active = false,
  updated_at = now()
WHERE email IN (
  'sarah.chen@pinnaclehealth.org',
  'james.patterson@pinnaclehealth.org',
  'maria.gonzalez@pinnaclehealth.org',
  'robert.williams@lakewoodmed.com',
  'priya.sharma@lakewoodmed.com'
);
