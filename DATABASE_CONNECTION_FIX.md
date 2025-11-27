# Database Connection Fix Guide

## Error: Can't reach database server

If you're seeing this error:
```
Can't reach database server at `aws-1-eu-north-1.pooler.supabase.com:5432`
```

## Quick Fixes

### Fix 1: Check Supabase Project Status

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if your project is **Active** (not paused)
3. If paused, click **"Resume"** to activate it
4. Wait a few minutes for the database to start

### Fix 2: Use Direct Connection Instead of Pooler

The error shows you're using the **pooler** connection (port 5432). Try using the **direct connection** instead:

1. Go to Supabase Dashboard → Your Project → Settings → Database
2. Find **Connection string** section
3. Select **"Direct connection"** (not "Connection pooling")
4. Copy the connection string (should have port **6543** or no port specified)
5. Update your `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** 
- Use port **6543** for direct connection (not 5432)
- Or use the connection string without pooler

### Fix 3: Verify DATABASE_URL Format

Your DATABASE_URL should look like:

```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

**For Direct Connection:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**For Pooler (if you must use it):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Fix 4: Check Network/Firewall

1. Ensure your network allows connections to Supabase
2. Check if a firewall is blocking port 5432 or 6543
3. Try from a different network to test

### Fix 5: Test Connection

Run this script to test your connection:

```bash
cd backend
node scripts/test-db-connection.js
```

## Recommended Solution

**Use Direct Connection for Development:**

1. In Supabase Dashboard → Settings → Database
2. Copy the **"Direct connection"** string
3. Update `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
```

**Note:** Replace `xxxxx` with your project reference and `[PASSWORD]` with your actual password.

## After Fixing

1. Restart your backend server
2. Test the connection again
3. If still failing, check Supabase project status

## Common Issues

**Issue:** Project is paused
- **Solution:** Resume project in Supabase dashboard

**Issue:** Wrong password
- **Solution:** Reset password in Supabase → Settings → Database

**Issue:** Using pooler when direct is needed
- **Solution:** Switch to direct connection string

**Issue:** Network blocking
- **Solution:** Check firewall/VPN settings

