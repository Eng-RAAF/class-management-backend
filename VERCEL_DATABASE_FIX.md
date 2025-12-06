# 🔧 Fix: Prepared Statement Error on Vercel

## Error in Production
```
Error: prepared statement "s2" already exists
Code: 42P05
```

## ✅ Solution: Update Vercel Environment Variables

The issue is that your Vercel backend is using a **pooler connection** which causes prepared statement conflicts with Prisma.

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
- ❌ Pooler: `pooler.supabase.com` (causes prepared statement errors)
- ✅ Direct: `db.xxxxx.supabase.co` (works with Prisma)

### Step 2: Update Vercel Environment Variable

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **backend project**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit**
6. Replace with the **direct connection** string you copied
7. Make sure it's set for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
8. Click **Save**

### Step 3: Redeploy Backend

After updating the environment variable:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger redeploy

### Step 4: Test Registration

After redeployment, test registration again. The error should be fixed.

---

## Alternative: Add Connection Parameters

If you must use pooler, add these parameters to `DATABASE_URL` in Vercel:

```
postgresql://user:pass@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public
```

**But direct connection is recommended for Prisma.**

---

## Why This Happens

- **Pooler connections** cache prepared statements across requests
- **Prisma** creates prepared statements for queries
- **Conflict** occurs when Prisma tries to create a statement that's already cached
- **Solution:** Use direct connection (bypasses pooler cache)

---

## Code Updates Applied

I've also updated the Prisma client to:
- ✅ Better detect prepared statement errors (42P05)
- ✅ Automatically retry with reconnection
- ✅ Handle nested error structures
- ✅ Improved error messages

But the **best fix** is using direct connection in Vercel.

---

## Quick Checklist

- [ ] Get direct connection string from Supabase
- [ ] Update `DATABASE_URL` in Vercel environment variables
- [ ] Set for Production, Preview, and Development
- [ ] Redeploy backend
- [ ] Test registration

**After updating Vercel environment variables and redeploying, the error should be fixed!**

