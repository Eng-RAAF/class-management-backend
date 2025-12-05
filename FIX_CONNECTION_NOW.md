# 🚨 Quick Fix for Database Connection

## The Problem

Your `DATABASE_URL` is using Supabase **pooler** which doesn't work well with Prisma migrations. You need to use the **direct database connection** instead.

## ✅ Solution: Use Direct Database Endpoint

### Step 1: Get Direct Connection String

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Find **"Connection string"** section
5. Select **"Direct connection"** (NOT pooler)
6. Copy the connection string

It should look like:
```
postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
```

**Note:** Direct connection uses `db.xxxxx.supabase.co` (NOT `pooler.supabase.com`)

### Step 2: Update .env File

Replace your current `DATABASE_URL` with the direct connection string:

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
```

### Step 3: Test Connection

Run in Git Bash or CMD:
```bash
cd backend
node scripts/test-connection.js
```

### Step 4: Run Prisma Push

```bash
npm run db:push
```

---

## Alternative: If Database is Paused

If your Supabase database is paused (free tier):

1. Go to Supabase Dashboard
2. Find your project
3. Click **"Resume"** or **"Restore"**
4. Wait for database to resume
5. Then try connection again

---

## Quick Check: Is Database Active?

1. Open Supabase Dashboard
2. Check project status
3. If it says "Paused" → Click Resume
4. If it says "Active" → Use direct connection string

---

## Still Not Working?

### Option 1: Use Connection Pooling Parameters

Add `?pgbouncer=true` to your connection string:
```
postgresql://user:pass@host:port/db?pgbouncer=true&connection_limit=1
```

### Option 2: Check Network/Firewall

- Ensure your IP is allowed in Supabase
- Check if firewall blocks port 5432
- Try from different network

### Option 3: Verify Credentials

- Double-check username and password
- Make sure password doesn't have special characters that need encoding
- Try resetting database password in Supabase

---

## Current Issue

Your connection string uses:
- ❌ `pooler.supabase.com` (doesn't work well with Prisma migrations)
- ✅ Should use: `db.xxxxx.supabase.co` (direct connection)

**Fix:** Get the direct connection string from Supabase Dashboard and update your `.env` file.

