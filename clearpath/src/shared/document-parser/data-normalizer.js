/**
 * Data Normalizer Module
 *
 * Converts raw OCR + table extraction output into a standardized schema
 * using Claude for intelligent field mapping and value extraction.
 */

export class DataNormalizer {
  /**
   * Normalize extracted data into standard format using Claude
   * @param {Object} rawData - Output from OCR + Table Extractor
   * @param {string} documentType
   * @returns {Promise<Object>} Normalized data
   */
  async normalize(rawData, documentType) {
    const financials = await this.extractFinancialData(rawData);
    const business = await this.extractBusinessData(rawData);

    return {
      documentMetadata: {
        type: documentType || rawData.documentType || 'unknown',
        extractedAt: new Date().toISOString(),
        sourceFormat: 'pdf',
        confidence: rawData.confidence || 0,
      },
      financials,
      business,
      owners: this.extractOwnershipData(rawData),
      raw: rawData,
    };
  }

  /**
   * Extract financial metrics using Claude for intelligent parsing
   */
  async extractFinancialData(rawData) {
    const baseFinancials = {
      revenue: 0, expenses: 0, netIncome: 0, grossProfit: 0, operatingIncome: 0,
      assets: { current: 0, fixed: 0, total: 0 },
      liabilities: { current: 0, longTerm: 0, total: 0 },
      equity: 0,
      operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0,
      currentRatio: 0, debtToEquity: 0, profitMargin: 0, dscr: 0,
    };

    if (!rawData.text && (!rawData.tables || rawData.tables.length === 0)) {
      return baseFinancials;
    }

    try {
      const contextText = [
        rawData.text?.slice(0, 6000) || '',
        ...(rawData.tables || []).slice(0, 3),
      ].join('\n\n');

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: `You are a financial spreading expert. Extract financial metrics from document text.
All monetary values should be in whole dollars (no cents). Use 0 for unavailable values.
Return JSON with these exact keys: revenue, expenses, netIncome, grossProfit, operatingIncome,
assets (object: current, fixed, total), liabilities (object: current, longTerm, total),
equity, operatingCashFlow, investingCashFlow, financingCashFlow,
currentRatio, debtToEquity, profitMargin, dscr`,
          prompt: `Extract financial metrics from this document:\n\n${contextText}`,
          jsonMode: true,
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        if (result && typeof result === 'object') {
          return {
            ...baseFinancials,
            ...result,
            assets: { ...baseFinancials.assets, ...(result.assets || {}) },
            liabilities: { ...baseFinancials.liabilities, ...(result.liabilities || {}) },
          };
        }
      }
    } catch (err) {
      console.error('Financial data extraction failed:', err);
    }

    return baseFinancials;
  }

  /**
   * Extract business information from raw data
   */
  async extractBusinessData(rawData) {
    const base = {
      name: null, industry: null, yearsFounded: null,
      numberOfEmployees: null, businessType: null,
      principalAddress: null, taxId: null, description: null,
    };

    if (!rawData.text) return base;

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: `Extract business information from a financial document. Return JSON with:
name, industry, yearsFounded (number or null), numberOfEmployees (number or null),
businessType (sole-proprietor/llc/corporation/partnership/other), principalAddress, taxId (EIN), description.
Use null for any field not found.`,
          prompt: `Extract business info from:\n\n${rawData.text?.slice(0, 3000)}`,
          jsonMode: true,
        }),
      });

      if (response.ok) {
        const { result } = await response.json();
        if (result) return { ...base, ...result };
      }
    } catch (err) {
      console.error('Business data extraction failed:', err);
    }

    return base;
  }

  /**
   * Extract ownership data (synchronous — no AI needed for basic structure)
   */
  extractOwnershipData(rawData) {
    return {
      principals: [{ name: null, title: null, ownership: 0, personalCreditScore: null, netWorth: null }],
      guarantors: [],
    };
  }

  /**
   * Validate normalized data
   */
  validate(normalized) {
    const errors = [];
    if (!normalized.financials) errors.push('Missing financials section');
    if (!normalized.business) errors.push('Missing business section');
    if (normalized.financials?.revenue === 0) errors.push('Revenue is zero — check extraction');
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Transform normalized data for a specific domain
   */
  transformForDomain(normalized, domainName) {
    const base = {
      documentMetadata: normalized.documentMetadata,
      financials: normalized.financials,
      business: normalized.business,
      owners: normalized.owners,
    };

    if (domainName === 'surety') {
      base.suretyContext = {
        underwritingDate: new Date().toISOString(),
        spreaderRequired: true,
        wipAnalysisRequired: true,
      };
    }

    if (domainName === 'sba') {
      base.sbaContext = {
        loanPurpose: null,
        sbaProgram: null,
        guarantyPercentage: 0,
      };
    }

    return base;
  }
}
