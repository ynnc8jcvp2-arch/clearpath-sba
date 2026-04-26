# ClearPath Security Architecture — Phase 1 Implementation
## Authentication & Authorization for Trisura

**Status:** Design Phase | Not Yet Implemented
**Priority:** Critical for Phase 1
**Timeline:** Weeks 1-2 of Phase 1 (parallel with backend setup)

---

## Current State vs. Required State

### Current State (Today)
```
❌ No authentication
❌ No authorization/role-based access
❌ All features accessible to anyone
❌ No user session management
❌ No audit logging
```

### Required State for Trisura (Enterprise)
```
✅ OAuth 2.0 with Google / SSO integration
✅ Role-based access control (RBAC)
✅ Session management with secure tokens
✅ Audit logging of all actions
✅ Compliance with enterprise security standards
```

---

## Recommended Authentication Architecture

### Option 1: Supabase Auth + Google OAuth (RECOMMENDED)
**Why this option:**
- Supabase already configured
- Google OAuth matches enterprise IT practices
- Built-in session management
- Scales to enterprise needs
- Good for Trisura's IT security team

**Components:**
```
User Login Flow:
  1. User clicks "Sign in with Google"
  2. Redirects to Google OAuth consent screen
  3. Google returns auth token
  4. Supabase validates token
  5. Creates/updates user session
  6. App checks role permissions
  7. Routes to appropriate dashboard
```

**Implementation Stack:**
- `@supabase/auth-helpers-react` (session management)
- `@supabase/supabase-js` (already installed)
- Google OAuth credentials (created in Google Cloud Console)
- Supabase Auth configuration (built-in, no extra library needed)

**Estimated Effort:** 3-4 days

---

### Option 2: Okta / Microsoft Entra (Enterprise SSO)
**Why consider:**
- Trisura may already use Okta or Azure AD
- Centralized identity management
- Advanced conditional access
- Better for large enterprises

**Downside:**
- Requires additional integration library
- Longer setup time with Trisura IT
- Higher complexity

**Estimated Effort:** 5-7 days (depends on Trisura's setup)

---

## Implementation Plan: Google OAuth + Supabase Auth

### Phase 1, Week 1-2: Setup Authentication

#### Step 1: Google OAuth Credentials (1 day)
```
1. Create Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
   - Application type: Web application
   - Authorized redirect URIs:
     - http://localhost:3000/auth/callback (dev)
     - https://clearpathsbaloan.com/auth/callback (prod)
     - https://trisura-internal.clearpath.com/auth/callback (Trisura staging)
4. Copy client_id and client_secret
5. Store in .env securely
```

#### Step 2: Supabase Auth Configuration (0.5 days)
```
1. Log into Supabase dashboard
2. Go to Authentication > Providers
3. Enable "Google" provider
4. Enter Google OAuth credentials
5. Configure callback URL
6. Set redirect policy (auto-redirect to app)
```

#### Step 3: Create React Authentication Components (2 days)
```
File: src/auth/useAuth.ts
├── useAuth() hook
│   ├── User state (user object, loading, error)
│   ├── Session management
│   ├── Sign-in function
│   ├── Sign-out function
│   └── Check auth status
├── Return: { user, session, loading, signIn, signOut, isAuthenticated }

File: src/auth/AuthProvider.jsx
├── Context wrapper for app
├── Initialize Supabase session on mount
├── Listen for auth changes
├── Refresh token on expiry
└── Provide auth state to entire app

File: src/auth/LoginPage.jsx
├── Landing page for unauthenticated users
├── "Sign in with Google" button
├── Company branding (ClearPath + Trisura co-branding option)
├── Privacy/Security callouts
└── Error handling

File: src/auth/ProtectedRoute.jsx
├── Wrapper component for authenticated pages
├── Check isAuthenticated
├── Redirect to login if not authenticated
├── Show loading while auth checks
```

#### Step 4: Integrate into App Shell (1 day)
```
Modify: src/App.jsx

Before:
  <div className="min-h-screen...">
    <header>...</header>
    <main>
      {page === 'home' && <Overview />}
      ...
    </main>
  </div>

After:
  <AuthProvider>
    {isAuthenticated ? (
      <div className="min-h-screen...">
        <header>...</header>
        <main>
          {page === 'home' && <Overview />}
          ...
        </main>
      </div>
    ) : (
      <LoginPage />
    )}
  </AuthProvider>
```

---

## Role-Based Access Control (RBAC)

### User Roles (Database Schema)
```sql
-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  role VARCHAR(50) NOT NULL, -- 'admin', 'underwriter', 'viewer'
  organization_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- Role permissions mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL, -- 'read:bonds', 'write:bonds', 'export:pdf', etc.
  created_at TIMESTAMP DEFAULT now()
);
```

### Role Definitions
```
ADMIN
  ├── Create/edit/delete underwriters
  ├── Access all bonds in organization
  ├── View audit logs
  ├── Configure system settings
  └── Export reports

UNDERWRITER
  ├── View assigned bonds
  ├── Create/edit bond analyses
  ├── Generate term sheets
  ├── Export to PDF
  └── View own audit trail

VIEWER (Optional)
  ├── Read-only access to bonds
  ├── View reports
  └── No editing/exporting
```

### Authorization Check Example
```javascript
// In any component:
const { user } = useAuth();
const hasPermission = (permission) => {
  // Check user's role against permission
  return user?.permissions?.includes(permission);
};

// Usage:
{hasPermission('write:bonds') ? (
  <button onClick={handleEdit}>Edit Bond</button>
) : (
  <span className="text-slate-500">Read-only access</span>
)}
```

---

## Session Management & Security

### Token Handling
```javascript
// Supabase automatically manages:
// - JWT tokens (short-lived, ~1 hour)
// - Refresh tokens (long-lived, encrypted)
// - Token rotation on refresh
// - Automatic refresh before expiry
// - Secure cookie storage (option)
```

### Session Lifecycle
```
User Login
  ↓
[Access Token: 1 hour] + [Refresh Token: 7 days]
  ↓
App stores in memory (secure)
  ↓
On each API call: Include access token in header
  ↓
Token expires? Automatically refreshed with refresh token
  ↓
User closes app? Session persists (refresh token valid)
  ↓
User logs out? Both tokens invalidated
```

---

## Audit Logging (Phase 1 Nice-to-Have, Phase 2 Required)

### What to Log
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100), -- 'create_bond', 'upload_document', 'export_pdf'
  resource_type VARCHAR(50), -- 'bond', 'document', 'report'
  resource_id UUID,
  timestamp TIMESTAMP DEFAULT now(),
  ip_address INET,
  details JSONB -- any additional context
);
```

### Example Entries
```
2026-04-26 10:15:22 | user_123 | create_bond | bond | bond_456
2026-04-26 10:16:45 | user_123 | upload_document | document | doc_789
2026-04-26 10:18:30 | user_456 | view_bond | bond | bond_456
2026-04-26 10:20:15 | user_123 | export_pdf | report | rep_012
```

---

## Environment Variables (Add to .env)

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET" # Server-side only

# Supabase (already exists, verify):
VITE_SUPABASE_URL="https://kwtgkckoqhirkqsyggxg.supabase.co"
VITE_SUPABASE_ANON_KEY="..."

# Security
SESSION_COOKIE_SECURE=true # Only in production
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE="Strict"
```

---

## Security Checklist for Trisura

### Authentication
- ✅ OAuth 2.0 (Google or SSO)
- ✅ No password storage (delegated to Google)
- ✅ Session tokens with expiry
- ✅ Automatic token refresh
- ✅ Secure logout flow

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Role-based UI (hide unauthorized actions)
- ✅ Backend validation of permissions (all API calls checked)

### Data Protection
- ✅ HTTPS only (enforced)
- ✅ No sensitive data in URLs
- ✅ No sensitive data in localStorage (use secure cookies)
- ✅ Input validation on all forms
- ✅ Output escaping to prevent XSS

### Audit & Compliance
- ✅ Audit logging of all actions
- ✅ Timestamp all events
- ✅ IP logging for security review
- ✅ Exportable logs for compliance

### Infrastructure
- ✅ Supabase PostgreSQL (encrypted at rest)
- ✅ Row-level security (RLS) on database tables
- ✅ SSL/TLS for all connections
- ✅ Rate limiting on APIs
- ✅ DDoS protection (Vercel + Cloudflare)

---

## Conversation Starter for Trisura Discovery Call

**What to Ask:**
1. "Do you have an existing SSO provider (Google Workspace, Microsoft Entra, Okta)?"
   - If yes: Prioritize that provider over generic Google OAuth
   - If no: Google OAuth is industry-standard for quick deployment

2. "What are your security certifications or compliance requirements?"
   - SOC 2 Type II?
   - ISO 27001?
   - HIPAA/GLBA?
   - Industry-specific requirements?

3. "Do you have a preferred authentication method?"
   - Google Sign-In?
   - Corporate SSO?
   - API key authentication?

4. "What audit and compliance logging do you need?"
   - Who can export logs?
   - How long do you retain?
   - What fields are critical?

---

## Implementation Dependency Map

```
┌─────────────────────────────────────────┐
│ Week 1: Authentication Setup            │
├─────────────────────────────────────────┤
│ ✅ Google OAuth credentials (1 day)     │
│ ✅ Supabase Auth config (0.5 day)       │
│ ✅ Auth components (2 days)             │
│ ✅ App integration (1 day)              │
│ ✅ Testing (0.5 day)                    │
└────────────────────────────────────────┬┘
                                          │
                                          ↓
┌─────────────────────────────────────────┐
│ Week 2: Authorization & Audit Logging   │
├─────────────────────────────────────────┤
│ ✅ RBAC database schema (1 day)         │
│ ✅ Role permission components (1 day)   │
│ ✅ Backend role checks (1 day)          │
│ ✅ Audit logging (1 day)                │
│ ✅ Testing & documentation (1 day)      │
└─────────────────────────────────────────┘
```

---

## What to Tell Trisura

**In your pitch/discovery call:**

> "Security is foundational. We're implementing enterprise-grade authentication with Google OAuth and Supabase, giving you:
>
> - **Single Sign-On:** Seamless login for your team (no password management)
> - **Role-Based Access:** Granular permissions (Admin/Underwriter/Viewer)
> - **Audit Trails:** Every action logged for compliance and security review
> - **Enterprise-Ready:** SOC 2, RLS, encrypted data, HTTPS everywhere
>
> During Phase 1 (Weeks 1-2), we'll integrate your preferred authentication provider—whether that's Google Workspace, Microsoft Entra, or custom SSO. Your IT team will own the access policies."

---

## Post-Implementation Testing

### Test Scenarios
```
✅ User can log in with Google
✅ Session persists across page refresh
✅ Token refreshes automatically before expiry
✅ User can view assigned data based on role
✅ Admin can promote underwriter to admin
✅ Underwriter cannot access admin settings
✅ All actions appear in audit log
✅ User can log out and session is invalidated
✅ Invalid token rejected by API
✅ Concurrent sessions handled correctly
```

### Security Testing
```
✅ No sensitive data in local storage
✅ XSS protection (input sanitization)
✅ CSRF protection on state-changing operations
✅ No SQL injection vulnerability
✅ Rate limiting works (test with many requests)
✅ DDoS protection active
✅ SSL certificate valid
```

---

## Budget Impact

**Authentication Implementation:**
- Development: 40 hours ($2,000-$3,000 contractor rate)
- Infrastructure: $0 (Supabase auth included)
- Testing & security audit: 10 hours ($500-$750)
- **Total: $2,500-$3,750** (part of Phase 1 backend work)

**No additional licensing costs** — Google OAuth and Supabase Auth are free tier.

---

## Next Steps Before Pitch

1. **Mention security architecture in discovery call:**
   > "We're building enterprise-grade authentication. What provider would work best for your team?"

2. **During Phase 1 kickoff:**
   - Clarify their SSO preferences
   - Get Google OAuth credentials from them (if using corporate Google Workspace)
   - Define role structure for their organization

3. **Communicate timeline:**
   > "Authentication is Weeks 1-2 of Phase 1. You'll have login working while we build the backend APIs in parallel."

---

**This security architecture meets enterprise requirements while keeping implementation lean for Phase 1.** 🔒
