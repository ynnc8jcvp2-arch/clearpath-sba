/**
 * OCR Engine Module
 *
 * Extracts text from documents using Claude Vision (Anthropic).
 * Supports PDF and image files uploaded as base64.
 */

export class OCREngine {
  constructor() {
    this.confidence = 0;
  }

  /**
   * Convert a File to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract text from a document using Claude Vision
   * @param {File} file
   * @returns {Promise<{pages: Array, text: string, images: Array, confidence: number, errors: Array}>}
   */
  async extract(file) {
    try {
      if (!file) throw new Error('No file provided');

      const base64 = await this.fileToBase64(file);
      const mediaType = file.type || 'application/pdf';

      // Call Claude Vision via the AI endpoint
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: `You are a financial document OCR engine. Extract ALL text from this document verbatim.
Preserve the original structure including tables, headers, and sections.
Return a JSON object with:
- text: full extracted text as a single string
- sections: array of {heading, content} objects for each section
- tables: array of raw table strings found in the document
- documentType: detected type (e.g. "income-statement", "balance-sheet", "tax-return", "bank-statement", "business-plan", "other")
- confidence: 0-1 confidence score`,
          prompt: 'Extract all text and structure from this financial document.',
          jsonMode: true,
          image: { base64, mediaType },
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const { result } = await response.json();

      const extracted = result || {};
      const fullText = extracted.text || file.name;

      return {
        pages: [
          {
            pageNumber: 1,
            text: fullText,
            confidence: extracted.confidence || 0.85,
            sections: extracted.sections || [],
            width: 612,
            height: 792,
          },
        ],
        text: fullText,
        sections: extracted.sections || [],
        tables: extracted.tables || [],
        documentType: extracted.documentType || 'unknown',
        images: [],
        confidence: extracted.confidence || 0.85,
        errors: [],
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      // Graceful fallback — return filename as text so downstream can still try
      return {
        pages: [
          {
            pageNumber: 1,
            text: file?.name || 'Document text unavailable',
            confidence: 0,
            sections: [],
            width: 612,
            height: 792,
          },
        ],
        text: file?.name || 'Document text unavailable',
        sections: [],
        tables: [],
        documentType: 'unknown',
        images: [],
        confidence: 0,
        errors: [{ type: 'OCR_FAILED', message: error.message, pageNumber: null }],
      };
    }
  }

  /**
   * Extract text from a specific page
   */
  async extractPage(file, pageNumber) {
    const fullExtraction = await this.extract(file);
    return fullExtraction.pages.find((p) => p.pageNumber === pageNumber) || null;
  }

  /**
   * Detect document type from extracted text
   */
  async detectDocumentType(ocrResult) {
    if (ocrResult.documentType && ocrResult.documentType !== 'unknown') {
      return { type: ocrResult.documentType, confidence: ocrResult.confidence, suggestedType: null };
    }

    // Fallback: keyword-based detection
    const text = (ocrResult.text || '').toLowerCase();
    if (text.includes('revenue') && text.includes('net income')) return { type: 'income-statement', confidence: 0.8, suggestedType: null };
    if (text.includes('assets') && text.includes('liabilities')) return { type: 'balance-sheet', confidence: 0.8, suggestedType: null };
    if (text.includes('cash flow') || text.includes('operating activities')) return { type: 'cash-flow', confidence: 0.8, suggestedType: null };
    if (text.includes('form 1040') || text.includes('form 1120')) return { type: 'tax-return', confidence: 0.9, suggestedType: null };

    return { type: 'unknown', confidence: 0.5, suggestedType: null };
  }
}
