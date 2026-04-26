/**
 * Surety Spreading Calculation Endpoint
 *
 * POST /api/v1/surety/spreading
 *
 * Specialized endpoint for "as-allowed" spreading calculations.
 * Takes normalized financial data and applies surety-specific adjustment rules.
 *
 * Request body:
 * {
 *   normalizedData: { ... },
 *   underwriter: string (optional),
 *   adjustmentRules: { ... } (optional, overrides defaults)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     original: { ... },
 *     adjustments: { ... },
 *     asAllowed: { ... },
 *     riskFactors: [ ... ]
 *   }
 * }
 */

import { SpreadingEngine } from '../../../src/domains/surety/services/spreadingEngine.js';
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
    const { normalizedData, underwriter = 'System', adjustmentRules } = req.body || {};

    // Validate required fields
    const fieldError = validateRequiredFields({ normalizedData }, ['normalizedData']);
    if (fieldError) {
      const { statusCode, body } = formatErrorResponse(fieldError);
      return res.status(statusCode).json(JSON.parse(body));
    }

    // Initialize spreading engine
    const spreadingEngine = new SpreadingEngine();

    // Override adjustment rules if provided
    if (adjustmentRules) {
      Object.assign(spreadingEngine.adjustmentRules, adjustmentRules);
    }

    // Generate spread
    const spread = await spreadingEngine.generateSpread(normalizedData, { underwriter });

    // Return success response
    const { statusCode, body } = formatSuccessResponse(spread);
    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('Spreading calculation error:', error);
    const { statusCode, body } = formatErrorResponse(
      {
        error: `Spreading calculation failed: ${error.message}`,
        statusCode: 500,
      },
      500
    );
    return res.status(statusCode).json(JSON.parse(body));
  }
}
