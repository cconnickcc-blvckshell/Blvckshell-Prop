# If you ran the migration SQL manually in Supabase

1. In **Supabase Dashboard → SQL Editor**, run the full contents of `20260218160000_add_checklist_run_and_items/migration.sql`.

2. Then record the migration as applied so Prisma doesn’t try to run it again. From the project root (with `DIRECT_URL` set if needed):
   ```bash
   cd portal && npx prisma migrate resolve --applied 20260218160000_add_checklist_run_and_items
   ```
   If that command also times out (pooler), use the same SQL Editor and run the `INSERT` into `_prisma_migrations` as described in Prisma’s docs for your version, or run `migrate resolve` from a machine that can use a direct DB connection.
