/**
 * Surety Bond Application Processing API
 * POST /api/v1/surety/process-application
 *
 * Orchestrates the full pipeline:
 * 1. Parse document (shared core engine)
 * 2. Extract financial data
 * 3. Run spreading analysis
 * 4. Run WIP analysis
 * 5. Generate underwriting summary
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentContent, documentName, documentType, analysisType = 'full' } = req.body;

    if (!documentContent) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    // Step 1: Parse document using shared core engine
    const parsedData = await parseDocument(documentContent, documentType);

    if (!parsedData.success) {
      return res.status(400).json({
        error: 'Failed to parse document',
        details: parsedData.error
      });
    }

    // Step 2: Run analyses based on analysisType
    const analyses = {};

    if (analysisType === 'full' || analysisType === 'spreading') {
      analyses.spreadingAnalysis = runSpreadingAnalysis(parsedData.normalized);
    }

    if (analysisType === 'full' || analysisType === 'wip') {
      analyses.wipAnalysis = runWIPAnalysis(parsedData.normalized);
    }

    // Step 3: Generate underwriting summary
    const underwritingSummary = generateUnderwritingSummary(
      parsedData.normalized,
      analyses,
      analysisType
    );

    return res.status(200).json({
      success: true,
      metadata: {
        documentId: generateId(),
        documentName,
        documentType,
        analysisType,
        analysisDate: new Date().toISOString(),
        parseQuality: parsedData.confidence,
      },
      parsed: {
        normalized: parsedData.normalized,
        raw: parsedData.raw,
      },
      spreadingAnalysis: analyses.spreadingAnalysis,
      wipAnalysis: analyses.wipAnalysis,
      underwritingSummary,
    });
  } catch (error) {
    console.error('Process application error:', error);
    return res.status(500).json({
      error: 'An error occurred during processing',
      details: error.message
    });
  }
}

/**
 * Parse document content and extract financial data
 * This is the shared core engine used by both SBA and Surety domains
 */
async function parseDocument(content, documentType) {
  try {
    // TODO: Integrate with actual OCR/document parsing service
    // For MVP, perform basic text parsing

    const lines = content.split('\n').filter(line => line.trim());
    const normalized = {
      documentType,
      extractedAt: new Date().toISOString(),
      revenues: [],
      expenses: [],
      assets: [],
      liabilities: [],
      otherMetrics: {},
    };

    // Basic pattern matching for common financial metrics
    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Revenue detection
      if (lowerLine.includes('revenue') || lowerLine.includes('sales')) {
        const number = extractNumber(line);
        if (number) normalized.revenues.push({ description: line.split(/[\d\.\$]/)[0], amount: number });
      }

      // Cost detection
      if (lowerLine.includes('cost') || lowerLine.includes('expense')) {
        const number = extractNumber(line);
        if (number) normalized.expenses.push({ description: line.split(/[\d\.\$]/)[0], amount: number });
      }

      // Asset detection
      if (lowerLine.includes('asset') || lowerLine.includes('cash') || lowerLine.includes('inventory')) {
        const number = extractNumber(line);
        if (number) normalized.assets.push({ description: line.split(/[\d\.\$]/)[0], amount: number });
      }

      // Liability detection
      if (lowerLine.includes('liability') || lowerLine.includes('debt') || lowerLine.includes('loan')) {
        const number = extractNumber(line);
        if (number) normalized.liabilities.push({ description: line.split(/[\d\.\$]/)[0], amount: number });
      }
    }

    // Calculate totals
    const totalRevenue = normalized.revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = normalized.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = normalized.assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = normalized.liabilities.reduce((sum, item) => sum + item.amount, 0);

    normalized.otherMetrics = {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };

    return {
      success: true,
      confidence: 0.75,
      normalized,
      raw: content,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run spreading analysis (As-Allowed adjustments for SBA compliance)
 */
function runSpreadingAnalysis(normalized) {
  const { otherMetrics } = normalized;

  return {
    original: {
      revenue: otherMetrics.totalRevenue || 0,
      netIncome: otherMetrics.netIncome || 0,
    },
    adjustments: {
      ownerCompensation: {
        rule: 'Owner Compensation Adjustment',
        amount: otherMetrics.totalRevenue * 0.05,
        addBack: true,
      },
      depreciation: {
        rule: 'Depreciation Add-Back',
        amount: otherMetrics.totalExpenses * 0.03,
        addBack: true,
      },
      interestExpense: {
        rule: 'Interest Expense Remove',
        amount: otherMetrics.totalExpenses * 0.02,
        addBack: false,
      },
    },
    asAllowed: {
      asAllowedNetIncome: (otherMetrics.netIncome || 0) +
        (otherMetrics.totalRevenue * 0.05) +
        (otherMetrics.totalExpenses * 0.03) -
        (otherMetrics.totalExpenses * 0.02),
      totalAdjustments: (otherMetrics.totalRevenue * 0.05) + (otherMetrics.totalExpenses * 0.03) - (otherMetrics.totalExpenses * 0.02),
    },
  };
}

/**
 * Run Work-in-Progress & Bond exposure analysis
 */
function runWIPAnalysis(normalized) {
  const { otherMetrics } = normalized;

  // Mock WIP data - would be extracted from actual construction/contract documents
  return {
    wipSummary: {
      activeContracts: 12,
      averageGrossMargin: 12.5,
      totalWIP: otherMetrics.totalAssets * 0.15,
    },
    bondExposure: {
      totalBondValue: otherMetrics.totalRevenue * 0.25,
      bondsAtRiskPercentage: 8.5,
    },
    contractAnalysis: [
      {
        name: 'Contract A-2024',
        contractValue: otherMetrics.totalRevenue * 0.08,
        percentComplete: 65,
        grossMarginToDated: 14.2,
      },
      {
        name: 'Contract B-2024',
        contractValue: otherMetrics.totalRevenue * 0.06,
        percentComplete: 42,
        grossMarginToDated: 11.8,
      },
    ],
    error: null,
  };
}

/**
 * Generate comprehensive underwriting summary
 */
function generateUnderwritingSummary(normalized, analyses, analysisType) {
  const spreading = analyses.spreadingAnalysis || {};
  const wip = analyses.wipAnalysis || {};
  const { otherMetrics } = normalized;

  // Determine overall risk level
  let overallRiskLevel = 'low';
  const riskFactors = [];

  if (spreading.asAllowed?.asAllowedNetIncome < otherMetrics.totalRevenue * 0.05) {
    overallRiskLevel = 'critical';
    riskFactors.push({
      code: 'LOW_PROFITABILITY',
      source: 'spreading',
      severity: 'critical',
      message: 'As-Allowed Net Income is below 5% of revenue',
      contractIds: [],
    });
  } else if (spreading.asAllowed?.asAllowedNetIncome < otherMetrics.totalRevenue * 0.10) {
    overallRiskLevel = 'high';
    riskFactors.push({
      code: 'MODERATE_PROFITABILITY',
      source: 'spreading',
      severity: 'high',
      message: 'As-Allowed Net Income is 5-10% of revenue',
      contractIds: [],
    });
  }

  if (wip.bondExposure?.bondsAtRiskPercentage > 15) {
    if (overallRiskLevel === 'low') overallRiskLevel = 'high';
    riskFactors.push({
      code: 'HIGH_BOND_RISK',
      source: 'wip',
      severity: 'high',
      message: 'Bonds at risk exceed 15% of total bond value',
      contractIds: [],
    });
  }

  return {
    overallRiskLevel,
    keyMetrics: {
      asAllowedNetIncome: spreading.asAllowed?.asAllowedNetIncome || 0,
      asAllowedMarginPercent: spreading.asAllowed ? (spreading.asAllowed.asAllowedNetIncome / otherMetrics.totalRevenue * 100) : 0,
      totalWIP: wip.wipSummary?.totalWIP || 0,
      activeContracts: wip.wipSummary?.activeContracts || 0,
      averageGrossMargin: wip.wipSummary?.averageGrossMargin || 0,
      totalBondValue: wip.bondExposure?.totalBondValue || 0,
      bondsAtRiskPercent: wip.bondExposure?.bondsAtRiskPercentage || 0,
    },
    warnings: riskFactors,
    recommendations: generateRecommendations(overallRiskLevel, riskFactors),
  };
}

/**
 * Generate recommendations based on analysis results
 */
function generateRecommendations(riskLevel, riskFactors) {
  const recommendations = [];

  if (riskLevel === 'critical') {
    recommendations.push('Immediate credit review recommended. Consider declining application or requesting additional collateral.');
    recommendations.push('Require detailed business plan and market analysis to support projections.');
  } else if (riskLevel === 'high') {
    recommendations.push('Enhanced due diligence required. Request 3 years of tax returns and audited financials.');
    recommendations.push('Consider additional covenants or monitoring requirements.');
  }

  recommendations.push('Document all assumptions and forward-looking statements in underwriting memo.');
  recommendations.push('Ensure adequate personal guarantees from principals.');

  return recommendations;
}

/**
 * Extract numeric values from text
 */
function extractNumber(text) {
  const match = text.match(/[\$]?([\d,]+(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

/**
 * Generate unique document ID
 */
function generateId() {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
