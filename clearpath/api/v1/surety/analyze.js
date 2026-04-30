/**
 * Surety Analysis Endpoint
 *
 * POST /api/v1/surety/analyze
 *
 * Accepts normalized financial data and runs comprehensive surety underwriting analysis.
 * Orchestrates SpreadingEngine (as-allowed adjustments) and WIPAnalyzer (construction contracts).
 *
 * Authentication: Required (OAuth via PKCE)
 * Authorization: Requires 'analysis:execute' permission in 'surety' domain
 *
 * Request body:
 * {
 *   financials: {
 *     revenue: number,
 *     grossProfit: number,
 *     expenses: number,
 *     netIncome: number,
 *     liabilities: { total: number },
 *     equity: number,
 *     assets?: number,
 *     businessAge?: number,
 *     industryType?: string
 *   },
 *   wipDetails?: { contracts: [...] },
 *   documentMetadata?: { type, fileName, uploadedAt },
 *   analysisType?: 'spreading' | 'wip' | 'full' (default: 'full'),
 *   spreadingOptions?: { underwriter: string }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     analysisId: string,
 *     timestamp: string,
 *     spreadingAnalysis: { ... },
 *     wipAnalysis: { ... },
 *     underwritingSummary: {
 *       overallRiskLevel: string,
 *       keyMetrics: { ... },
 *       recommendations: [ ... ],
 *       warnings: [ ... ]
 *     },
 *     metadata: { underwriter, completedAt, businessAge, industryType }
 *   },
 *   error?: { code, message }
 * }
 */

import { verifyAndAttachUser } from '../../../lib/middleware/auth.js';
import { requirePermission, enforceDomainIsolation } from '../../../lib/middleware/rbac.js';
import { validateRequestBody, FINANCIAL_SCHEMA, formatErrorResponse } from '../../../lib/middleware/sanitization.js';
import { asyncHandler } from '../../../lib/middleware/exceptions.js';
import { auditLog } from '../../../src/shared/security/auditLogger.js';
import { SpreadingEngine } from '../../../src/domains/surety/services/spreadingEngine.js';
import { WIPAnalyzer } from '../../../src/domains/surety/services/wipAnalyzer.js';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default asyncHandler(async (req, res) => {
  // ✅ 1. AUTHENTICATE: Verify user identity
  const authError = await verifyAndAttachUser(req);
  if (authError) {
    const { statusCode, body } = authError;
    return res.status(statusCode).json(JSON.parse(body));
  }

  // ✅ 2. AUTHORIZE: Check user has 'analysis:execute' permission in Surety domain
  const permError = requirePermission(req, 'analysis', 'execute', 'surety');
  if (permError) {
    const { statusCode, body } = permError;
    return res.status(statusCode).json(JSON.parse(body));
  }

  // ✅ 3. DOMAIN ISOLATION: Ensure user can only access Surety domain data
  const domainError = enforceDomainIsolation(req, 'surety');
  if (domainError) {
    const { statusCode, body } = domainError;
    return res.status(statusCode).json(JSON.parse(body));
  }

  // ✅ 4. VALIDATE INPUT: Sanitize and validate all inputs
  const valError = validateRequestBody(req, FINANCIAL_SCHEMA);
  if (valError) {
    const { statusCode, body } = valError;
    return res.status(statusCode).json(JSON.parse(body));
  }

  // Safe to use req.body now - it's been validated and sanitized
  const {
    financials,
    wipDetails = {},
    documentMetadata = {},
    analysisType = 'full',
    spreadingOptions = {},
  } = req.body || {};

  // Issue #8: Type validation - ensure all numeric fields are actually numbers
  const numericFields = ['revenue', 'grossProfit', 'expenses', 'netIncome', 'equity', 'assets', 'businessAge'];
  for (const field of numericFields) {
    if (financials[field] !== undefined && typeof financials[field] !== 'number') {
      const { statusCode, body } = formatErrorResponse({
        message: `Field "${field}" must be a number, got ${typeof financials[field]}`,
      });
      return res.status(statusCode).json(body);
    }
  }

  if (financials.liabilities && typeof financials.liabilities.total !== 'number') {
    const { statusCode, body } = formatErrorResponse({
      message: 'Field "liabilities.total" must be a number',
    });
    return res.status(statusCode).json(body);
  }

  // Issue #5: Use UUID for guaranteed uniqueness
  const analysisId = `analysis_${randomUUID()}`;
  const timestamp = new Date().toISOString();

  // ✅ 5. PREPARE NORMALIZED DATA STRUCTURE
  const normalizedData = {
    financials: {
      revenue: financials.revenue || 0,
      grossProfit: financials.grossProfit || 0,
      expenses: financials.expenses || 0,
      netIncome: financials.netIncome || 0,
      liabilities: financials.liabilities || { total: 0 },
      equity: financials.equity || 0,
      assets: financials.assets || 0,
      businessAge: financials.businessAge || 1,
      industryType: financials.industryType || 'General'
    },
    documentMetadata: documentMetadata || {
      type: 'financial-statement',
      uploadedAt: timestamp
    }
  };

  // ✅ 6. RUN SPREADING ENGINE ANALYSIS
  let spreadingAnalysis = null;
  if (['spreading', 'full'].includes(analysisType)) {
    try {
      const spreadingEngine = new SpreadingEngine();
      spreadingAnalysis = await spreadingEngine.generateSpread(
        normalizedData,
        { underwriter: spreadingOptions.underwriter || 'System' }
      );
    } catch (error) {
      console.error('Spreading analysis error:', error);
      // Issue #7: Return 500 for critical analysis failures
      const { statusCode, body } = formatErrorResponse({
        message: `Spreading analysis failed: ${error.message}`,
        code: 'SPREADING_ENGINE_ERROR',
      });
      return res.status(statusCode).json(body);
    }
  }

  // ✅ 7. RUN WIP ANALYZER (if requested)
  let wipAnalysis = null;
  if (['wip', 'full'].includes(analysisType)) {
    try {
      const wipAnalyzer = new WIPAnalyzer();
      wipAnalysis = await wipAnalyzer.analyzeWIP(normalizedData, wipDetails);
    } catch (error) {
      console.error('WIP analysis error:', error);
      // Issue #7: Return 500 for critical analysis failures
      const { statusCode, body } = formatErrorResponse({
        message: `WIP analysis failed: ${error.message}`,
        code: 'WIP_ANALYZER_ERROR',
      });
      return res.status(statusCode).json(body);
    }
  }

  // ✅ 8. GENERATE UNDERWRITING SUMMARY
  const underwritingSummary = generateUnderwritingSummary({
    spreadingAnalysis,
    wipAnalysis,
    financials: normalizedData.financials  // Pass financials for ratio analysis
  });

  // ✅ 9. AUDIT LOG: Record successful analysis
  await auditLog(supabaseClient, {
    userId: req.user.userId,
    sessionId: req.headers.authorization?.substring(0, 32) || 'unknown',
    action: 'SURETY_ANALYSIS_EXECUTED',
    resourceType: 'analysis',
    resourceId: analysisId,
    apiEndpoint: req.url,
    httpMethod: 'POST',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    responseStatus: 200,
    financialData: {
      revenue: financials.revenue,
      netIncome: financials.netIncome,
      businessAge: normalizedData.financials.businessAge,
      industryType: normalizedData.financials.industryType
    },
    analysisMetadata: {
      analysisType,
      riskLevel: underwritingSummary.overallRiskLevel,
      keyFindingsCount: underwritingSummary.warnings.length
    },
    severity: 'INFO'
  }).catch(e => console.error('Audit log failed:', e));

  // ✅ 10. RETURN SUCCESS RESPONSE
  return res.status(200).json({
    success: true,
    data: {
      analysisId,
      timestamp,
      spreadingAnalysis,
      wipAnalysis,
      underwritingSummary,
      metadata: {
        underwriter: spreadingOptions.underwriter || 'System',
        analysisCompletedAt: new Date().toISOString(),
        businessAge: normalizedData.financials.businessAge,
        industryType: normalizedData.financials.industryType
      }
    }
  });
});

/**
 * Generate underwriting summary by synthesizing all analyses
 * Issue #4: Improved risk assessment based on financial ratios + warnings
 */
function generateUnderwritingSummary(analysis) {
  const summary = {
    overallRiskLevel: 'unknown',
    keyMetrics: {},
    recommendations: [],
    warnings: [],
  };

  // Calculate financial health ratios (Issue #4)
  const financials = analysis.financials || {};
  const revenue = financials.revenue || 0;
  const netIncome = financials.netIncome || 0;
  const liabilities = financials.liabilities?.total || 0;
  const equity = financials.equity || 0;
  const assets = financials.assets || revenue; // Fallback estimate

  const metrics = {
    profitMargin: revenue > 0 ? (netIncome / revenue) : 0,
    debtToEquity: equity > 0 ? (liabilities / equity) : liabilities > 0 ? Infinity : 0,
    debtToAssets: assets > 0 ? (liabilities / assets) : 0,
  };

  summary.keyMetrics.financialRatios = metrics;

  // Analyze spreading results
  if (analysis.spreadingAnalysis && !analysis.spreadingAnalysis.error) {
    const spreading = analysis.spreadingAnalysis;

    if (spreading.asAllowed) {
      summary.keyMetrics.asAllowedNetIncome = spreading.asAllowed.asAllowedNetIncome;
      summary.keyMetrics.asAllowedMargin = spreading.asAllowed.asAllowedNetIncomePercentage;
    }

    if (spreading.riskFactors && spreading.riskFactors.length > 0) {
      spreading.riskFactors.forEach(factor => {
        summary.warnings.push(`[Spreading] ${factor.message} (${factor.severity})`);
      });
    }
  }

  // Analyze WIP results
  if (analysis.wipAnalysis && !analysis.wipAnalysis.error) {
    const wip = analysis.wipAnalysis;

    if (wip.wipSummary) {
      summary.keyMetrics.totalWIP = wip.wipSummary.totalWIP;
      summary.keyMetrics.activeContracts = wip.wipSummary.activeContracts;
      summary.keyMetrics.averageMargin = wip.wipSummary.averageGrossMargin;
    }

    if (wip.bondExposure) {
      summary.keyMetrics.totalBondExposure = wip.bondExposure.totalBondValue;
      summary.keyMetrics.bondsAtRiskPercentage = wip.bondExposure.bondsAtRiskPercentage;
    }

    if (wip.riskAssessment && wip.riskAssessment.length > 0) {
      wip.riskAssessment.forEach(risk => {
        summary.warnings.push(`[WIP] ${risk.message} (${risk.severity})`);
      });
    }
  }

  // Determine overall risk level - combines warnings + financial health
  // Issue #4: Risk based on multiple factors, not just warning count
  let riskScore = 0; // 0-10 scale: 0=low, 3=moderate, 7+=high

  // Financial health factors
  if (metrics.profitMargin < 0) riskScore += 3; // Negative profit is critical
  else if (metrics.profitMargin < 0.05) riskScore += 2; // Thin margins

  if (metrics.debtToEquity > 3) riskScore += 3; // High leverage
  else if (metrics.debtToEquity > 1.5) riskScore += 1; // Moderate leverage

  if (metrics.debtToAssets > 0.7) riskScore += 2; // High debt relative to assets

  // Warning severity factors
  const severityWeights = {
    critical: 4,
    high: 2,
    medium: 1,
    low: 0.5,
  };

  summary.warnings.forEach(warning => {
    // Extract severity from "[Type] message (severity)" format
    const severityMatch = warning.match(/\((\w+)\)$/);
    if (severityMatch) {
      const severity = severityMatch[1].toLowerCase();
      riskScore += severityWeights[severity] || 1;
    }
  });

  // Assign risk level based on accumulated score
  if (riskScore < 2) {
    summary.overallRiskLevel = 'low';
    summary.recommendations.push('Proceed with further underwriting review');
  } else if (riskScore < 5) {
    summary.overallRiskLevel = 'moderate';
    summary.recommendations.push('Address identified risk factors before proceeding');
  } else {
    summary.overallRiskLevel = 'high';
    summary.recommendations.push('Escalate to senior underwriter for detailed review');
  }

  return summary;
}
