# Database Deployment Instructions

This project uses Supabase CLI migrations as the source of truth.

## Production (linked project)

```bash
npx supabase db push --linked
```

## Local development

```bash
npm run db:reset
```

## Optional local reset without seed

```bash
npm run db:reset:no-seed
```

## Notes

1. Apply schema changes by creating a new file under `supabase/migrations/`.
2. Keep non-essential demo data in `supabase/seed.sql` (local-only by default).
3. Create auth users from Supabase Dashboard or app registration flow.
