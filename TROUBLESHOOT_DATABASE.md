# Database Connection Troubleshooting Guide

## Error: P1001 - Can't reach database server

This error means Prisma cannot connect to your PostgreSQL database.

### Quick Fixes

#### 1. **Use Direct Connection Instead of Pooler**

Supabase poolers (port 5432) sometimes have connection issues. Try using direct connection (port 6543):

**Current (Pooler):**
```
postgresql://user:pass@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

**Direct Connection:**
```
postgresql://user:pass@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

**Or use the direct connection URL from Supabase Dashboard:**
- Go to Supabase Dashboard → Your Project → Settings → Database
- Copy the "Connection string" (Direct connection)
- Replace `DATABASE_URL` in `.env` file

#### 2. **Check if Database is Paused**

Supabase free tier pauses databases after inactivity:
1. Go to https://supabase.com/dashboard
2. Check your project status
3. If paused, click "Resume" or "Restore"

#### 3. **Verify Connection String Format**

Your `DATABASE_URL` should be:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

Make sure:
- ✅ No spaces in the connection string
- ✅ Password is URL-encoded (special characters encoded)
- ✅ Port is correct (5432 for pooler, 6543 for direct)

#### 4. **Test Connection Manually**

Try connecting with `psql` or a database client:
```bash
psql "postgresql://user:pass@host:port/database"
```

#### 5. **Check Network/Firewall**

- Ensure your IP is allowed in Supabase dashboard
- Check if firewall is blocking port 5432 or 6543
- Try from a different network

#### 6. **Use Connection Pooling Parameters**

Add connection pooling parameters to your DATABASE_URL:
```
postgresql://user:pass@host:port/database?pgbouncer=true&connection_limit=1
```

### Step-by-Step Fix

1. **Get Direct Connection URL:**
   - Supabase Dashboard → Project Settings → Database
   - Copy "Connection string" (Direct connection, not pooler)

2. **Update .env file:**
   ```bash
   DATABASE_URL="postgresql://postgres.xxx:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
   ```

3. **Test Connection:**
   ```bash
   npm run db:push
   ```

4. **If Still Failing:**
   - Check Supabase project is active (not paused)
   - Verify database credentials
   - Check Supabase status page: https://status.supabase.com

### Alternative: Use Supabase Direct Connection

Instead of pooler, use the direct connection endpoint:
- Format: `db.xxxxx.supabase.co:5432`
- Get it from: Supabase Dashboard → Settings → Database → Connection string

### Still Not Working?

1. **Check Supabase Dashboard:**
   - Is project active?
   - Are credentials correct?
   - Is database accessible?

2. **Try Different Connection Method:**
   - Use Supabase CLI: `supabase db push`
   - Use Supabase Dashboard SQL Editor
   - Use a database client (pgAdmin, DBeaver)

3. **Contact Support:**
   - Supabase Support: https://supabase.com/support
   - Check Supabase Discord: https://discord.supabase.com

