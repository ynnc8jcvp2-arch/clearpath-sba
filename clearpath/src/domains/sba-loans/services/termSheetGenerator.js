/**
 * SBA Term Sheet Generator Service
 *
 * Generates professional, structured term sheets from:
 * - Loan parameters (rate, term, amount)
 * - Financial analysis (DSCR, equity, cash flow)
 * - SBA fees and rates
 * - Borrower and lender information
 * - Underwriting narrative (AI-generated or manual)
 *
 * Output formats:
 * - Structured JSON (for database storage)
 * - HTML (for PDF/print, using TermSheetTemplate.jsx)
 *
 * Used by:
 * - /api/v1/sba-loans/generate-term-sheet endpoint
 * - Frontend TermSheetModal component
 */

import { calculateLoanAnalysis } from './loanCalculator.js';

/**
 * Generate structured term sheet from loan parameters
 * This is the main entry point for term sheet creation
 */
export function generateTermSheet(params) {
  const {
    borrowerName,
    lenderName = 'Community Bank',
    loanOfficer,
    loanOfficerEmail,

    // Loan parameters
    requestedAmount,
    annualRate,
    loanTermYears,
    program = 'SBA 7(a)',

    // Financial data
    netOperatingIncome,
    totalProjectCost,
    borrowerNAICS,
    businessDescription,

    // Covenants
    minimumDSCR = 1.25,
    maximumDebtToEquity = 2.5,
    minimumCurrentRatio = 1.0,

    // Collateral
    collateralType = 'General business assets',
    collateralValue,

    // Narrative (from AI or manual input)
    underwritingNarrative,

    // Dates
    effectiveDate = new Date(),
    term = 84, // months
  } = params;

  // Calculate loan analysis (DSCR, payments, fees, etc.)
  const analysis = calculateLoanAnalysis({
    requestedAmount,
    annualRate,
    loanTermYears,
    netOperatingIncome,
    totalProjectCost,
    borrowerNAICS,
    minimumDSCR,
  });

  // Calculate maturity date
  const maturityDate = new Date(effectiveDate);
  maturityDate.setMonth(maturityDate.getMonth() + term);

  // Build structured term sheet object
  const termSheet = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      status: 'draft',
      program,
    },

    parties: {
      borrower: {
        name: borrowerName,
        businessDescription,
        naicsCode: borrowerNAICS,
      },
      lender: {
        name: lenderName,
      },
      originatingOfficer: {
        name: loanOfficer || 'To Be Assigned',
        email: loanOfficerEmail,
      },
    },

    facility: {
      amount: Math.round(requestedAmount * 100) / 100,
      program,
      rate: {
        type: 'Prime + Spread', // Or fixed rate
        annual: Math.round(annualRate * 100) / 100,
        index: 'Prime',
        margin: Math.round((annualRate - 8.5) * 100) / 100, // Assuming current prime is ~8.5%
      },
      term: {
        years: loanTermYears,
        months: loanTermYears * 12,
        monthlyPayment: analysis.monthlyPayment.amount,
        annualPayment: analysis.annualDebtService,
      },
      maturityDate: maturityDate.toISOString().split('T')[0],
      effectiveDate: new Date(effectiveDate).toISOString().split('T')[0],
    },

    debtService: {
      monthlyPayment: analysis.monthlyPayment.amount,
      annualPayment: analysis.annualDebtService,
      dscr: {
        ratio: analysis.dscr.dscr,
        minimum: analysis.dscr.minimumRequired,
        status: analysis.dscr.status,
      },
    },

    equity: {
      required: {
        percent: analysis.equityAnalysis.equityPercent,
        amount: analysis.equityAnalysis.equityRequired,
      },
      totalProjectCost: analysis.equityAnalysis.totalProjectCost,
    },

    fees: {
      origination: {
        percent: analysis.fees.originationFeePercent,
        amount: analysis.fees.originationFee,
      },
      guaranty: {
        percent: analysis.fees.guarantyFeePercent,
        amount: analysis.fees.guarantyFee,
        waived: analysis.fees.isManufacturerWaiverApplied,
        waiverReason: analysis.fees.isManufacturerWaiverApplied
          ? 'FY2026 Manufacturer Guaranty Fee Waiver (NAICS 31-33)'
          : null,
      },
      total: analysis.fees.totalFees,
      netProceeds: analysis.fees.netProceeds,
    },

    collateral: {
      type: collateralType,
      value: collateralValue,
      requirements: [
        'First lien on business assets',
        'UCC-1 financing statement',
        'Personal guarantee from principal owners',
      ],
    },

    covenants: {
      financial: {
        minimumDSCR,
        maximumDebtToEquity,
        minimumCurrentRatio,
      },
      operational: {
        complianceRequired: true,
        insuranceRequired: true,
        financialReportingFrequency: 'Quarterly',
      },
      generalTerms: [
        `Maintain minimum DSCR of ${minimumDSCR}x`,
        `Maintain maximum debt-to-equity ratio of ${maximumDebtToEquity}x`,
        `Maintain minimum current ratio of ${minimumCurrentRatio}x`,
        'Maintain adequate business insurance',
        'Provide quarterly financial statements to lender',
        'Notify lender of material adverse changes',
      ],
    },

    narrative: {
      underwriting: underwritingNarrative || generateDefaultNarrative(params, analysis),
      useOfProceeds: params.useOfProceeds || 'Working capital, equipment, or other business purposes',
    },

    riskAssessment: {
      overallRisk: analysis.dscr.status === 'PASS' ? 'Acceptable' : 'Conditional',
      keyStrengths: identifyStrengths(analysis, params),
      keyRisks: identifyRisks(analysis, params),
      mitigatingFactors: [
        'Personal guarantee from principal',
        'UCC-1 lien on business assets',
        'SBA guaranty on 75% of loan',
      ],
    },

    compliance: {
      sbaProgram: program,
      guaranteePercent: 75,
      regulatoryRequirements: [
        'SBA lending standards compliance',
        'Community Reinvestment Act (CRA)',
        'Fair Lending compliance',
        'KYC/AML verification completed',
      ],
    },

    // For HTML rendering in TermSheetTemplate.jsx
    htmlTemplate: buildHTMLTemplate({
      borrowerName,
      lenderName,
      loanOfficer,
      facility: facility,
      fees: fees,
      dscr: analysis.dscr,
      covenants: covenants,
      narrative: narrative,
      effectiveDate: new Date(effectiveDate),
      maturityDate,
    }),
  };

  return termSheet;
}

/**
 * Identify financial strengths from analysis
 */
function identifyStrengths(analysis, params) {
  const strengths = [];

  if (analysis.dscr.dscr >= 1.5) {
    strengths.push(`Strong DSCR of ${analysis.dscr.dscr.toFixed(2)}x (exceeds ${analysis.dscr.minimumRequired}x requirement)`);
  }

  if (params.borrowerNAICS && params.borrowerNAICS.toString().match(/^3[1-3]/)) {
    strengths.push('Manufacturer status qualifies for SBA guaranty fee waiver');
  }

  if (params.totalProjectCost && params.totalProjectCost > 0) {
    strengths.push(`Adequate equity injection of ${(analysis.equityAnalysis.equityPercent).toFixed(1)}% from borrower`);
  }

  if (!strengths.length) {
    strengths.push('Meets SBA lending requirements');
  }

  return strengths;
}

/**
 * Identify potential risks from analysis
 */
function identifyRisks(analysis, params) {
  const risks = [];

  if (analysis.dscr.dscr < 1.25) {
    risks.push(`DSCR of ${analysis.dscr.dscr.toFixed(2)}x is below ideal threshold of ${analysis.dscr.minimumRequired}x`);
  }

  if (analysis.dscr.dscr < 1.15) {
    risks.push('DSCR is below minimum acceptable level - additional conditions required');
  }

  if (!risks.length) {
    risks.push('No major financial risks identified');
  }

  return risks;
}

/**
 * Generate default underwriting narrative if not provided
 */
function generateDefaultNarrative(params, analysis) {
  const {
    borrowerName,
    businessDescription,
    netOperatingIncome,
  } = params;

  return `
${borrowerName} is seeking an SBA 7(a) loan of $${Math.round(params.requestedAmount).toLocaleString()} for ${params.useOfProceeds || 'business purposes'}.

The applicant has demonstrated consistent profitability with net operating income of $${Math.round(netOperatingIncome).toLocaleString()} annually. With monthly debt service of $${analysis.monthlyPayment.amount.toLocaleString()}, the company achieves a DSCR of ${analysis.dscr.dscr.toFixed(2)}x, which ${analysis.dscr.status === 'PASS' ? 'exceeds' : 'approaches'} our lending requirements of ${analysis.dscr.minimumRequired}x.

${params.borrowerNAICS && params.borrowerNAICS.toString().match(/^3[1-3]/) ? 'As a manufacturer, the applicant qualifies for the FY2026 SBA guaranty fee waiver, reducing total fees and improving loan economics.' : ''}

The applicant is committing ${analysis.equityAnalysis.equityPercent.toFixed(1)}% equity to the project and will provide a personal guarantee securing the loan with UCC-1 interests in business assets.

We recommend approval subject to standard SBA lending conditions and completion of legal documentation.
  `.trim();
}

/**
 * Build HTML template for professional PDF/print rendering
 * This creates structured HTML that can be rendered by TermSheetTemplate.jsx
 */
function buildHTMLTemplate(data) {
  const {
    borrowerName,
    lenderName,
    loanOfficer,
    facility,
    fees,
    dscr,
    covenants,
    narrative,
    effectiveDate,
    maturityDate,
  } = data;

  // Return a JSON-serializable template string (not full HTML)
  // The actual HTML rendering happens in TermSheetTemplate.jsx
  return {
    type: 'sba-term-sheet',
    version: '1.0',
    sections: [
      { id: 'header', type: 'header', title: 'TERM SHEET' },
      { id: 'parties', type: 'section', title: 'PARTIES' },
      { id: 'facility', type: 'section', title: 'FACILITY AMOUNT & RATE' },
      { id: 'fees', type: 'section', title: 'ORIGINATION & GUARANTY FEES' },
      { id: 'equity', type: 'section', title: 'REQUIRED EQUITY INJECTION' },
      { id: 'covenants', type: 'section', title: 'FINANCIAL COVENANTS' },
      { id: 'narrative', type: 'section', title: 'UNDERWRITING NARRATIVE' },
      { id: 'disclaimer', type: 'section', title: 'LEGAL DISCLAIMER' },
    ],
    metadata: {
      effectiveDate,
      maturityDate,
    },
  };
}

/**
 * Export function for API endpoint usage
 */
export default {
  generateTermSheet,
};
