# 🔧 Fix: Prisma Prepared Statement Error

## Error
```
ERROR: prepared statement "s0" already exists
```

## ✅ Solution Applied

I've added `?pgbouncer=true&connection_limit=1` to your `DATABASE_URL`.

**Current connection:**
```
postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## ⚠️ Better Solution: Use Direct Connection

For Prisma migrations (`db push`), you should use the **direct connection endpoint**, not the pooler.

### Step 1: Get Direct Connection String

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Find **"Connection string"** section
5. Select **"Direct connection"** (NOT "Connection pooling")
6. Copy the connection string

**It should look like:**
```
postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

**Key difference:**
- ❌ Pooler: `pooler.supabase.com` (for applications)
- ✅ Direct: `db.xxxxx.supabase.co` (for migrations)

### Step 2: Update .env File

Replace `DATABASE_URL` in `backend/.env` with the direct connection string.

### Step 3: Run Migration

```bash
npm run db:push
```

---

## Why This Happens

- **Pooler connections** cache prepared statements
- **Prisma migrations** create new prepared statements
- **Conflict** occurs when Prisma tries to create statements that already exist

**Solution:** Use direct connection for migrations (bypasses pooler cache)

---

## Alternative: Use Two Connection Strings

You can use:
- **Direct connection** for migrations (`db push`, `migrate`)
- **Pooler connection** for application runtime

But for simplicity, using direct connection for both works fine.

---

## Quick Test

After updating to direct connection, test with:
```bash
npm run db:push
```

If it works, you're all set! ✅

