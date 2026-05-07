/**
 * SBA Loan Calculator Service
 *
 * Handles all SBA 7(a) loan mathematics:
 * - Monthly payment calculation (P&I)
 * - Debt Service Coverage Ratio (DSCR) calculation
 * - Fee calculations (origination, guaranty, manufacturer waiver)
 * - Amortization schedule generation
 * - Equity injection requirements
 *
 * Used by:
 * - /api/v1/sba-loans/calculate-amortization endpoint
 * - Frontend loan parameter calculations
 */

/**
 * Calculate monthly payment (Principal & Interest only)
 * Using standard amortization formula: P = L[c(1+c)^n]/[(1+c)^n-1]
 * where P = monthly payment, L = loan amount, c = monthly rate, n = number of payments
 */
function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;

  if (monthlyRate === 0) {
    // Special case: 0% interest
    return principal / numberOfPayments;
  }

  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
  return principal * (numerator / denominator);
}

/**
 * Generate full amortization schedule
 * Returns array of {month, payment, principal, interest, balance}
 */
function generateAmortizationSchedule(principal, annualRate, years, startDate = new Date()) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);

  const schedule = [];
  let balance = principal;
  let date = new Date(startDate);

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    // Avoid floating point errors on final payment
    if (month === numberOfPayments) {
      balance = 0;
    }

    schedule.push({
      month,
      date: new Date(date).toISOString().split('T')[0],
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });

    // Move to next month
    date.setMonth(date.getMonth() + 1);
  }

  return schedule;
}

/**
 * Calculate DSCR (Debt Service Coverage Ratio)
 * DSCR = Net Operating Income / Total Debt Service
 * Minimum acceptable DSCR for SBA 7(a): 1.15x to 1.25x depending on borrower strength
 */
function calculateDSCR(netOperatingIncome, annualDebtService) {
  if (annualDebtService === 0) return 0;
  return netOperatingIncome / annualDebtService;
}

/**
 * Calculate SBA fees
 * Standard SBA 7(a) fees:
 * - Origination fee: 0.75% of guaranteed amount
 * - Guaranty fee: 1.5% of guaranteed amount (standard)
 *
 * FY 2026 Manufacturer Fee Waiver:
 * - Applies to NAICS codes 31-33 (Manufacturing)
 * - Waives the guaranty fee entirely
 */
function calculateSBAFees(loanAmount, isManufacturer = false) {
  const originationFeeRate = 0.0075; // 0.75%
  const guarantyFeeRate = isManufacturer ? 0 : 0.015; // 1.5%, waived for manufacturers

  const originationFee = loanAmount * originationFeeRate;
  const guarantyFee = loanAmount * guarantyFeeRate;
  const totalFees = originationFee + guarantyFee;

  const netProceeds = loanAmount - totalFees;

  return {
    originationFee: Math.round(originationFee * 100) / 100,
    originationFeePercent: originationFeeRate * 100,
    guarantyFee: Math.round(guarantyFee * 100) / 100,
    guarantyFeePercent: guarantyFeeRate * 100,
    totalFees: Math.round(totalFees * 100) / 100,
    netProceeds: Math.round(netProceeds * 100) / 100,
    isManufacturerWaiverApplied: isManufacturer,
  };
}

/**
 * Validate loan affordability based on DSCR
 * Returns validation result with minimum DSCR requirement
 */
function validateLoanAffordability(dscr, minimumDSCR = 1.25) {
  return {
    isAffordable: dscr >= minimumDSCR,
    dscr: Math.round(dscr * 100) / 100,
    minimumRequired: minimumDSCR,
    shortfall: Math.max(0, Math.round((minimumDSCR - dscr) * 100) / 100),
    status: dscr > minimumDSCR ? 'PASS' : dscr >= 1.15 ? 'CONDITIONAL' : 'FAIL',
  };
}

/**
 * Calculate required equity injection
 * SBA 7(a) typically requires 10% equity from borrower
 */
function calculateEquityRequirement(totalProjectCost, equityPercent = 0.1) {
  const equityRequired = totalProjectCost * equityPercent;
  const loanAmount = totalProjectCost - equityRequired;

  return {
    totalProjectCost: Math.round(totalProjectCost * 100) / 100,
    equityRequired: Math.round(equityRequired * 100) / 100,
    equityPercent: equityPercent * 100,
    maximumLoanAmount: Math.round(loanAmount * 100) / 100,
    loanPercent: (1 - equityPercent) * 100,
  };
}

/**
 * Comprehensive loan calculation
 * Input: Financial data and loan parameters
 * Output: Complete loan analysis with amortization, DSCR, fees, etc.
 */
export function calculateLoanAnalysis(params) {
  const {
    requestedAmount,
    annualRate,
    loanTermYears,
    netOperatingIncome,
    totalProjectCost,
    borrowerNAICS,
    minimumDSCR = 1.25,
    equityPercent = 0.1,
  } = params;

  // Determine if manufacturer (NAICS 31-33) for fee waiver
  const isManufacturer = borrowerNAICS && (
    borrowerNAICS.toString().match(/^3[1-3]/)
  );

  // Calculate fees
  const fees = calculateSBAFees(requestedAmount, isManufacturer);

  // Generate amortization schedule
  const schedule = generateAmortizationSchedule(
    requestedAmount,
    annualRate,
    loanTermYears
  );

  // Calculate monthly and annual debt service
  const monthlyDebtService = calculateMonthlyPayment(
    requestedAmount,
    annualRate,
    loanTermYears
  );
  const annualDebtService = monthlyDebtService * 12;

  // Calculate total interest
  const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

  // Calculate DSCR (pass annual values: annual NOI / annual debt service)
  const dscr = calculateDSCR(netOperatingIncome, annualDebtService);
  const dscrValidation = validateLoanAffordability(dscr, minimumDSCR);

  // Calculate equity requirement
  const equityAnalysis = calculateEquityRequirement(totalProjectCost, equityPercent);

  return {
    loanParameters: {
      requestedAmount: Math.round(requestedAmount * 100) / 100,
      annualRate: Math.round(annualRate * 100) / 100,
      loanTermYears,
      netProceeds: fees.netProceeds,
    },

    monthlyPayment: {
      amount: Math.round(monthlyDebtService * 100) / 100,
      principal: Math.round((monthlyDebtService - (requestedAmount * (annualRate / 100) / 12)) * 100) / 100,
      interest: Math.round((requestedAmount * (annualRate / 100) / 12) * 100) / 100,
    },

    annualDebtService: Math.round(annualDebtService * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round((monthlyDebtService * loanTermYears * 12) * 100) / 100,

    fees,

    dscr: dscrValidation,

    equityAnalysis,

    affordability: {
      isAffordable: dscrValidation.isAffordable,
      assessment: dscrValidation.status === 'PASS'
        ? 'Loan is affordable based on DSCR'
        : dscrValidation.status === 'CONDITIONAL'
        ? 'Loan may require additional equity or rate adjustment'
        : 'Loan does not meet DSCR requirements',
    },

    amortizationSchedule: schedule,

    summary: {
      borrowerName: params.borrowerName || 'TBD',
      businessPurpose: params.businessPurpose || 'Working capital / Equipment / Real estate',
      loanProgram: 'SBA 7(a)',
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Export all calculation functions for use in different contexts
 */
export {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateDSCR,
  calculateSBAFees,
  validateLoanAffordability,
  calculateEquityRequirement,
};

export default {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateDSCR,
  calculateSBAFees,
  validateLoanAffordability,
  calculateEquityRequirement,
  calculateLoanAnalysis,
};
