# Database Deployment Instructions

## Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/llcumzfszyqhwdehvney/sql/new
2. Copy the contents of `src/lib/schema.sql` and paste into the SQL Editor
3. Click "Run"
4. Then copy `src/lib/seed.sql` and run it the same way

## Option 2: Via psql CLI

```bash
# Make sure you can resolve the Supabase host
psql "postgresql://postgres:ZJmxVIzfBRlJXuk4@db.llcumzfszyqhwdehvney.supabase.co:5432/postgres" -f src/lib/schema.sql
psql "postgresql://postgres:ZJmxVIzfBRlJXuk4@db.llcumzfszyqhwdehvney.supabase.co:5432/postgres" -f src/lib/seed.sql
```

## Option 3: Supabase CLI

```bash
npx supabase db push
```

## After Schema Deployment

Create test users via the Supabase Auth dashboard:
1. Go to Authentication > Users
2. Create a user with email/password
3. The app's registration flow will auto-create the org and profile
