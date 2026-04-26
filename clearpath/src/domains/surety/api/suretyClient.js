/**
 * Surety API Client
 * Handles all communication with surety backend endpoints
 */

const API_BASE = '/api/v1/surety';

export class SuretyClient {
  /**
   * Process complete surety bond application
   * Recommended endpoint - single request for full analysis
   */
  static async processApplication(document, options = {}) {
    const {
      documentType = 'balance-sheet',
      analysisType = 'full',
      wipDetails = {},
      spreadingOptions = {},
    } = options;

    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document,
        documentType,
        analysisType,
        wipDetails,
        spreadingOptions,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Processing failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Upload and parse document only
   */
  static async uploadDocument(document, documentType = 'balance-sheet') {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document,
        documentType,
        extractTables: true,
        extractText: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Run analysis on pre-parsed data
   */
  static async analyzeData(normalizedData, options = {}) {
    const {
      analysisType = 'full',
      wipDetails = {},
      spreadingOptions = {},
    } = options;

    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        normalizedData,
        analysisType,
        wipDetails,
        spreadingOptions,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Run spreading calculations only
   */
  static async calculateSpreading(normalizedData, underwriter = 'System') {
    const response = await fetch(`${API_BASE}/spreading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        normalizedData,
        underwriter,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Spreading calculation failed');
    }

    const result = await response.json();
    return result.data;
  }
}
