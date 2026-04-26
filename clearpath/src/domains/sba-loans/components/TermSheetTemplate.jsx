export default function TermSheetTemplate({ data }) {
  const {
    parties = {},
    facility = {},
    debt_service = {},
    equity = {},
    collateral = [],
    covenants = {},
    fees = {},
    narrative = '',
    effective_date = new Date().toLocaleDateString(),
    maturity_date = ''
  } = data || {};

  const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
  const pct = (n) => (n ? n.toFixed(2) : '0.00') + '%';

  return (
    <div
      id="termsheet-content"
      className="w-full bg-white text-slate-900"
      style={{
        fontFamily: "'Inter', sans-serif",
        lineHeight: '1.5',
        padding: '1in 0.75in',
        maxWidth: '8.5in',
        margin: '0 auto',
        fontSize: '11pt'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          backgroundColor: '#0A2540',
          color: 'white',
          padding: '24px',
          marginBottom: '32px',
          marginLeft: '-0.75in',
          marginRight: '-0.75in',
          marginTop: '-1in',
          paddingLeft: '0.75in',
          paddingRight: '0.75in'
        }}
      >
        <div style={{ fontSize: '10pt', fontWeight: 'bold', letterSpacing: '0.15em', marginBottom: '8px' }}>
          CLEARPATH SBA
        </div>
        <div style={{ fontSize: '20pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", marginBottom: '4px' }}>
          EXECUTIVE SUMMARY AND TERM SHEET
        </div>
        <div style={{ fontSize: '9pt', color: '#cbd5e1', marginTop: '12px' }}>
          CONFIDENTIAL - FOR AUTHORIZED USE ONLY
        </div>
      </div>

      {/* DOCUMENT INFO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '10pt' }}>
        <div>
          <div style={{ color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>EFFECTIVE DATE</div>
          <div style={{ fontWeight: '500' }}>{effective_date}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>MATURITY DATE</div>
          <div style={{ fontWeight: '500' }}>{maturity_date || 'TBD'}</div>
        </div>
      </div>

      {/* PARTIES */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
          PARTIES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ color: '#64748b', fontWeight: '600', fontSize: '10pt', marginBottom: '4px' }}>BORROWER</div>
            <div style={{ fontWeight: '500' }}>{parties.borrower || '[Borrower Name]'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontWeight: '600', fontSize: '10pt', marginBottom: '4px' }}>ORIGINATING OFFICER</div>
            <div style={{ fontWeight: '500' }}>{parties.officer || '[Officer Name]'}</div>
          </div>
        </div>
      </div>

      {/* FACILITY AMOUNT & RATE */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
          FACILITY AMOUNT & RATE
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b', width: '50%' }}>Requested Principal</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: '600' }}>{usd(facility.amount)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>SBA Program</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{facility.program || '7(a) Equipment'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Interest Rate</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', fontSize: '12pt' }}>{facility.index || 'Prime'} + {facility.margin || '2.75'}%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Annual Rate (Estimated)</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', fontSize: '12pt' }}>{facility.annual_rate || '10.50'}%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Term</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{facility.term || '10'} years ({facility.payments || '120'} payments)</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Monthly Payment</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '12pt' }}>{usd(debt_service.monthly)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FEES & GUARANTY WAIVER */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
          ORIGINATION & GUARANTY FEES
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>SBA Origination Fee</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{pct(fees.origination_pct)} ({usd(fees.origination)})</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>SBA Guaranty Fee (Standard)</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{pct(fees.guaranty_pct)} ({usd(fees.guaranty)})</td>
            </tr>
          </tbody>
        </table>

        {/* FY26 WAIVER SECTION */}
        {fees.waiver_applicable && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              padding: '12px',
              marginTop: '12px',
              fontWeight: '600',
              color: '#92400e'
            }}
          >
            *** FY2026 MANUFACTURER GUARANTY FEE WAIVER APPLICABLE ***
            <div style={{ marginTop: '6px', fontWeight: '500' }}>
              NAICS Code 31-33: Fee Waived — Savings: {usd(fees.waiver_savings)}
            </div>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginTop: '12px' }}>
          <tbody>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <td style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>Net Proceeds to Borrower</td>
              <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '12pt', borderBottom: '1px solid #cbd5e1' }}>{usd(facility.amount - fees.total_fees)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* REQUIRED EQUITY */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
          REQUIRED EQUITY INJECTION
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Equity Required</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{pct(equity.required_pct)} of project cost</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Dollar Amount</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: '600' }}>{usd(equity.required_amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* COLLATERAL */}
      {collateral.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
            COLLATERAL REQUIREMENTS
          </div>
          <ul style={{ marginLeft: '20px', fontSize: '11pt' }}>
            {collateral.map((item, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>
                {typeof item === 'object' ? JSON.stringify(item) : String(item).trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* COVENANTS */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
          FINANCIAL COVENANTS
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            {covenants.dscr_min && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Minimum DSCR</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{covenants.dscr_min}x</td>
              </tr>
            )}
            {covenants.current_ratio_min && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Minimum Current Ratio</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{covenants.current_ratio_min}x</td>
              </tr>
            )}
            {covenants.debt_ratio_max && (
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Maximum Debt-to-Equity</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{covenants.debt_ratio_max}x</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '8px 0', fontWeight: '600', color: '#64748b' }}>Compliance Testing</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '500' }}>{covenants.testing_frequency || 'Annual'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NARRATIVE */}
      {narrative && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', fontFamily: "'Merriweather', serif", color: '#1B3A6B', borderBottom: '1px solid #0A2540', paddingBottom: '8px', marginBottom: '12px' }}>
            UNDERWRITING NARRATIVE
          </div>
          <div style={{ fontSize: '11pt', lineHeight: '1.6', color: '#1e293b' }}>
            {narrative}
          </div>
        </div>
      )}

      {/* LEGAL DISCLAIMER */}
      <div
        style={{
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          padding: '12px',
          fontSize: '10pt',
          fontStyle: 'italic',
          color: '#475569',
          marginTop: '32px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontStyle: 'normal' }}>LEGAL DISCLAIMER</div>
        <p style={{ margin: '0 0 8px 0' }}>
          This term sheet is provided for discussion purposes only. It does not constitute a commitment or obligation and remains subject to credit approval, due diligence, and satisfactory legal and technical documentation. All material terms are subject to negotiation and final board approval.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          SBA guarantees are subject to SBA policy, lending limits, and program guidelines in effect at the time of final approval. FY2026 fee waivers apply only to qualified NAICS codes 31-33 (Manufacturing).
        </p>
        <p style={{ margin: 0 }}>
          CONFIDENTIAL — FOR AUTHORIZED USE ONLY
        </p>
      </div>
    </div>
  );
}
