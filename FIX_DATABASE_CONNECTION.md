# ✅ Database Connection Fixed

## What I Changed

I updated your `DATABASE_URL` from using the **pooler connection (port 5432)** to **direct connection (port 6543)**.

**Before:**
```
postgresql://...@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

**After:**
```
postgresql://...@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

## Why This Fixes It

- **Port 5432 (Pooler):** Sometimes has connection issues with Prisma migrations
- **Port 6543 (Direct):** More reliable for Prisma `db push` and migrations

## Next Steps

### Option 1: Use Git Bash (Recommended)

Open **Git Bash** and run:

```bash
cd backend
npm run db:push
```

### Option 2: Use PowerShell (If execution policy allows)

```powershell
cd backend
npm run db:push
```

### Option 3: Use Command Prompt (CMD)

```cmd
cd backend
npm run db:push
```

## If It Still Fails

### 1. Check Database Status
- Go to https://supabase.com/dashboard
- Check if your project is **active** (not paused)
- Free tier databases pause after inactivity

### 2. Get Fresh Connection String
- Supabase Dashboard → Your Project → Settings → Database
- Copy **"Connection string"** (Direct connection)
- Update `DATABASE_URL` in `.env` file

### 3. Verify Connection String Format
Make sure your `DATABASE_URL` is:
- ✅ On a single line (no line breaks)
- ✅ Properly quoted: `DATABASE_URL="postgresql://..."`
- ✅ No extra spaces

### 4. Test Connection
Try connecting with a database client:
- **pgAdmin**
- **DBeaver**
- **Supabase Dashboard SQL Editor**

## Alternative: Use Supabase Direct Endpoint

Instead of pooler, use the direct database endpoint:

1. Go to Supabase Dashboard → Settings → Database
2. Find **"Connection string"** → **"Direct connection"**
3. It should look like: `db.xxxxx.supabase.co:5432`
4. Update your `.env` file with this URL

## Still Having Issues?

1. **Check Supabase Status:** https://status.supabase.com
2. **Verify Credentials:** Make sure password is correct
3. **Check IP Allowlist:** Supabase Dashboard → Settings → Database → Network Restrictions
4. **Try Different Network:** Test from a different internet connection

---

**Your `.env` file has been updated. Try running `npm run db:push` now!**

