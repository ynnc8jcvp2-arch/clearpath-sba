# Phase 1 Database Deployment Guide

**Current Date:** April 26, 2026  
**Target:** Deploy database schema to new Supabase instance and wire backend services

---

## Step 1: Deploy Database Schema to Supabase

Your Supabase project: `dnoceyfxuhekjyiwilsw.supabase.co`

### 1.1 Deploy Authentication Tables (001_create_auth_tables.sql)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`dnoceyfxuhekjyiwilsw`)
3. Navigate to **SQL Editor**
4. Click **+ New Query**
5. Copy the entire contents of `/api/migrations/001_create_auth_tables.sql`
6. Paste into the SQL Editor
7. Click **Run**
8. Verify: You should see three tables created:
   - `user_roles`
   - `role_permissions`
   - `audit_logs`

### 1.2 Deploy Surety Domain Tables (002_create_surety_tables.sql)

1. Click **+ New Query** in SQL Editor
2. Copy the entire contents of `/api/migrations/002_create_surety_tables.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Verify: You should see five tables created:
   - `surety_applications`
   - `surety_analyses`
   - `surety_documents`
   - `surety_risk_factors`
   - `surety_recommendations`

### 1.3 Deploy SBA Loans Domain Tables (003_create_sba_tables.sql)

1. Click **+ New Query** in SQL Editor
2. Copy the entire contents of `/api/migrations/003_create_sba_tables.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Verify: You should see five tables created:
   - `sba_loans`
   - `sba_documents`
   - `sba_analyses`
   - `sba_amortization_schedules`
   - `sba_term_sheets`

### 1.4 Verify All Tables

In Supabase Dashboard, go to **Table Editor** and verify you see:

**Auth Tables:**
- user_roles
- role_permissions
- audit_logs

**Surety Tables:**
- surety_applications
- surety_analyses
- surety_documents
- surety_risk_factors
- surety_recommendations

**SBA Tables:**
- sba_loans
- sba_documents
- sba_analyses
- sba_amortization_schedules
- sba_term_sheets

---

## Step 2: Create First Admin User

### 2.1 Create a Google OAuth Test Account

If you don't have a test Google account:
1. Go to [accounts.google.com](https://accounts.google.com)
2. Create a new account or use an existing one
3. Note the email address

### 2.2 Assign Admin Role in Supabase

1. In Supabase **SQL Editor**, click **+ New Query**
2. Run this SQL (replace with your email):

```sql
-- Insert admin user role
INSERT INTO user_roles (user_id, role, organization_id)
SELECT id, 'admin', null
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

3. After your first login via Google OAuth, the user will exist in `auth.users`
4. Run the above query to assign the `admin` role

---

## Step 3: Test Authentication & Database Connection

### 3.1 Start Dev Server

```bash
cd /Users/camre/clearpath
npm run dev
```

### 3.2 Test OAuth Flow

1. Navigate to `http://localhost:5173`
2. Click **Sign in with Google**
3. Complete Google authentication
4. You should be redirected to home page
5. Check browser console for any errors

### 3.3 Test Protected API Endpoint

```bash
# Get your auth token from localStorage
# In browser console:
# const token = localStorage.getItem('sb-dnoceyfxuhekjyiwilsw-auth-token')
# If needed, parse: JSON.parse(token).session.access_token

# Test a protected endpoint
curl -X POST http://localhost:3000/api/v1/sba-loans/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "document": {
      "name": "test.pdf",
      "content": "test content",
      "type": "application/pdf"
    },
    "documentType": "balance-sheet"
  }'
```

Expected response: `200 OK` with parsed document data

---

## Step 4: Verify RLS Policies

### 4.1 Check RLS is Enabled

In Supabase **Table Editor**:
1. Click on any table (e.g., `sba_loans`)
2. Look for **RLS** indicator at the top
3. Should show "RLS Enabled"

### 4.2 Understand RLS Policies

Each domain table has RLS policies that ensure:
- Users can only view/edit their own data
- Admins can view all data
- Data is automatically filtered by authenticated user

---

## Step 5: Database Environment Variables

Your `.env.local` has been updated with:

```bash
VITE_SUPABASE_URL="https://dnoceyfxuhekjyiwilsw.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

These are used by:
- Frontend: Supabase client initialization (src/auth/AuthProvider.jsx)
- Backend: JWT verification in auth middleware (api/middleware/auth.js)

---

## Step 6: Next Steps (Week 2-3)

### Wire Service Layers
- [ ] Deploy `/api/v1/sba-loans/upload` endpoint to persist to `sba_documents` table
- [ ] Deploy `/api/v1/surety/upload` endpoint to persist to `surety_documents` table
- [ ] Create SBA service layer for loan calculations and term sheet generation
- [ ] Enhance Surety service layer for spreading analysis and WIP analysis

### Frontend Integration
- [ ] Update App.jsx to call authenticated API endpoints with token
- [ ] Handle 401/403 auth errors
- [ ] Display results from backend

### Deployment
- [ ] Redeploy to Vercel with new Supabase credentials
- [ ] Test end-to-end on clearpathsbaloan.com

---

## Troubleshooting

### Issue: "Cannot find module 'supabase'" in API endpoints

**Solution:** The Node.js API doesn't have Supabase client pre-initialized. Backend will use Supabase REST API directly or a simple PostgreSQL client. Frontend handles authentication via Supabase.

### Issue: RLS blocking all queries

**Solution:** Verify:
1. User is authenticated (has valid JWT)
2. User has a row in `user_roles` table
3. RLS policies reference `auth.uid()` correctly

Check Supabase logs: **SQL Editor** → **Logs** tab

### Issue: CORS errors when calling API from frontend

**Solution:** The Vercel API routes handle CORS. Ensure:
1. `.vercelignore` includes `/node_modules` but not `/api`
2. API environment variables are set
3. Request includes `Authorization: Bearer <token>` header

---

## Success Criteria

- [ ] All 3 migration files executed in Supabase
- [ ] 13 tables created (auth + surety + SBA)
- [ ] First user created via Google OAuth
- [ ] First user has `admin` role assigned
- [ ] Protected API endpoint returns 200 with authenticated request
- [ ] Protected API endpoint returns 401 without auth header
- [ ] RLS is enabled on all domain tables
- [ ] Ready for Phase 1 Week 2-3 backend wiring

---

## Files Modified

- `.env.local` — Updated with new Supabase project credentials
- `/api/migrations/001_create_auth_tables.sql` — Existing, ready to deploy
- `/api/migrations/002_create_surety_tables.sql` — New, ready to deploy
- `/api/migrations/003_create_sba_tables.sql` — New, ready to deploy

## Next Commits

```bash
# After deploying database schema:
git add api/migrations/002_create_surety_tables.sql
git add api/migrations/003_create_sba_tables.sql
git add PHASE_1_DEPLOYMENT_GUIDE.md
git commit -m "Deploy Phase 1 Surety and SBA database schema migrations"
```

---

## Questions?

Reference these files for detailed information:
- `/PHASE_1_STATUS.md` — Overall project status
- `/PHASE_1_AUTH_IMPLEMENTATION.md` — Authentication and RBAC details
- `/api/middleware/auth.js` — JWT verification logic
