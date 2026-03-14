-- ============================================================================
-- Repair seeded demo users by copying a known-good password hash format
-- ============================================================================
-- After DB reset, manually seeded auth.users rows can have a hash format or
-- metadata shape that GoTrue rejects at token grant time. Clone fields from a
-- known-good signup account.

WITH template_user AS (
  SELECT
    encrypted_password,
    raw_app_meta_data,
    aud,
    role
  FROM auth.users
  WHERE email LIKE 'post.reset.%@example.com'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE auth.users u
SET
  encrypted_password = t.encrypted_password,
  raw_app_meta_data = t.raw_app_meta_data,
  aud = t.aud,
  role = t.role,
  email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
  updated_at = now()
FROM template_user t
WHERE u.email IN (
  'sarah.chen@pinnaclehealth.org',
  'james.patterson@pinnaclehealth.org',
  'maria.gonzalez@pinnaclehealth.org',
  'robert.williams@lakewoodmed.com',
  'priya.sharma@lakewoodmed.com'
);
