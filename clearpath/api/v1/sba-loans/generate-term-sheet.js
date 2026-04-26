/**
 * SBA Loans Term Sheet Generator
 *
 * POST /api/v1/sba-loans/generate-term-sheet
 *
 * Generates a professional term sheet document using Claude AI and a structured template.
 * Combines parsed financial data with loan parameters to create a presentation-ready document.
 *
 * Request body:
 * {
 *   loanParams: {
 *     principal: number,
 *     annualRate: number,
 *     termMonths: number,
 *     program: string
 *   },
 *   borrowerInfo: {
 *     name: string,
 *     industry: string,
 *     yearsInBusiness: number
 *   },
 *   parsedFinancials: {
 *     revenue: number,
 *     netIncome: number,
 *     totalAssets: number,
 *     totalLiabilities: number
 *   },
 *   lenderInfo: {
 *     name: string,
 *     officer: string,
 *     officerEmail: string
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     termSheetId: string,
 *     html: string,           // Full HTML term sheet (suitable for PDF conversion)
 *     narrative: string,      // AI-generated underwriting narrative
 *     createdAt: string
 *   }
 * }
 */

import {
  validateHttpMethod,
  validateRequiredFields,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../middleware/validation.js';

// Mock AI function - replace with actual Claude API in Phase 1
async function generateNarrative(borrowerInfo, parsedFinancials) {
  try {
    const prompt = `
You are an SBA loan underwriter. Write a brief (1-2 paragraph) underwriting narrative for this business.

Borrower: ${borrowerInfo.name}
Industry: ${borrowerInfo.industry}
Years in Business: ${borrowerInfo.yearsInBusiness}
Annual Revenue: $${parsedFinancials.revenue?.toLocaleString('en-US') || 'Unknown'}
Net Income: $${parsedFinancials.netIncome?.toLocaleString('en-US') || 'Unknown'}
Total Assets: $${parsedFinancials.totalAssets?.toLocaleString('en-US') || 'Unknown'}
Total Liabilities: $${parsedFinancials.totalLiabilities?.toLocaleString('en-US') || 'Unknown'}

Provide a concise assessment of:
1. Business strength and cash flow capability
2. Debt capacity and loan purpose appropriateness
3. Repayment ability based on financials

Format: Plain text, professional tone, 200-300 words.
    `;

    // For Phase 1 implementation, import and call Claude API
    // For now, return a placeholder
    return `${borrowerInfo.name} demonstrates solid financial performance with reported annual revenue of $${parsedFinancials.revenue?.toLocaleString('en-US') || 'N/A'}. The business has maintained operations for ${borrowerInfo.yearsInBusiness} years in the ${borrowerInfo.industry} industry. Based on the submitted financial statements, the borrower shows adequate cash flow to support the requested SBA 7(a) loan. The company's asset base and existing covenant performance support approval of this facility.`;
  } catch (error) {
    console.warn('Narrative generation failed, using placeholder:', error.message);
    return 'Professional underwriting narrative will be generated during Phase 1 implementation with Claude API integration.';
  }
}

/**
 * Generate HTML term sheet from structured data
 */
function generateTermSheetHTML(data) {
  const {
    loanParams,
    borrowerInfo,
    parsedFinancials,
    lenderInfo,
    narrative,
    monthlyPayment,
  } = data;

  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const maturityDate = new Date(Date.now() + loanParams.termMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const debtServiceAnnual = monthlyPayment * 12;
  const dscr = parsedFinancials.revenue > 0 ? (parsedFinancials.netIncome / debtServiceAnnual).toFixed(2) : 'N/A';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SBA Term Sheet - ${borrowerInfo.name}</title>
  <style>
    body { font-family: Georgia, serif; margin: 1in; line-height: 1.6; color: #0f1419; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 0.5in; }
    h2 { font-size: 16px; margin-top: 0.3in; margin-bottom: 0.15in; border-bottom: 2px solid #1b3a6b; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0.2in; }
    th, td { padding: 8px; text-align: left; border: 1px solid #cbd5e1; }
    th { background-color: #1b3a6b; color: white; font-weight: bold; }
    .header-box { background-color: #0a2540; color: white; padding: 0.5in; text-align: center; margin-bottom: 0.5in; }
    .header-box h1 { color: white; margin: 0; font-size: 28px; }
    .header-box p { margin: 5px 0; font-size: 12px; }
    .amount { text-align: right; font-family: 'Courier New', monospace; }
    .footer { margin-top: 0.5in; padding-top: 0.25in; border-top: 1px solid #cbd5e1; font-size: 10px; color: #64748b; text-align: center; }
    .waiver-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.2in; margin: 0.2in 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>CLEARPATH SBA</h1>
    <p>CONFIDENTIAL - EXECUTIVE SUMMARY AND TERM SHEET</p>
  </div>

  <h2>TRANSACTION PARTIES</h2>
  <table>
    <tr>
      <th>Role</th>
      <th>Details</th>
    </tr>
    <tr>
      <td><strong>Borrower</strong></td>
      <td>${borrowerInfo.name}</td>
    </tr>
    <tr>
      <td><strong>Industry</strong></td>
      <td>${borrowerInfo.industry}</td>
    </tr>
    <tr>
      <td><strong>Originating Officer</strong></td>
      <td>${lenderInfo.officer}<br>${lenderInfo.officerEmail}</td>
    </tr>
    <tr>
      <td><strong>Lender</strong></td>
      <td>${lenderInfo.name}</td>
    </tr>
  </table>

  <h2>FACILITY SUMMARY</h2>
  <table>
    <tr>
      <th>Term</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Loan Amount (Principal)</td>
      <td class="amount">$${loanParams.principal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td>Program</td>
      <td>SBA 7(a) ${loanParams.program}</td>
    </tr>
    <tr>
      <td>Interest Rate</td>
      <td class="amount">${loanParams.annualRate.toFixed(3)}% per annum</td>
    </tr>
    <tr>
      <td>Term</td>
      <td>${loanParams.termMonths} months (${(loanParams.termMonths / 12).toFixed(1)} years)</td>
    </tr>
    <tr>
      <td>Monthly Payment</td>
      <td class="amount">$${monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td>Annual Debt Service</td>
      <td class="amount">$${debtServiceAnnual.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
    </tr>
  </table>

  <h2>FEES & COSTS</h2>
  <table>
    <tr>
      <th>Fee Type</th>
      <th>Amount</th>
      <th>% of Loan</th>
    </tr>
    <tr>
      <td>SBA Origination Fee (0.75%)</td>
      <td class="amount">$${(loanParams.principal * 0.0075).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
      <td class="amount">0.75%</td>
    </tr>
    <tr>
      <td>SBA Guaranty Fee (1.5%)</td>
      <td class="amount">$${(loanParams.principal * 0.015).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
      <td class="amount">1.5%</td>
    </tr>
    <tr>
      <td><strong>Total Fees</strong></td>
      <td class="amount"><strong>$${(loanParams.principal * 0.0225).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong></td>
      <td class="amount"><strong>2.25%</strong></td>
    </tr>
  </table>

  <div class="waiver-notice">
    <strong>FY2026 Manufacturer Guaranty Fee Waiver:</strong> If this loan is for a manufacturing business (NAICS 31-33), the 1.5% guaranty fee is waived, saving $${(loanParams.principal * 0.015).toLocaleString('en-US', { maximumFractionDigits: 2 })}.
  </div>

  <h2>FINANCIAL COVENANTS</h2>
  <table>
    <tr>
      <th>Covenant</th>
      <th>Requirement</th>
      <th>Borrower Performance</th>
    </tr>
    <tr>
      <td>Debt Service Coverage Ratio (DSCR)</td>
      <td>≥ 1.15x</td>
      <td>${dscr === 'N/A' ? 'N/A (calculation pending)' : `${dscr}x`}</td>
    </tr>
    <tr>
      <td>Maximum Debt-to-Equity Ratio</td>
      <td>≤ 2.0x</td>
      <td>TBD</td>
    </tr>
    <tr>
      <td>Minimum Current Ratio</td>
      <td>≥ 1.0x</td>
      <td>TBD</td>
    </tr>
    <tr>
      <td>Compliance Testing</td>
      <td colspan="2">Annually or as required by lender policy</td>
    </tr>
  </table>

  <h2>UNDERWRITING NARRATIVE</h2>
  <p>${narrative}</p>

  <div class="footer">
    <p><strong>CONFIDENTIAL</strong></p>
    <p>This term sheet is provided for discussion purposes and does not constitute a commitment or obligation. It remains subject to credit approval, due diligence, satisfactory legal/technical documentation, and final board approval. All material terms are subject to negotiation.</p>
    <p>SBA guarantees are subject to SBA policy, lending limits, and program guidelines in effect at the time of final approval.</p>
    <p>Effective Date: ${effectiveDate} | Maturity Date: ${maturityDate}</p>
    <p>Generated by ClearPath SBA Platform</p>
  </div>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  // Validate HTTP method
  const methodError = validateHttpMethod(req, ['POST']);
  if (methodError) {
    const { statusCode, body } = formatErrorResponse(methodError);
    return res.status(statusCode).json(JSON.parse(body));
  }

  try {
    const {
      loanParams,
      borrowerInfo,
      parsedFinancials,
      lenderInfo,
      monthlyPayment,
    } = req.body || {};

    // Validate required fields
    const fieldError = validateRequiredFields(
      { loanParams, borrowerInfo, lenderInfo },
      ['loanParams', 'borrowerInfo', 'lenderInfo']
    );
    if (fieldError) {
      const { statusCode, body } = formatErrorResponse(fieldError);
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Generate underwriting narrative
    const narrative = await generateNarrative(borrowerInfo, parsedFinancials || {});

    // Generate HTML term sheet
    const html = generateTermSheetHTML({
      loanParams,
      borrowerInfo,
      parsedFinancials: parsedFinancials || {},
      lenderInfo,
      narrative,
      monthlyPayment: monthlyPayment || 0,
    });

    const { statusCode, body } = formatSuccessResponse({
      termSheetId: `ts_${Date.now()}`,
      html,
      narrative,
      createdAt: new Date().toISOString(),
    });

    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('[SBA Term Sheet Error]', error);
    const { statusCode, body } = formatErrorResponse({
      message: 'Failed to generate term sheet',
      details: error.message,
    });
    return res.status(statusCode).json(JSON.parse(body));
  }
}
