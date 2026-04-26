# Frontend Integration Guide - Surety API

This guide explains how to integrate the new Surety API endpoints into the ClearPath frontend.

## Quick Start

### 1. Create a Surety API Client

Create `/src/domains/surety/api/suretyClient.js`:

```javascript
/**
 * Surety API Client
 * Handles all communication with surety API endpoints
 */

const API_BASE = '/api/v1/surety';

export class SuretyClient {
  /**
   * Upload and parse a document
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

    return response.json();
  }

  /**
   * Run full surety analysis pipeline
   * Recommended endpoint - single request for complete analysis
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

    return response.json();
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

    return response.json();
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

    return response.json();
  }
}
```

### 2. Create a Surety Form Component

Create `/src/domains/surety/components/SuretyApplicationForm.jsx`:

```javascript
import React, { useState } from 'react';
import { SuretyClient } from '../api/suretyClient';

export function SuretyApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocument({
          name: file.name,
          content: event.target.result,
          type: file.type,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!document) {
      setError('Please select a document');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await SuretyClient.processApplication(document, {
        documentType: 'balance-sheet',
        analysisType: 'full',
      });

      setAnalysis(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Surety Bond Application</h1>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Upload Financial Document
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !document}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Process Application'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Underwriting Summary</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Overall Risk</p>
                <p className="text-2xl font-bold mt-1">
                  {analysis.underwritingSummary.overallRiskLevel.toUpperCase()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">As-Allowed Net Income</p>
                <p className="text-2xl font-bold mt-1">
                  ${(analysis.underwritingSummary.keyMetrics.asAllowedNetIncome || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total WIP</p>
                <p className="text-2xl font-bold mt-1">
                  ${(analysis.underwritingSummary.keyMetrics.totalWIP || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1">
                {analysis.underwritingSummary.recommendations.map((rec, i) => (
                  <li key={i} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            {analysis.underwritingSummary.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-orange-600">
                  Risk Factors
                </h3>
                <ul className="space-y-2">
                  {analysis.underwritingSummary.warnings.map((warning, i) => (
                    <li
                      key={i}
                      className={`p-3 rounded ${
                        warning.severity === 'critical'
                          ? 'bg-red-50 text-red-900'
                          : warning.severity === 'high'
                          ? 'bg-orange-50 text-orange-900'
                          : 'bg-yellow-50 text-yellow-900'
                      }`}
                    >
                      <span className="font-semibold">{warning.code}</span>: {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Spreading Analysis */}
          {analysis.spreadingAnalysis && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Spreading Analysis</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Original Net Income</p>
                  <p className="text-2xl font-bold">
                    ${(analysis.spreadingAnalysis.original?.netIncome || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">As-Allowed Net Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(analysis.spreadingAnalysis.asAllowed?.asAllowedNetIncome || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total Adjustments</p>
                  <p className="text-2xl font-bold">
                    ${(analysis.spreadingAnalysis.asAllowed?.totalAdjustments || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">As-Allowed Margin %</p>
                  <p className="text-2xl font-bold">
                    {(analysis.spreadingAnalysis.asAllowed?.asAllowedNetIncomePercentage || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WIP Analysis */}
          {analysis.wipAnalysis && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">WIP & Bond Analysis</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Active Contracts</p>
                  <p className="text-2xl font-bold">
                    {analysis.wipAnalysis.wipSummary?.activeContracts || 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Avg Gross Margin</p>
                  <p className="text-2xl font-bold">
                    {(analysis.wipAnalysis.wipSummary?.averageGrossMargin || 0).toFixed(2)}%
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bonds at Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(analysis.wipAnalysis.bondExposure?.bondsAtRiskPercentage || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3. Add to App.jsx Routes

```javascript
// In your App.jsx routing section
import { SuretyApplicationForm } from './domains/surety/components/SuretyApplicationForm';

// Add route for surety
<Route path="/surety" element={<SuretyApplicationForm />} />
```

## API Usage Patterns

### Pattern 1: Full Pipeline (Recommended)

```javascript
// Single request - handles everything
const result = await SuretyClient.processApplication(document, {
  documentType: 'balance-sheet',
  analysisType: 'full',
  wipDetails: { contracts: [...] },
});

// Result includes: parsed data + spreading + WIP + summary
console.log(result.data.underwritingSummary.overallRiskLevel);
```

### Pattern 2: Step-by-Step

```javascript
// Step 1: Upload and parse
const uploadResult = await SuretyClient.uploadDocument(document);
const normalizedData = uploadResult.data.parsed.normalized;

// Step 2: Run specific analyses
const analysisResult = await SuretyClient.analyzeData(normalizedData, {
  analysisType: 'full',
  wipDetails: { contracts: [...] },
});
```

### Pattern 3: Specialized Analysis

```javascript
// Just spreading calculations
const spreading = await SuretyClient.calculateSpreading(normalizedData, 'John Doe');

// Or just WIP (would need separate endpoint if implemented)
```

## Error Handling

```javascript
try {
  const result = await SuretyClient.processApplication(document);
  // Handle success
} catch (error) {
  // error.message contains error details
  console.error('Analysis failed:', error.message);
  
  // Show user-friendly error
  setError(`Unable to process document: ${error.message}`);
}
```

## Data Structure Reference

### Underwriting Summary

```javascript
{
  overallRiskLevel: 'critical' | 'high' | 'moderate' | 'low',
  keyMetrics: {
    asAllowedNetIncome: number,
    asAllowedMarginPercent: number,
    totalWIP: number,
    activeContracts: number,
    totalBondValue: number,
    bondsAtRiskPercent: number,
    // ... more metrics
  },
  recommendations: string[],
  warnings: [
    {
      source: 'spreading' | 'wip',
      code: string,
      severity: 'critical' | 'high' | 'medium',
      message: string,
    }
  ],
}
```

### Spreading Analysis

```javascript
{
  original: {
    revenue: number,
    grossProfit: number,
    netIncome: number,
  },
  adjustments: {
    ownerCompensation: { amount, rule, addBack },
    depreciation: { amount, rule, addBack },
    // ... more adjustments
  },
  asAllowed: {
    revenue: number,
    asAllowedNetIncome: number,
    asAllowedNetIncomePercentage: number,
    totalAdjustments: number,
  },
  riskFactors: [
    { code, severity, message }
  ],
}
```

### WIP Analysis

```javascript
{
  wipSummary: {
    totalWIP: number,
    activeContracts: number,
    completedContracts: number,
    averageGrossMargin: number,
  },
  contractAnalysis: [
    {
      id, name, status, contractValue, percentComplete,
      grossMarginToDated, earnedIncome, riskFlags,
    }
  ],
  bondExposure: {
    totalBondValue: number,
    performanceBonds: number,
    paymentBonds: number,
    bondsAtRisk: number,
    bondsAtRiskPercentage: number,
  },
  riskAssessment: [
    { code, severity, message, contracts }
  ],
}
```

## Testing

### Test in Browser Console

```javascript
// Test upload
const doc = { name: 'test.pdf', content: 'sample content' };
await fetch('/api/v1/surety/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ document: doc, documentType: 'balance-sheet' })
}).then(r => r.json()).then(d => console.log(d));
```

### Test with cURL

```bash
curl -X POST http://localhost:3000/api/v1/surety/process \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "name": "test.pdf",
      "content": "test content",
      "type": "application/pdf"
    },
    "documentType": "balance-sheet"
  }'
```

## Next Steps

1. Create the SuretyClient API class
2. Build the SuretyApplicationForm component
3. Add routes to main App.jsx
4. Test with sample documents
5. Integrate with database for persistence
6. Add authentication/authorization

## Debugging

Enable detailed logging:

```javascript
// In SuretyClient methods, add:
console.log('Request:', { document, documentType, ... });
console.log('Response:', result);
```

Or use browser DevTools Network tab to inspect API requests/responses.
