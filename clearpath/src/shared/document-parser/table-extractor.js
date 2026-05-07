/**
 * Table Extractor Module
 *
 * Extracts structured financial tables from OCR output using Claude.
 */

export class TableExtractor {
  constructor() {
    this.tablePatterns = [
      { name: 'income-statement', keywords: ['revenue', 'income', 'expenses', 'net income', 'gross profit'] },
      { name: 'balance-sheet', keywords: ['assets', 'liabilities', 'equity', 'current assets', 'total assets'] },
      { name: 'cash-flow', keywords: ['operating', 'investing', 'financing', 'cash flow', 'net change'] },
    ];
  }

  /**
   * Extract tables from OCR result using Claude
   * @param {File} file - Original file
   * @param {Object} ocrResult - Result from OCREngine
   * @returns {Promise<{tables: Array, metadata: Object}>}
   */
  async extract(file, ocrResult) {
    try {
      const rawTables = ocrResult.tables || [];

      // If OCR already extracted tables, use those; otherwise ask Claude to find them
      if (rawTables.length === 0 && ocrResult.text) {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: `You are a financial data extraction specialist. Parse financial tables from document text.
Return a JSON object with:
- tables: array of objects, each with:
  - type: "income-statement" | "balance-sheet" | "cash-flow" | "other"
  - headers: array of column header strings
  - rows: array of {label, values: []} objects representing each data row
  - period: fiscal period if identifiable (e.g. "2023", "Q3 2024")
  - confidence: 0-1 score`,
            prompt: `Extract all financial tables from this document text:\n\n${ocrResult.text.slice(0, 8000)}`,
            jsonMode: true,
          }),
        });

        if (response.ok) {
          const { result } = await response.json();
          const extracted = result || {};

          return {
            tables: (extracted.tables || []).map((table, idx) => ({
              id: `table-${idx}`,
              type: table.type || this.identifyStatementType(table),
              headers: table.headers || [],
              rows: table.rows || [],
              period: table.period || null,
              raw: JSON.stringify(table),
              confidence: table.confidence || 0.75,
            })),
            metadata: {
              tablesFound: (extracted.tables || []).length,
              extractedAt: new Date().toISOString(),
            },
          };
        }
      }

      // Use tables already extracted by OCR
      const tables = rawTables.map((raw, idx) => {
        const parsed = this.parseTable(raw);
        return {
          id: `table-${idx}`,
          type: this.identifyStatementType(parsed),
          headers: parsed.headers,
          rows: parsed.rows,
          raw,
          confidence: 0.75,
        };
      });

      return {
        tables,
        metadata: {
          tablesFound: tables.length,
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Table extraction failed:', error);
      return { tables: [], metadata: { error: error.message } };
    }
  }

  /**
   * Parse raw table text into structured format
   */
  parseTable(tableRaw) {
    if (typeof tableRaw !== 'string') return { headers: [], rows: [] };

    const lines = tableRaw.split('\n').filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };

    // First non-empty line as headers
    const headers = lines[0].split(/\s{2,}|\t/).map((h) => h.trim()).filter(Boolean);

    // Remaining lines as data rows
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
      return {
        label: cells[0] || '',
        values: cells.slice(1),
      };
    });

    return { headers, rows, metadata: { rowCount: rows.length, columnCount: headers.length } };
  }

  /**
   * Identify financial statement type from table content
   */
  identifyStatementType(table) {
    const text = JSON.stringify(table).toLowerCase();
    for (const pattern of this.tablePatterns) {
      const matchCount = pattern.keywords.filter((kw) => text.includes(kw)).length;
      if (matchCount >= 2) return pattern.name;
    }
    return 'other';
  }
}
