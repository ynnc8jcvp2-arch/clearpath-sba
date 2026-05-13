import fs from 'fs';
import path from 'path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const adClient = process.env.VITE_GOOGLE_ADSENSE_CLIENT || '';
const adSlots = {
  top: process.env.VITE_ADSENSE_SLOT_LANDING_TOP || '',
  mid: process.env.VITE_ADSENSE_SLOT_LANDING_MID || '',
  bottom: process.env.VITE_ADSENSE_SLOT_LANDING_BOTTOM || '',
  sidebar: process.env.VITE_ADSENSE_SLOT_LANDING_SIDEBAR || '',
};

const siteName = 'BondSBA Terminal';
const siteOrigin = 'https://bondsba.com';
const supportEmail = 'contactbondsba@gmail.com';

const commonLinks = [
  { href: '/contractor-submission-readiness', label: 'Contractor Submission Readiness' },
  { href: '/sba-loan-requirements', label: 'SBA Loan Requirements' },
  { href: '/sba-loan-documents', label: 'SBA Loan Documents' },
  { href: '/sba-7a-calculator', label: 'SBA 7(a) Calculator' },
  { href: '/submission-ops-queue', label: 'Submission Ops Queue' },
  { href: '/surety-underwriting', label: 'Surety Underwriting' },
  { href: '/sba-504-loans', label: 'SBA 504 Loans' },
  { href: '/contractor-bonding', label: 'Contractor Bonding' },
];

const pages = [
  {
    slug: 'contractor-submission-readiness',
    title: 'Contractor Submission Readiness | BondSBA Terminal',
    description: 'Turn incomplete contractor files into cleaner SBA and surety submissions with a workflow built around missing items, WIP follow-up, and underwriter-ready handoff.',
    heading: 'Contractor Submission Readiness',
    eyebrow: 'Cleaner files before underwriting',
    intro: 'BondSBA is built for broker shops, construction-focused CPAs, and surety teams that need to tighten contractor files before a lender or underwriter spends time on them.',
    primaryCta: { href: '/surety-dashboard', label: 'Open Triage Workspace' },
    secondaryCta: { href: '/sba-eligibility-screener', label: 'Run Eligibility Screener' },
    sections: [
      ['What slows contractor submissions down', 'Missing financial statements, weak WIP support, unclear ownership details, and raw files that still need cleanup create immediate friction.'],
      ['What BondSBA does differently', 'BondSBA helps teams surface missing items, normalize the numbers, and package cleaner follow-up before underwriting review begins.'],
      ['Where SBA and surety connect', 'Many contractor files touch both financing and bonding, so the workflow is designed to support both the capital lane and the surety lane.'],
      ['Best next step', 'Queue the file, review the readiness output, and share a cleaner memo or checklist packet instead of forwarding the raw upload.'],
    ],
    faq: [
      ['What is contractor submission readiness?', 'It means the financials, WIP, and supporting file are organized enough for a real underwriting review instead of another round of cleanup questions.'],
      ['Who should use this workflow?', 'Brokers, CPAs, surety producers, and contractor-focused teams working through incomplete or messy submission files.'],
      ['What does the workflow produce?', 'It produces a readiness view, follow-up questions, missing items, and sharable output that can travel with the file.'],
    ],
  },
  {
    slug: 'sba-loan-requirements',
    title: 'SBA Loan Requirements Guide | BondSBA Terminal',
    description: 'Understand SBA loan requirements, eligibility, credit expectations, equity, and borrower readiness before you submit a deal.',
    heading: 'SBA Loan Requirements Guide',
    eyebrow: 'Eligibility & submission prep',
    intro: 'Use this page to understand what lenders and referral partners usually need to see before an SBA request is ready for real underwriting attention.',
    primaryCta: { href: '/sba-eligibility-screener', label: 'Open Eligibility Screener' },
    secondaryCta: { href: '/sba-document-checklist', label: 'Review Document Checklist' },
    sections: [
      ['What lenders look at first', 'Most SBA reviews begin with time in business, repayment capacity, ownership structure, credit profile, and whether the intended use of proceeds fits the program.'],
      ['What affects approval', 'Debt-service coverage, management depth, liquidity, collateral support, tax compliance, and any recent operational volatility can materially change how a deal is viewed.'],
      ['Common mistakes', 'Thin borrower narratives, incomplete ownership details, stale financial statements, and unclear use-of-proceeds support slow the file down and reduce confidence quickly.'],
      ['Best next step', 'Run the screener first, then gather the checklist items that explain repayment ability, borrower stability, and the structure of the request.'],
    ],
    faq: [
      ['What are the basic SBA loan requirements?', 'Most SBA requests are evaluated on borrower credit, business history, repayment ability, ownership profile, and whether the request fits current SBA program rules.'],
      ['Do SBA loans always require a down payment?', 'Not always in the same form, but equity injection, borrower support, or transaction structure often matters and should be documented clearly.'],
      ['What makes an SBA file easier to review?', 'Clear financials, complete ownership information, a realistic use of proceeds, and a short credit narrative usually improve review quality.'],
    ],
  },
  {
    slug: 'sba-loan-documents',
    title: 'SBA Loan Documents Checklist | BondSBA Terminal',
    description: 'See the SBA loan documents lenders and partners commonly need, from tax returns and interim financials to debt schedules and entity records.',
    heading: 'SBA Loan Documents Checklist',
    eyebrow: 'Submission readiness',
    intro: 'This landing page organizes the common borrower and business documents that help an SBA request move from casual inquiry to a clean, reviewable submission.',
    primaryCta: { href: '/sba-document-checklist', label: 'Open Document Checklist' },
    secondaryCta: { href: '/sba-eligibility-screener', label: 'Check Basic Eligibility' },
    sections: [
      ['Core borrower documents', 'Expect requests for tax returns, personal financial statements, debt schedules, ownership details, and explanations for any notable credit or liquidity issues.'],
      ['Core business documents', 'Lenders often need business tax returns, interim financials, formation documents, business debt schedules, and details supporting the requested loan structure.'],
      ['Use-of-proceeds support', 'Purchase contracts, payoff statements, equipment quotes, project budgets, or refinance backup help underwriters understand what the financing is actually doing.'],
      ['How to avoid delays', 'Send complete packages with matching dates, legible statements, and consistent borrower narratives so the file does not stall over preventable clean-up questions.'],
    ],
    faq: [
      ['What documents are usually required for an SBA loan?', 'Typical requests include tax returns, interim financials, ownership records, debt schedules, bank statements, and transaction-specific backup.'],
      ['Do all SBA lenders ask for the same documents?', 'The core package is similar, but each lender may ask for additional items based on credit profile, industry, or transaction complexity.'],
      ['Why do debt schedules matter so much?', 'Debt schedules help show repayment obligations, maturity risk, leverage, and how the new request fits into total borrower debt service.'],
    ],
  },
  {
    slug: 'sba-7a-calculator',
    title: 'SBA 7(a) Calculator Guide | BondSBA Terminal',
    description: 'Estimate SBA 7(a) payments, amortization, and fee impact with a calculator workflow designed for brokers, CPAs, and financing partners.',
    heading: 'SBA 7(a) Calculator Guide',
    eyebrow: 'Payment planning',
    intro: 'This page helps you frame what an SBA 7(a) calculator should estimate, what changes monthly payment most, and when to move from rough math to a structured submission.',
    primaryCta: { href: '/sba-loan-calculator', label: 'Open SBA Calculator' },
    secondaryCta: { href: '/sba-program-comparison', label: 'Compare SBA Programs' },
    sections: [
      ['What a good calculator should estimate', 'A useful SBA 7(a) calculator should estimate monthly payment, amortization, debt-service burden, and how fees and term assumptions change the result.'],
      ['What changes payment most', 'Loan amount, amortization term, interest rate, guaranty fee assumptions, and repayment structure all shift affordability quickly.'],
      ['What a calculator does not replace', 'A calculator is not underwriting. Final eligibility, structure, pricing, and lender appetite still depend on full credit review and current SBA guidance.'],
      ['How to use the output well', 'Use calculator results to frame borrower expectations, then validate the request with eligibility, documentation, and a realistic repayment story.'],
    ],
    faq: [
      ['How accurate is an SBA 7(a) calculator?', 'It is directionally useful for planning, but final payment and structure depend on lender terms, fees, and current market pricing.'],
      ['Can a calculator help with DSCR planning?', 'Yes. A payment estimate helps you understand whether projected cash flow is likely to support the requested debt service.'],
      ['Why compare rate and term scenarios?', 'Small changes in amortization or pricing can materially affect monthly payment and borrower affordability.'],
    ],
  },
  {
    slug: 'submission-ops-queue',
    title: 'Submission Ops Queue | BondSBA Terminal',
    description: 'Operate a repeat-ready submission queue for brokers, CPAs, and surety producers with practical prioritization and handoff structure.',
    heading: 'Submission Ops Queue',
    eyebrow: 'Repeat-ready operations workflow',
    intro: 'Run the same operational rhythm teams already use in spreadsheets, but with cleaner triage logic, owner accountability, and submission-readiness sequencing.',
    primaryCta: { href: '/submission-ops-queue', label: 'Open Submission Ops Queue' },
    secondaryCta: { href: '/sba-document-checklist', label: 'Open Document Checklist' },
    sections: [
      ['Why teams revisit this workflow', 'Queue management is daily work. Teams return to update missing items, follow-up dates, and ownership status as deals move toward underwriting readiness.'],
      ['How it fits existing process', 'Import your queue from Excel, prioritize follow-up by readiness risk, and export the updated handoff view without forcing a full process change.'],
      ['How executives use it', 'Leadership can monitor throughput, bottlenecks, and readiness quality trends instead of reviewing one-off anecdotal file updates.'],
      ['Best next step', 'Start with the queue, clear high-priority blockers, then move ready files into surety or SBA workflows for formal partner handoff.'],
    ],
    faq: [
      ['Is this meant to replace our spreadsheet process?', 'No. It is designed to work with existing spreadsheet operations and improve execution quality around them.'],
      ['Can multiple team roles use the same queue?', 'Yes. Coordinators, analysts, producers, CPAs, and executives can each use the same queue with different cadence and ownership focus.'],
      ['What makes this practical in day-to-day work?', 'It keeps intake and follow-up simple while adding enough prioritization logic to reduce repeated manual triage decisions.'],
    ],
  },
  {
    slug: 'surety-underwriting',
    title: 'Surety Underwriting Guide | BondSBA Terminal',
    description: 'Understand how surety underwriting reviews contractor financial strength, WIP schedules, backlog quality, and submission readiness.',
    heading: 'Surety Underwriting Guide',
    eyebrow: 'Contractor bond workflow',
    intro: 'Bond submissions move faster when the underwriter gets a clean picture of contractor financial strength, current workload, bank support, and the nature of the bonded opportunity.',
    primaryCta: { href: '/surety-dashboard', label: 'Open Surety Dashboard' },
    secondaryCta: { href: '/wip-schedule-analyzer', label: 'Analyze a WIP Schedule' },
    sections: [
      ['What underwriters review first', 'Most surety reviews start with the contractor financial profile, organizational structure, backlog mix, banking support, and history of completing similar work.'],
      ['Why WIP matters', 'The WIP schedule is one of the fastest ways to spot profit fade, project concentration, overbillings, underbillings, and execution risk.'],
      ['What strengthens a submission', 'Audited or reviewed financials, a current WIP, clear bond request details, strong continuity, and a concise explanation of the opportunity improve usability.'],
      ['Where to start', 'Use the dashboard and analyzers to structure the file before you ask a surety market to react to an incomplete package.'],
    ],
    faq: [
      ['What is surety underwriting looking for?', 'Surety underwriting is usually measuring contractor financial strength, character, capacity, continuity, and the ability to complete the bonded obligation.'],
      ['How important is WIP analysis?', 'It is critical because open-job performance often reveals risk earlier than summary financial statements alone.'],
      ['What makes a contractor bond submission cleaner?', 'Current financials, WIP, bank support, organizational details, and clear bond request context usually make the file far easier to review.'],
    ],
  },
  {
    slug: 'sba-504-loans',
    title: 'SBA 504 Loans Guide | BondSBA Terminal',
    description: 'Learn how SBA 504 loans are used for owner-occupied real estate and equipment, and how to prepare a cleaner financing submission.',
    heading: 'SBA 504 Loans Guide',
    eyebrow: 'Owner-occupied real estate & equipment',
    intro: 'SBA 504 conversations tend to center on project fit, occupancy, borrower strength, and whether the capital stack is documented clearly enough to support lender and CDC review.',
    primaryCta: { href: '/sba-program-comparison', label: 'Compare SBA Programs' },
    secondaryCta: { href: '/sba-document-checklist', label: 'Review Required Documents' },
    sections: [
      ['When 504 is usually discussed', 'The 504 structure is often used for owner-occupied real estate, major equipment, and longer-term fixed-asset financing discussions.'],
      ['What reviewers want to see', 'Project details, occupancy support, borrower financial strength, injection support, and realistic sources-and-uses all matter early.'],
      ['Where deals lose momentum', 'Confusion around occupancy, weak project detail, incomplete costs, and unclear borrower contribution often create avoidable friction.'],
      ['Best next step', 'Use the program comparison and checklist to position the request before you ask lenders or CDC partners for a real response.'],
    ],
    faq: [
      ['What is an SBA 504 loan used for?', 'It is commonly discussed for owner-occupied commercial real estate, facility improvements, and major fixed-asset purchases.'],
      ['How is 504 different from 7(a)?', 'The use case, structure, and review path are different, so comparing the programs early helps clarify which lane makes more sense.'],
      ['What helps a 504 request move faster?', 'Clear project costs, occupancy support, borrower financials, and a complete sources-and-uses story usually help a lot.'],
    ],
  },
  {
    slug: 'contractor-bonding',
    title: 'Contractor Bonding Guide | BondSBA Terminal',
    description: 'A contractor bonding guide for brokers, CPAs, and contractors who need cleaner financials, WIP support, and underwriter-ready bond submissions.',
    heading: 'Contractor Bonding Guide',
    eyebrow: 'Bond capacity & submission quality',
    intro: 'Contractor bonding is easier when the submission explains who the contractor is, what work is in progress, how the bank relationship looks, and why the requested bond makes sense now.',
    primaryCta: { href: '/surety-dashboard', label: 'Open Bond Workflow' },
    secondaryCta: { href: '/financial-spreading', label: 'Spread Financial Statements' },
    sections: [
      ['What affects bond capacity', 'Working capital, net worth, profitability, WIP quality, bank support, and execution history all influence how much confidence an underwriter can extend.'],
      ['What CPAs and brokers can improve', 'Cleaner statement presentation, stronger WIP narratives, and earlier identification of project concentration issues often improve the conversation materially.'],
      ['What underwriters want less of', 'Incomplete submissions, stale schedules, unsupported backlog claims, and missing explanations around rapid growth create immediate drag.'],
      ['How to build momentum', 'Start with financial spreading, review WIP quality, then package the bond request with a short narrative that answers the obvious questions up front.'],
    ],
    faq: [
      ['What is contractor bonding?', 'Contractor bonding refers to surety-backed obligations that support project performance, payment, and other contract requirements.'],
      ['Why does bank support matter in bonding?', 'The banking relationship helps signal liquidity, operating discipline, and whether the contractor has working capital support during job execution.'],
      ['What should a contractor bring to a bond discussion?', 'Current financials, WIP, organizational information, bond request details, and context around backlog and project mix are the best place to start.'],
    ],
  },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderAdUnit(slot, className = '') {
  if (!adClient || !slot) return '';

  return `
    <section class="ad-slot ${className}" aria-label="Advertisement">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${escapeHtml(adClient)}"
           data-ad-slot="${escapeHtml(slot)}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </section>
  `;
}

function renderFaqSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

function renderBreadcrumbSchema(page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: siteName,
        item: `${siteOrigin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.heading,
        item: `${siteOrigin}/${page.slug}`,
      },
    ],
  };
}

function renderPage(page) {
  const canonical = `${siteOrigin}/${page.slug}`;
  const jsonLd = [renderBreadcrumbSchema(page), renderFaqSchema(page)];
  const relatedLinks = commonLinks.filter((link) => link.href !== `/${page.slug}`);
  const adsScript = adClient ? `
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(adClient)}" crossorigin="anonymous"></script>
    <script>
      window.addEventListener('load', function () {
        document.querySelectorAll('.adsbygoogle').forEach(function () {
          try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (error) {}
        });
      });
    </script>
  ` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteOrigin}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="theme-color" content="#0A2540" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    ${adsScript}
    <style>
      :root {
        color-scheme: light;
        --navy: #0A2540;
        --navy-2: #1B3A6B;
        --slate: #475569;
        --line: #cbd5e1;
        --bg: #f8fafc;
        --card: #ffffff;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: #0f172a; }
      a { color: inherit; }
      .shell { min-height: 100vh; }
      .topbar { background: var(--navy); border-bottom: 1px solid var(--navy-2); color: white; }
      .topbar-inner, .content, .footer-inner { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 56px; }
      .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: white; font-weight: 700; }
      .brand img { width: 28px; height: 28px; background: white; }
      .brand small { color: #cbd5e1; font-size: 11px; font-weight: 600; text-transform: uppercase; }
      .content { padding: 28px 0 40px; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
      .hero, .card, .faq, .links, .sidebar-card { background: var(--card); border: 1px solid var(--line); }
      .hero, .card, .faq, .links { padding: 24px; }
      .eyebrow { margin: 0 0 8px; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
      h1 { margin: 0; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; color: #0f172a; }
      h2 { margin: 0 0 8px; font-size: 1.15rem; color: #0f172a; }
      p { margin: 0; color: var(--slate); line-height: 1.7; }
      .lede { margin-top: 14px; font-size: 1rem; max-width: 66ch; }
      .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
      .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; text-decoration: none; font-weight: 700; font-size: .95rem; border: 1px solid transparent; }
      .btn-primary { background: var(--navy); color: white; }
      .btn-secondary { background: white; color: var(--navy); border-color: var(--navy); }
      .stack { display: grid; gap: 16px; }
      .cards { display: grid; gap: 16px; }
      .links-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .link-card { display: block; padding: 16px; border: 1px solid var(--line); text-decoration: none; background: #fff; font-weight: 700; color: var(--navy); }
      .link-card span { display: block; margin-top: 6px; color: var(--slate); font-size: .92rem; font-weight: 500; }
      .faq-item + .faq-item { border-top: 1px solid #e2e8f0; margin-top: 14px; padding-top: 14px; }
      .faq-item h3 { margin: 0 0 6px; font-size: 1rem; color: #0f172a; }
      .sidebar { display: grid; gap: 16px; align-content: start; }
      .sidebar-card { padding: 18px; }
      .sidebar-card ul { margin: 12px 0 0; padding-left: 18px; color: var(--slate); }
      .sidebar-card li + li { margin-top: 8px; }
      .ad-slot { min-height: 90px; }
      .footer { background: white; border-top: 1px solid var(--line); }
      .footer-inner { padding: 24px 0 32px; }
      .footer-links { display: flex; flex-wrap: wrap; gap: 12px 16px; margin-top: 14px; }
      .footer-links a { color: var(--navy); text-decoration: none; font-weight: 600; }
      @media (max-width: 900px) {
        .content { grid-template-columns: 1fr; }
        .sidebar { order: -1; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <img src="/bondsba-icon.svg" alt="" />
            <span>${siteName}</span>
          </a>
          <small>Partner-focused SBA and surety workflow</small>
        </div>
      </header>

      <main class="content">
        <div class="stack">
          <section class="hero">
            <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
            <h1>${escapeHtml(page.heading)}</h1>
            <p class="lede">${escapeHtml(page.intro)}</p>
            <div class="cta-row">
              <a class="btn btn-primary" href="${page.primaryCta.href}">${escapeHtml(page.primaryCta.label)}</a>
              <a class="btn btn-secondary" href="${page.secondaryCta.href}">${escapeHtml(page.secondaryCta.label)}</a>
            </div>
          </section>

          ${renderAdUnit(adSlots.top)}

          <section class="cards">
            ${page.sections.map(([title, body]) => `
              <article class="card">
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(body)}</p>
              </article>
            `).join('')}
          </section>

          ${renderAdUnit(adSlots.mid)}

          <section class="links">
            <h2>Related guides and tools</h2>
            <p style="margin-bottom: 16px;">Use these public resources to move from education into a cleaner, more reviewable submission workflow.</p>
            <div class="links-grid">
              ${relatedLinks.map((link) => `
                <a class="link-card" href="${link.href}">
                  ${escapeHtml(link.label)}
                  <span>Open the resource</span>
                </a>
              `).join('')}
            </div>
          </section>

          ${renderAdUnit(adSlots.bottom)}

          <section class="faq">
            <h2>Frequently asked questions</h2>
            <div style="margin-top: 14px;">
              ${page.faq.map(([question, answer]) => `
                <div class="faq-item">
                  <h3>${escapeHtml(question)}</h3>
                  <p>${escapeHtml(answer)}</p>
                </div>
              `).join('')}
            </div>
          </section>
        </div>

        <aside class="sidebar">
          ${renderAdUnit(adSlots.sidebar)}
          <section class="sidebar-card">
            <h2>Next step</h2>
            <p style="margin-top: 8px;">Move from research into a more usable workflow with the tool surface that matches this topic.</p>
            <div class="cta-row" style="margin-top: 16px;">
              <a class="btn btn-primary" href="${page.primaryCta.href}">${escapeHtml(page.primaryCta.label)}</a>
            </div>
          </section>
          <section class="sidebar-card">
            <h2>Why this page exists</h2>
            <ul>
              <li>Built for brokers, CPAs, and referral partners</li>
              <li>Designed to improve submission quality</li>
              <li>Structured for SBA and surety search intent</li>
            </ul>
          </section>
        </aside>
      </main>

      <footer class="footer">
        <div class="footer-inner">
          <p><strong>${siteName}</strong> helps brokers, CPAs, surety teams, and financing partners structure cleaner submissions.</p>
          <div class="footer-links">
            <a href="/">Home</a>
            <a href="/sba-loan-calculator">SBA Loan Calculator</a>
            <a href="/wip-schedule-analyzer">WIP Schedule Analyzer</a>
            <a href="mailto:${supportEmail}">${supportEmail}</a>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>`;
}

for (const page of pages) {
  const targetDir = path.join(publicDir, page.slug);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), renderPage(page));
}

console.log(`Generated ${pages.length} static SEO landing pages.`);
