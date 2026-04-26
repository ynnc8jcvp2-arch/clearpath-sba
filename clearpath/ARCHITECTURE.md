# ClearPath Architecture

## System Overview

ClearPath uses a **modular monolith** architecture with two isolated business domains sharing a common document parsing core.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ClearPath Frontend (Vite/React)              │
│                                                                  │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐ │
│  │   SBA Loan Processing        │  │ Surety Bond Underwriting│ │
│  │  (App.jsx)                   │  │  (SuretyApplicationForm)│ │
│  │                              │  │                         │ │
│  │  - Application form          │  │  - Document upload      │ │
│  │  - Amortization schedule     │  │  - Analysis display     │ │
│  │  - Loan parameters           │  │  - Risk assessment      │ │
│  └──────────────────────────────┘  └─────────────────────────┘ │
│                                                                  │
│              AppRouter.jsx (Navigation & Routing)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                    HTTP Requests (REST API)
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
    ┌───▼──────────────────────────────────────────────┐│
    │  Vercel Serverless Functions (/api)             ││
    │                                                  ││
    │  POST /api/v1/surety/process-application        ││
    │    ├─ Parse Document (Shared Core)              ││
    │    ├─ Spreading Analysis                        ││
    │    ├─ WIP Analysis                              ││
    │    └─ Underwriting Summary                      ││
    └────────────────────────────────────────────────┘│
            │
            │ SQL / Supabase Client
            │
    ┌───────▼────────────────────────────────────────┐
    │  Supabase PostgreSQL Database                  │
    │                                                │
    │  ┌──────────────────────────────────────────┐ │
    │  │  Surety Domain Tables                    │ │
    │  │  ├─ surety_applications                 │ │
    │  │  ├─ surety_analyses                     │ │
    │  │  ├─ surety_documents                    │ │
    │  │  ├─ surety_risk_factors                │ │
    │  │  └─ surety_recommendations              │ │
    │  └──────────────────────────────────────────┘ │
    │                                                │
    │  (SBA tables: tbd)                             │
    └────────────────────────────────────────────────┘
```

## Modular Monolith Pattern

### Domains
1. **SBA Loan Processing** (existing)
   - Location: `/src/App.jsx` + `/src/components`
   - Responsibility: SBA 7(a) loan origination and underwriting
   - API: Uses Anthropic API for parameter extraction + term sheet generation
   - Database: (to be migrated to Supabase)

2. **Surety Bond Underwriting** (new)
   - Location: `/src/domains/surety/`
   - Responsibility: Commercial surety bond risk analysis
   - API: `/api/v1/surety/*`
   - Database: `surety_*` tables in Supabase

### Shared Core
- **Document Parser** (planned)
  - Location: `/src/core/parser/` (to be created)
  - Responsibility: Extract financial data from documents
  - Used by: Both SBA and Surety domains
  - Technology: Text parsing + optional OCR (future enhancement)

## Domain: Surety Bond Underwriting

### Directory Structure
```
src/domains/surety/
├── api/
│   └── suretyClient.js              # REST API client
├── components/
│   ├── SuretyApplicationForm.jsx     # Document upload & form
│   └── AnalysisResults.jsx           # Results display
├── db/
│   ├── schema.sql                    # Database schema
│   └── suretyDatabase.js             # Database CRUD operations
└── README.md                          # Domain-specific documentation
```

### Request Flow: Analyze Document

```
1. User uploads document
   └─ SuretyApplicationForm.jsx
      └─ File validation (10MB, supported types)
         └─ Reader.readAsText()

2. Submit for analysis
   └─ SuretyClient.processApplication()
      └─ POST /api/v1/surety/process-application
         ├─ Document content (text)
         ├─ Document name
         ├─ Document type (balance-sheet, income-statement, etc.)
         └─ Analysis type (full, spreading, wip)

3. Server-side processing
   └─ /api/v1/surety/process-application.js
      ├─ Parse document
      │  └─ Extract financial metrics (revenues, expenses, assets, liabilities)
      ├─ Run spreading analysis
      │  └─ Calculate as-allowed adjustments (SBA compliance)
      ├─ Run WIP analysis
      │  └─ Assess work-in-progress & bond exposure
      └─ Generate underwriting summary
         ├─ Determine overall risk level
         ├─ Identify risk factors
         └─ Provide recommendations

4. Return analysis to client
   └─ Response JSON
      ├─ metadata (document ID, date, parsing confidence)
      ├─ parsed (normalized + raw data)
      ├─ spreadingAnalysis
      ├─ wipAnalysis
      └─ underwritingSummary

5. Display results
   └─ AnalysisResults.jsx
      ├─ Risk badge (critical/high/moderate/low)
      ├─ Key metrics grid
      ├─ Expandable spreading section
      ├─ Expandable WIP section
      ├─ Risk factors list
      └─ Recommendations
```

### Database Persistence (Optional)

Currently, analysis results are displayed but not automatically saved. To persist:

```javascript
// In SuretyApplicationForm.jsx, after analysis completes:
import { createApplication } from '../db/suretyDatabase';

const result = await SuretyClient.processApplication(document, options);

// Optionally save to database:
if (shouldSave) {
  await createApplication({
    documentId: result.metadata.documentId,
    documentName: document.name,
    documentType: documentType,
    applicantName: 'TBD', // Extract from document or UI
    businessType: 'TBD',
    industry: 'TBD',
    analysis: result
  });
}
```

## API Architecture

### Serverless Functions
- **Platform**: Vercel Functions
- **Runtime**: Node.js 18+
- **Location**: `/api/v1/<domain>/<action>.js`
- **Scaling**: Auto-scales with demand
- **Cold start**: ~1 second (within budget)

### API Endpoints

#### POST /api/v1/surety/process-application
Process financial document and generate analysis.

**Request Body:**
```json
{
  "documentContent": "string (text content of document)",
  "documentName": "string (filename)",
  "documentType": "enum (balance-sheet|income-statement|tax-return|cash-flow|unknown)",
  "analysisType": "enum (full|spreading|wip)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "metadata": {
    "documentId": "doc_1704067200000_abc123def",
    "documentName": "financials_2024.txt",
    "documentType": "balance-sheet",
    "analysisType": "full",
    "analysisDate": "2024-01-01T12:00:00Z",
    "parseQuality": { "confidence": 0.75 }
  },
  "parsed": {
    "normalized": {
      "documentType": "balance-sheet",
      "otherMetrics": {
        "totalRevenue": 500000,
        "totalExpenses": 400000,
        "netIncome": 100000,
        "totalAssets": 250000,
        "totalLiabilities": 125000,
        "netWorth": 125000
      }
    },
    "raw": "original document content..."
  },
  "spreadingAnalysis": {
    "original": { "revenue": 500000, "netIncome": 100000 },
    "adjustments": { ... },
    "asAllowed": { "asAllowedNetIncome": 120000, ... }
  },
  "wipAnalysis": {
    "wipSummary": { "activeContracts": 12, ... },
    "bondExposure": { "totalBondValue": 125000, ... },
    "contractAnalysis": [ ... ]
  },
  "underwritingSummary": {
    "overallRiskLevel": "moderate",
    "keyMetrics": { ... },
    "warnings": [ ... ],
    "recommendations": [ ... ]
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": "string (user-friendly error message)",
  "details": "string (optional technical details)"
}
```

## Data Model

### Surety Applications
Represents a submitted application for surety bond underwriting.

```javascript
{
  id: uuid,
  document_id: varchar(255),        // Unique per upload
  applicant_name: varchar(255),     // Borrower/contractor
  business_type: varchar(100),      // Construction, Manufacturing, etc.
  industry: varchar(100),           // NAICS code or industry
  status: varchar(50),              // new, in_review, approved, rejected
  analysis_type: varchar(50),       // full, spreading, wip
  overall_risk_level: varchar(50),  // critical, high, moderate, low
  
  // Denormalized key metrics for fast queries
  as_allowed_net_income: numeric,
  as_allowed_margin_percent: numeric,
  total_wip: numeric,
  active_contracts: integer,
  average_gross_margin: numeric,
  total_bond_value: numeric,
  bonds_at_risk_percent: numeric,
  
  // Full analysis JSON
  analysis_result: jsonb,
  
  // Metadata
  created_at: timestamptz,
  updated_at: timestamptz,
  created_by: varchar(255),
  notes: text
}
```

### Risk Factors
Detailed risk assessment from analysis.

```javascript
{
  id: uuid,
  application_id: uuid,
  analysis_id: uuid,
  
  source: varchar(50),             // spreading, wip, manual
  code: varchar(100),              // NEGATIVE_MARGIN, HIGH_CONCENTRATION
  severity: varchar(50),           // critical, high, medium, low
  message: text,                   // Human-readable description
  
  affected_contracts: jsonb,       // Contract IDs if applicable
  related_metric: varchar(100),    // as_allowed_net_income, etc.
  
  is_resolved: boolean,
  reviewed_by: varchar(255),
  review_notes: text,
  
  created_at: timestamptz,
  reviewed_at: timestamptz
}
```

## Security & Multi-Tenancy

### Row-Level Security (RLS)
Supabase RLS policies currently in schema allow:
- All users can view applications (USING true)
- All users can create applications (WITH CHECK true)
- All users can update applications (USING true, WITH CHECK true)

**Production requirements:**
- Implement user authentication via Supabase Auth
- Update RLS policies to filter by `auth.uid()`
- Restrict access to own applications

### API Security
- Public anon key used for frontend (safe - limited to RLS)
- Service role key (in backend only) for admin operations
- No sensitive data in URLs (use POST with body)
- CORS configured per Vercel defaults

## Deployment

### Vercel Deployment Pipeline
```
git push origin main
    ↓
Vercel detects changes
    ↓
Build:
  ├─ npm install
  ├─ npm run build (Vite builds frontend → dist/)
  └─ Serverless functions compiled
    ↓
Deploy:
  ├─ Frontend: Uploaded to CDN
  ├─ API functions: Provisioned in us-east-1
  └─ Environment variables loaded from Vercel dashboard
    ↓
Live at: https://clearpath.vercel.app
```

### Environment Variables
Required variables in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Future Enhancements

### Phase 2: Auth & Multi-User
- Implement Supabase Auth (email/password or SSO)
- Update RLS policies for multi-tenancy
- Add user roles (underwriter, admin, viewer)

### Phase 3: Advanced Parsing
- Integrate OCR service (AWS Textract, Google Vision)
- Support PDF, image documents
- Extract tabular data automatically

### Phase 4: Historical Analytics
- Create admin dashboard with:
  - Application trends
  - Risk level distribution
  - Completion rates
  - Recommendation tracking

### Phase 5: Integrations
- Webhook notifications
- Email reports
- Third-party credit bureau APIs
- Document storage (AWS S3)

## Monitoring & Debugging

### Frontend Logs
```javascript
// Browser console
import { initializeSuretyDB } from './domains/surety/db/suretyDatabase';
// Check Supabase connection status in footer (green/yellow dot)
```

### Backend Logs
Vercel dashboard → Functions → Logs
- Shows serverless function execution
- Error messages and stack traces
- Cold start times

### Database Logs
Supabase dashboard → Logs
- Query performance
- Slow queries
- Connection issues

### Status Checks
- Footer shows Supabase connection status (green = connected, yellow = demo mode)
- Error messages appear in-app when API calls fail
- Console logs for debugging during development

---

**Last Updated**: 2026-04-25  
**Current Phase**: MVP (Surety domain + SBA domain)  
**Target**: Proof-of-concept for Trisura executive team
