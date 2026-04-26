/**
 * Surety Application Processor
 *
 * POST /api/v1/surety/process
 *
 * Complete end-to-end processor for surety bond applications.
 * Orchestrates: document upload → parsing → spreading → WIP analysis → underwriting summary
 *
 * This is the primary endpoint for Trisura commercial surety underwriting.
 *
 * Request body:
 * {
 *   document: { name, content, type },
 *   documentType: string,
 *   analysisType: 'spreading' | 'wip' | 'full' (default: 'full'),
 *   wipDetails: { contracts: [...] } (optional),
 *   spreadingOptions: { underwriter: string } (optional)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     metadata: { ... },
 *     parsed: { raw, normalized },
 *     spreadingAnalysis: { ... },
 *     wipAnalysis: { ... },
 *     underwritingSummary: {
 *       overallRiskLevel: 'critical' | 'high' | 'moderate' | 'low',
 *       keyMetrics: { ... },
 *       recommendations: [ ... ],
 *       warnings: [ ... ]
 *     }
 *   }
 * }
 */

import { router } from '../../../src/core/router.js';
import {
  validateHttpMethod,
  validateRequiredFields,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../middleware/validation.js';

export default async function handler(req, res) {
  // Validate HTTP method
  const methodError = validateHttpMethod(req, ['POST']);
  if (methodError) {
    const { statusCode, body } = formatErrorResponse(methodError);
    return res.status(statusCode).json(JSON.parse(body));
  }

  try {
    const {
      document,
      documentType = 'unknown',
      analysisType = 'full',
      wipDetails = {},
      spreadingOptions = {},
    } = req.body || {};

    // Validate required fields
    const fieldError = validateRequiredFields({ document }, ['document']);
    if (fieldError) {
      const { statusCode, body } = formatErrorResponse(fieldError);
      return res.status(statusCode).json(JSON.parse(body));
    }

    if (!document.name || !document.content) {
      const error = { error: 'Document must have name and content', statusCode: 400 };
      const { statusCode, body } = formatErrorResponse(error);
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Prepare document object
    const documentToProcess = {
      name: document.name,
      content: document.content,
      type: document.type || 'application/pdf',
    };

    // Process through router (full pipeline)
    const analysisResult = await router.analyzeSuretybondApplication(
      documentToProcess,
      {
        documentType,
        analysisType,
        wipDetails,
        spreadingOptions,
        extractTables: true,
        extractText: true,
      }
    );

    if (!analysisResult.success) {
      const error = {
        error: analysisResult.error?.message || 'Unknown error',
        statusCode: 500,
      };
      const { statusCode, body } = formatErrorResponse(error);
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Return success response
    const { statusCode, body } = formatSuccessResponse(analysisResult.data);
    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('Surety application processing error:', error);
    const { statusCode, body } = formatErrorResponse(
      {
        error: `Processing failed: ${error.message}`,
        statusCode: 500,
      },
      500
    );
    return res.status(statusCode).json(JSON.parse(body));
  }
}
