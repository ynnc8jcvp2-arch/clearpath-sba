/**
 * Surety Document Upload Endpoint
 *
 * POST /api/v1/surety/upload
 *
 * Accepts a financial document, parses it using the core DocumentParserEngine,
 * and returns normalized financial data ready for surety analysis.
 *
 * Request body:
 * {
 *   document: { name, content (base64 or text), type },
 *   documentType: 'income-statement' | 'balance-sheet' | 'tax-return' | etc.,
 *   extractTables: boolean (default: true),
 *   extractText: boolean (default: true)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     documentId: string,
 *     parsed: {
 *       raw: { ... },
 *       normalized: { ... },
 *       metadata: { ... }
 *     }
 *   }
 * }
 */

import { getParserInstance } from '../../../src/core/parser-instance.js';
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
    const { document, documentType = 'unknown', extractTables = true, extractText = true } = req.body || {};

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

    // Get parser instance
    const parser = getParserInstance();

    // Prepare document object
    const documentToProcess = {
      name: document.name,
      content: document.content, // Assume content is already in appropriate format
      type: document.type || 'application/pdf',
    };

    // Parse document
    const parseResult = await parser.parse(documentToProcess, {
      documentType,
      extractTables,
      extractText,
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('Parsing warnings/errors:', parseResult.errors);
    }

    // Generate document ID for reference
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return success response
    const { statusCode, body } = formatSuccessResponse({
      documentId,
      documentName: document.name,
      documentType,
      parsed: {
        raw: parseResult.raw,
        normalized: parseResult.normalized,
        metadata: parseResult.metadata,
      },
      qualityMetrics: parseResult.quality,
    });

    return res.status(statusCode).json(JSON.parse(body));
  } catch (error) {
    console.error('Document upload error:', error);
    const { statusCode, body } = formatErrorResponse(
      {
        error: `Failed to process document: ${error.message}`,
        statusCode: 500,
      },
      500
    );
    return res.status(statusCode).json(JSON.parse(body));
  }
}
