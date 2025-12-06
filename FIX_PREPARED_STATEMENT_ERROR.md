# 🔧 Fix: Prepared Statement Error

## Error
```
ERROR: prepared statement "s0" already exists
```

## Cause
This error occurs when using Supabase **pooler connections** with Prisma. The pooler caches prepared statements, causing conflicts when Prisma tries to create them again.

## ✅ Solution: Add Connection Parameters

Update your `DATABASE_URL` to include parameters that disable prepared statements:

### Option 1: Add `?pgbouncer=true` (Recommended)

Add `?pgbouncer=true&connection_limit=1` to your connection string:

```
postgresql://user:pass@host:port/database?pgbouncer=true&connection_limit=1
```

### Option 2: Use Direct Connection (Best for Migrations)

Get the **direct connection** string from Supabase (NOT pooler):
- Supabase Dashboard → Settings → Database
- Copy "Direct connection" string
- It uses `db.xxxxx.supabase.co` (NOT `pooler.supabase.com`)

### Option 3: Add `?schema=public` Parameter

Sometimes adding the schema parameter helps:
```
postgresql://user:pass@host:port/database?schema=public
```

---

## Quick Fix

I'll update your `.env` file to add the `pgbouncer=true` parameter.

