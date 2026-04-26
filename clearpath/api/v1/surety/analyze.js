/**
 * Surety Analysis Endpoint
 *
 * POST /api/v1/surety/analyze
 *
 * Accepts normalized financial data and runs comprehensive surety underwriting analysis.
 * Orchestrates SpreadingEngine (as-allowed adjustments) and WIPAnalyzer (construction contracts).
 *
 * Request body:
 * {
 *   normalizedData: { ... } (from /api/v1/surety/upload),
 *   analysisType: 'spreading' | 'wip' | 'full' (default: 'full'),
 *   wipDetails: { contracts: [...] } (optional, required for 'wip' or 'full'),
 *   spreadingOptions: { underwriter: string } (optional)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     spreadingAnalysis: { ... } (if requested),
 *     wipAnalysis: { ... } (if requested),
 *     underwritingSummary: { ... }
 *   }
 * }
 */

import { SpreadingEngine } from '../../../src/domains/surety/services/spreadingEngine.js';
import { WIPAnalyzer } from '../../../src/domains/surety/services/wipAnalyzer.js';
import {
  validateHttpMethod,
  validateRequiredFields,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../middleware/validation.js';
import { verifyAndAttachUser } from '../../middleware/auth.js';

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
      normalizedData,
      analysisType = 'full',
      wipDetails = {},
      spreadingOptions = {},
    } = req.body || {};

    // Validate required fields
    const fieldError = validateRequiredFields({ normalizedData }, ['normalizedData']);
    if (fieldError) {
      const { statusCode, body } = formatErrorResponse(fieldError);
      return res.status(statusCode).json(JSON.parse(body));
    }

    const analysis = {
      metadata: {
        analysisDate: new Date().toISOString(),
        analysisType,
        documentType: normalizedData.documentMetadata?.type,
      },
    };

    // Run Spreading Engine if requested
    if (['spreading', 'full'].includes(analysisType)) {
      try {
        const spreadingEngine = new SpreadingEngine();
        analysis.spreadingAnalysis = await spreadingEngine.generateSpread(
          normalizedData,
          spreadingOptions
        );
      } catch (error) {
        console.error('Spreading analysis error:', error);
        analysis.spreadingAnalysis = {
          error: `Spreading analysis failed: ${error.message}`,
          errorType: 'SPREADING_FAILED',
        };
      }
    }

    // Run WIP Analyzer if requested
    if (['wip', 'full'].includes(analysisType)) {
      try {
        const wipAnalyzer = new WIPAnalyzer();
        analysis.wipAnalysis = await wipAnalyzer.analyzeWIP(normalizedData, wipDetails);
      } catch (error) {
        console.error('WIP analysis error:', error);
        analysis.wipAnalysis = {
          error: `WIP analysis failed: ${error.message}`,
          errorType: 'WIP_FAILED',
        };
      }
    }

    // Generate underwriting summary
    analysis.underwritingSummary = generateUnderwritingSummary(analysis);

    // Return success response
    const { statusCode, body } = formatSuccessResponse(analysis);
    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('Analysis error:', error);
    const { statusCode, body } = formatErrorResponse(
      {
        error: `Analysis failed: ${error.message}`,
        statusCode: 500,
      },
      500
    );
    return res.status(statusCode).json(JSON.parse(body));
  }
}

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
