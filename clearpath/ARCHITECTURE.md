# ClearPath Modular Monolith Architecture

## Overview

ClearPath is structured as a **modular monolith** supporting two independent financial lending domains:

1. **SBA 7(a) Lending Module** (Mature)
2. **Commercial Surety Bond Underwriting Module** (Beta)

Both domains share a unified document parsing engine and institutional-grade UI framework while maintaining strict business logic isolation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ClearPath Platform                         │
│                   (React + Tailwind + Recharts)              │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐      ┌──────────────────────────┐
│  SBA 7(a) Module │      │  Surety Bond Module      │
│                  │      │  (Domain 2)              │
│ • Calculator     │      │                          │
│ • Screener       │      │ • Bond Dashboard         │
│ • Checklist      │      │ • Spreading Engine       │
│ • Comparator     │      │ • WIP Analyzer           │
└──────────────────┘      └──────────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
            ┌─────────────────────────┐
            │  Shared Core Services   │
            │                         │
            │ • Document Parser (OCR) │
            │ • Tabular Data Extract  │
            │ • PDF Export Utilities  │
            │ • Design Tokens         │
            │ • API Client            │
            └─────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌─────────┐
    │Vercel  │    │Supabase│    │Claude   │
    │ Pages  │    │   DB   │    │   API   │
    └────────┘    └────────┘    └─────────┘
```

---

## Components Inventory

### SBA 7(a) Module Components
- **AmortizationTerminal** - Loan modeling, amortization schedules, term sheet generation
- **EligibilityScreener** - SBA compliance qualification check
- **DocumentChecklist** - Document requirement matrices
- **ProgramComparison** - Product comparison tables
- **PremiumForm** - Institutional-grade form wrapper
- **AmortizationCharts** - Principal/interest visualization
- **TermSheetTemplate** - Professional term sheet formatting
- **GenerativeFeatures** - AI extraction and generation controls

### Surety Bond Module Components
- **SuretyDashboard** - Entry point for surety domain, document upload, module navigation
- **SpreadingEngine** - SBA 13(g)(2) financial analysis, EBITDA calculation, health scoring
- **WIPAnalyzer** - Work-in-Progress monitoring, job profitability, risk assessment

### Shared Components
- **PremiumForm** - Used by both SBA and Surety domains for professional form styling
- **AmortizationCharts** - Recharts-based visualizations (extensible for other modules)

---

## Navigation & Routing

### Route Map
```
Home (/home) → Overview page
           ├─ SBA 7(a) Module
           │  ├─ Amortization Terminal (/calculator)
           │  ├─ Eligibility Screener (/screener)
           │  ├─ Document Checklist (/checklist)
           │  └─ Program Comparison (/compare)
           │
           └─ Surety Bond Module (/surety)
              ├─ Bond Dashboard
              ├─ Spreading Engine (/spreading)
              └─ WIP Analyzer (/wip)
```

### Page State Management
```javascript
const [page, setPage] = useState('home');

// Routes for both domains in main content area
{page === 'surety'     && <SuretyDashboard />}
{page === 'spreading'  && <SpreadingEngine />}
{page === 'wip'        && <WIPAnalyzer />}
```

---

## Shared Core Services

### Document Parser
Located in shared utils, used by both SBA and Surety modules:
- OCR-based text extraction from PDFs
- Tabular data extraction from Excel/Word
- Financial statement parsing
- Returns structured data JSON

### PDF Export Utilities
```javascript
export { exportTermSheetPDF, exportTermSheetHTML, printTermSheet }
```

### Design System
Institutional-grade design tokens for consistency:
- Navy primary (#1B3A6B), Deep Navy (#0A2540)
- Slate accent palette (100-900)
- Tailwind-based styling
- Professional button and form components
- Accessibility compliance (WCAG AA)

---

## Data Model Separation

### SBA Domain Data
- Loan Parameters: Amount, term, rate, program type
- Borrower Eligibility: FICO score, business age, credit history
- Compliance Flags: SBA restrictions, collateral requirements
- Financial Output: Amortization schedule, term sheet, fee waivers

### Surety Domain Data
- Contractor Financials: Revenue, COGS, operating expenses
- Projects: WIP status, contract value, earned revenue, profitability
- Risk Metrics: Profit margin, debt ratios, contingent liabilities
- Bond Assessment: Health score, capacity recommendation, risk flags

### Shared Data
- Company/Entity identification
- Document uploads and parsing results
- User session and preferences

---

## Future API Architecture

When API layer is implemented:

**SBA Endpoints:**
```
POST   /api/v1/sba/loans
GET    /api/v1/sba/loans/:id
POST   /api/v1/sba/parse-document
POST   /api/v1/sba/calculate-amortization
POST   /api/v1/sba/generate-term-sheet
```

**Surety Endpoints:**
```
POST   /api/v1/surety/contractors
POST   /api/v1/surety/parse-financials
POST   /api/v1/surety/calculate-spreading
POST   /api/v1/surety/analyze-wip
GET    /api/v1/surety/bond-capacity/:id
```

**Shared Endpoints:**
```
POST   /api/v1/documents/parse
POST   /api/v1/documents/export-pdf
```

---

## Build & Deployment

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css     (~6KB gzip)
│   ├── index-[hash].js      (~193KB gzip - React, Recharts, PDF libs)
│   └── index-[hash].js      (~52KB gzip - CSS and utilities)
```

### Deployment
- **Platform:** Vercel
- **Build command:** `npm run build`
- **Environment:** Vite production build
- **CDN:** Vercel global edge network

---

## Accessibility & Compliance

### WCAG AA Compliance
- Minimum color contrast: 4.5:1
- Touch targets: 44x44px minimum
- Keyboard navigation: Full support via tab order
- Screen readers: Proper aria-labels on interactive elements
- Focus states: Visible focus rings throughout

### Institutional Standards
- Professional typography (Merriweather serif, Inter sans-serif)
- Consistent spacing grid
- Clear visual hierarchy
- Banking-grade form styling
- Legal disclaimers and compliance notices

---

## Performance Metrics

### Current Bundle Size
- React + dependencies: ~85KB gzip
- Recharts library: ~60KB gzip
- PDF export library: ~15KB gzip
- CSS (Tailwind): ~6KB gzip
- **Total:** ~166KB gzip (optimal for modern web)

### Optimization Opportunities
1. Code splitting for Surety module (load on demand)
2. Dynamic imports for large components
3. Memoization for chart re-renders
4. Image lazy loading (if images added)

---

## Development Workflow

### Adding a New Component
1. Create component in `/src/components/[Domain]/Component.jsx`
2. Import into `App.jsx`
3. Add route handler in main content area
4. Add navigation item if needed
5. Test styling against design tokens
6. Verify accessibility with keyboard nav

### Adding a New Domain
1. Create directory `/src/components/[NewDomain]/`
2. Create entry-point component
3. Import into `App.jsx`
4. Add route handlers
5. Add navigation item with `type: 'domain'`
6. Update Overview page with domain card
7. Ensure shared services integration

---

## Testing Checklist

- [ ] Both SBA and Surety navigation works
- [ ] Page transitions smooth without errors
- [ ] Form submissions capture data correctly
- [ ] Charts render with sample data
- [ ] PDF export works for term sheets
- [ ] Mobile navigation toggles properly
- [ ] Touch targets are 44x44px minimum
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces elements properly
- [ ] Builds without errors
- [ ] No console warnings or errors

---

## Maintenance Notes

### Regular Updates Needed
- SBA SOP regulatory changes
- Surety industry guideline updates
- Recharts and React dependency updates
- Vercel platform updates
- Security patches for dependencies

### Monitoring
- Build success rate
- Deployment error logs
- User interaction patterns
- Document parser accuracy
- API response times (when backend added)

