# 🔧 Database Connection Fix Guide

## Current Issue

Your `DATABASE_URL` is using Supabase **pooler connection** which doesn't work with Prisma migrations.

**Current (Pooler - ❌ Doesn't work):**
```
postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

## ✅ Solution: Use Direct Connection

### Option 1: Use Direct Connection Port (Quick Fix)

I've updated your `.env` to use port **6543** (direct connection port for pooler):

```
postgresql://user:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Try running:**
```bash
npm run db:push
```

### Option 2: Get Direct Database Endpoint (Best Solution)

For better reliability, use the actual direct database endpoint:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get Direct Connection String:**
   - Go to: **Settings** → **Database**
   - Find **"Connection string"** section
   - Select **"Direct connection"** (NOT "Connection pooling")
   - Copy the connection string

3. **It should look like:**
   ```
   postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
   ```
   
   **Note:** Direct connection uses `db.xxxxx.supabase.co` (NOT `pooler.supabase.com`)

4. **Update `.env` file:**
   - Open `backend/.env`
   - Replace `DATABASE_URL` with the direct connection string
   - Save the file

5. **Test Connection:**
   ```bash
   npm run db:push
   ```

---

## Why This Happens

- **Pooler (port 5432):** For application connections, NOT migrations
- **Direct (port 6543 or db.xxxxx.supabase.co):** For migrations and admin operations

Prisma `db push` requires a direct connection, not a pooler.

---

## If Database is Paused

Supabase free tier pauses databases after inactivity:

1. Go to Supabase Dashboard
2. Check project status
3. If paused, click **"Resume"** or **"Restore"**
4. Wait for database to resume
5. Then try connection again

---

## Connection String Format

Make sure your `DATABASE_URL` is:
- ✅ On a single line (no line breaks)
- ✅ Properly quoted: `DATABASE_URL="postgresql://..."`
- ✅ Uses direct connection endpoint
- ✅ No extra spaces

---

## Test Connection

After updating, test with:
```bash
cd backend
node scripts/test-connection.js
```

Or run Prisma push:
```bash
npm run db:push
```

---

## Still Having Issues?

1. **Check Supabase Status:** https://status.supabase.com
2. **Verify Credentials:** Make sure password is correct
3. **Check IP Allowlist:** Supabase Dashboard → Settings → Database → Network Restrictions
4. **Try Different Network:** Test from a different internet connection
5. **Contact Support:** Supabase Support or Discord

---

**Your `.env` has been updated to use port 6543. Try `npm run db:push` now!**

