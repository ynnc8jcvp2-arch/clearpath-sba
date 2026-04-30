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
import { validateRequestBody, FINANCIAL_SCHEMA } from '../../../lib/middleware/sanitization.js';
import { asyncHandler } from '../../../lib/middleware/exceptions.js';
import { auditLog } from '../../../src/shared/security/auditLogger.js';
import { SpreadingEngine } from '../../../src/domains/surety/services/spreadingEngine.js';
import { WIPAnalyzer } from '../../../src/domains/surety/services/wipAnalyzer.js';
import { createClient } from '@supabase/supabase-js';

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

  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      spreadingAnalysis = {
        error: `Spreading analysis failed: ${error.message}`,
        errorType: 'SPREADING_FAILED'
      };
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
      wipAnalysis = {
        error: `WIP analysis failed: ${error.message}`,
        errorType: 'WIP_FAILED'
      };
    }
  }

  // ✅ 8. GENERATE UNDERWRITING SUMMARY
  const underwritingSummary = generateUnderwritingSummary({
    spreadingAnalysis,
    wipAnalysis
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
 */
function generateUnderwritingSummary(analysis) {
  const summary = {
    overallRiskLevel: 'unknown',
    keyMetrics: {},
    recommendations: [],
    warnings: [],
  };

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

  // Determine overall risk level
  const warningCount = summary.warnings.length;
  if (warningCount === 0) {
    summary.overallRiskLevel = 'low';
    summary.recommendations.push('Proceed with further underwriting review');
  } else if (warningCount <= 2) {
    summary.overallRiskLevel = 'moderate';
    summary.recommendations.push('Address identified risk factors before proceeding');
  } else {
    summary.overallRiskLevel = 'high';
    summary.recommendations.push('Escalate to senior underwriter for review');
  }

  return summary;
}
