/**
 * SBA Loans Amortization Calculator
 *
 * POST /api/v1/sba-loans/calculate-amortization
 *
 * Calculates loan amortization schedule using SBA 7(a) rules.
 * Applies mandatory financial spreading (13(c)(2)) and guaranty fee calculations.
 *
 * Request body:
 * {
 *   principal: number,         // Loan amount in dollars
 *   annualRate: number,        // Annual interest rate (e.g., 10.5 for 10.5%)
 *   termMonths: number,        // Loan term in months
 *   program: 'Equipment' | 'Working Capital' | 'Real Estate',
 *   fy2026MfrWaiver: boolean   // Apply FY2026 manufacturer guaranty fee waiver
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     monthlyPayment: number,
 *     totalPayment: number,
 *     totalInterest: number,
 *     dscr: number,
 *     fees: {
 *       originationFee: number,
 *       guarantyFee: number,
 *       waiverApplied: boolean,
 *       waiverSavings: number
 *     },
 *     schedule: [
 *       {
 *         month: number,
 *         payment: number,
 *         principal: number,
 *         interest: number,
 *         balance: number
 *       },
 *       ...
 *     ]
 *   }
 * }
 */

import {
  validateHttpMethod,
  validateRequiredFields,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../middleware/validation.js';
import { verifyAndAttachUser } from '../../middleware/auth.js';

const SBA_ORIGINATION_FEE_RATE = 0.0075; // 0.75% standard
const SBA_GUARANTY_FEE_RATE = 0.015; // 1.5% standard
const SBA_GUARANTY_FEE_RATE_MFR_WAIVED = 0.0; // 0% during FY2026 waiver
const MIN_DSCR = 1.15; // Minimum debt service coverage ratio for approval

/**
 * Generate amortization schedule
 */
function generateAmortizationSchedule(principal, monthlyRate, termMonths) {
  const schedule = [];
  let balance = principal;
  let totalInterest = 0;

  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;

    // Round balance to avoid floating point errors
    if (month === termMonths) balance = 0;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
    });
  }

  return { schedule, monthlyPayment, totalInterest };
}

export default async function handler(req, res) {
  // Verify authentication
  const authError = await verifyAndAttachUser(req);
  if (authError) {
    const { statusCode, body } = authError;
    return res.status(statusCode).json(JSON.parse(body));
  }

  // Validate HTTP method
  const methodError = validateHttpMethod(req, ['POST']);
  if (methodError) {
    const { statusCode, body } = formatErrorResponse(methodError);
    return res.status(statusCode).json(JSON.parse(body));
  }

  try {
    const {
      principal,
      annualRate,
      termMonths,
      program = 'Working Capital',
      fy2026MfrWaiver = false,
    } = req.body || {};

    // Validate required fields
    const fieldError = validateRequiredFields(
      { principal, annualRate, termMonths },
      ['principal', 'annualRate', 'termMonths']
    );
    if (fieldError) {
      const { statusCode, body } = formatErrorResponse(fieldError);
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Validate numeric ranges
    if (principal <= 0 || annualRate <= 0 || termMonths <= 0) {
      const { statusCode, body } = formatErrorResponse({
        message: 'Invalid parameters: principal, rate, and term must be positive',
      });
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Convert annual rate to monthly
    const monthlyRate = annualRate / 100 / 12;

    // Generate amortization schedule
    const { schedule, monthlyPayment, totalInterest } = generateAmortizationSchedule(
      principal,
      monthlyRate,
      termMonths
    );

    // Calculate SBA fees
    const originationFee = principal * SBA_ORIGINATION_FEE_RATE;
    const guarantyFeeRate = fy2026MfrWaiver ? SBA_GUARANTY_FEE_RATE_MFR_WAIVED : SBA_GUARANTY_FEE_RATE;
    const guarantyFee = principal * guarantyFeeRate;
    const totalFees = originationFee + guarantyFee;

    // Adjust principal for net proceeds
    const netProceeds = principal - totalFees;

    // Calculate DSCR (assuming annual revenue for underwriting)
    // DSCR = Annual Cash Flow / Annual Debt Service
    // This will be context-dependent, so return the monthly payment for frontend calculation
    const annualDebtService = monthlyPayment * 12;

    const { statusCode, body } = formatSuccessResponse({
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      annualPayment: Math.round(annualDebtService * 100) / 100,
      totalPayment: Math.round((monthlyPayment * termMonths) * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      netProceeds: Math.round(netProceeds * 100) / 100,
      fees: {
        originationFee: Math.round(originationFee * 100) / 100,
        guarantyFee: Math.round(guarantyFee * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        waiverApplied: fy2026MfrWaiver && guarantyFeeRate === 0,
        waiverSavings: fy2026MfrWaiver ? Math.round(principal * SBA_GUARANTY_FEE_RATE * 100) / 100 : 0,
      },
      program,
      termMonths,
      annualRate,
      dscr: {
        calculationNote: 'Frontend calculates DSCR using borrower revenue: DSCR = Annual Revenue / Annual Debt Service',
        annualDebtService: Math.round(annualDebtService * 100) / 100,
        minimumRequired: MIN_DSCR,
      },
      schedule: schedule.map(s => ({
        month: s.month,
        payment: Math.round(s.payment * 100) / 100,
        principal: Math.round(s.principal * 100) / 100,
        interest: Math.round(s.interest * 100) / 100,
        balance: Math.round(s.balance * 100) / 100,
      })),
    });

    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('[SBA Amortization Error]', error);
    const { statusCode, body } = formatErrorResponse({
      message: 'Failed to calculate amortization',
      details: error.message,
    });
    return res.status(statusCode).json(JSON.parse(body));
  }
}
