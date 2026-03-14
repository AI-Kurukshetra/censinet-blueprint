-- ============================================================================
-- Fix malformed seeded auth identities/users
-- ============================================================================
-- Seeded users were inserted manually and may not match GoTrue expectations for
-- email provider identity shape. Normalize those rows for password grant flow.

DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT id, email
    FROM auth.users
    WHERE email IN (
      'sarah.chen@pinnaclehealth.org',
      'james.patterson@pinnaclehealth.org',
      'maria.gonzalez@pinnaclehealth.org',
      'robert.williams@lakewoodmed.com',
      'priya.sharma@lakewoodmed.com'
    )
  LOOP
    DELETE FROM auth.identities
    WHERE user_id = u.id
      AND provider = 'email';

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
    VALUES (
      gen_random_uuid(),
      u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email),
      'email',
      u.id::text,
      now(),
      now(),
      now()
    );

    UPDATE auth.users
    SET
      aud = 'authenticated',
      role = 'authenticated',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      updated_at = now()
    WHERE id = u.id;
  END LOOP;
END $$;
