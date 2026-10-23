import React, { useState } from 'react';
import {
  Settings, BookOpen, Database, Shield, Terminal,
  Cpu, FileSpreadsheet, CheckCircle2, Copy
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'metrics' | 'architecture' | 'setup'>('dictionary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dataDictionary = [
    { field: 'transaction_id', type: 'VARCHAR(100)', nullAllowed: 'NO', description: 'Primary business key uniquely identifying an operational order line item.' },
    { field: 'transaction_date', type: 'DATETIME', nullAllowed: 'NO', description: 'Timestamp when transaction occurred in ERP source terminal.' },
    { field: 'customer_id', type: 'VARCHAR(50)', nullAllowed: 'NO (DQ Rule)', description: 'Foreign key to DimCustomer. Null values flag REQ_CUST_ID defect.' },
    { field: 'product_sku', type: 'VARCHAR(50)', nullAllowed: 'NO', description: 'Foreign key referencing approved enterprise Product Master.' },
    { field: 'department', type: 'VARCHAR(100)', nullAllowed: 'NO', description: 'Enterprise organizational cost center (Sales, Finance, Operations, Supply Chain, Retail, Enterprise).' },
    { field: 'quantity', type: 'INTEGER', nullAllowed: 'NO', description: 'Number of units purchased in transaction.' },
    { field: 'unit_price', type: 'FLOAT', nullAllowed: 'NO', description: 'Per-unit price in USD currency.' },
    { field: 'total_amount', type: 'FLOAT', nullAllowed: 'NO (Must be > 0)', description: 'Gross revenue. Must strictly equal quantity * unit_price within $0.02.' },
    { field: 'is_valid', type: 'BOOLEAN', nullAllowed: 'NO', description: 'Computed compliance flag. Set to FALSE if any active DQ rule fails.' },
    { field: 'ledger_reference', type: 'VARCHAR(100)', nullAllowed: 'NO', description: 'Unique journal entry ID in Finance General Ledger.' },
    { field: 'external_reference', type: 'VARCHAR(100)', nullAllowed: 'YES', description: 'GL reference mapping back to ERP transaction_id for reconciliation.' },
    { field: 'posted_amount', type: 'FLOAT', nullAllowed: 'NO', description: 'Amount recorded in GL journal entry for reconciliation matching.' }
  ];

  const metricDefinitions = [
    {
      name: 'Total Monitored Revenue',
      formula: 'SUM(total_amount)',
      scope: 'All valid & flagged transactions',
      description: 'Total dollar volume tracked across operational batches.'
    },
    {
      name: 'Data Quality Pass Rate',
      formula: '(COUNT(is_valid = TRUE) / Total Records) * 100',
      scope: 'Active batch records',
      description: 'Percentage of operational records passing all 6 active DQ rules without violation.'
    },
    {
      name: 'Weighted Quality Score',
      formula: '(Completeness * 0.30) + (Uniqueness * 0.25) + (Validity * 0.25) + (Integrity * 0.20)',
      scope: 'Global dataset index',
      description: 'Canonical composite score measuring enterprise data health across four DAMA dimensions.'
    },
    {
      name: 'Reconciliation Rate',
      formula: '(Matched Count / Total ERP Records) * 100',
      scope: 'Dual-system comparison',
      description: 'Percentage of operational ERP transactions successfully reconciled against Finance General Ledger within tolerance.'
    },
    {
      name: 'Net Ledger Variance',
      formula: 'SUM(Source A Amount) - SUM(Source B Amount)',
      scope: 'Reconciliation run',
      description: 'Dollar discrepancy between ERP operational revenue and posted General Ledger journal entries.'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
          <span>Enterprise Governance & Documentation</span>
          <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
            DAMA-DMBOK Standards
          </span>
        </h1>
        <p className="text-xs text-universe-muted mt-1">
          Canonical data dictionary, mathematical metric definitions, system architecture, and interview talking points.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-universe-border space-x-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`pb-2 transition ${
            activeTab === 'dictionary'
              ? 'text-cyan-accent border-b-2 border-cyan-accent font-bold'
              : 'text-universe-muted hover:text-white'
          }`}
        >
          Data Dictionary (12 Fields)
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-2 transition ${
            activeTab === 'metrics'
              ? 'text-cyan-accent border-b-2 border-cyan-accent font-bold'
              : 'text-universe-muted hover:text-white'
          }`}
        >
          Canonical Metric Definitions (5 KPIs)
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-2 transition ${
            activeTab === 'architecture'
              ? 'text-cyan-accent border-b-2 border-cyan-accent font-bold'
              : 'text-universe-muted hover:text-white'
          }`}
        >
          System Architecture & Tech Stack
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`pb-2 transition ${
            activeTab === 'setup'
              ? 'text-cyan-accent border-b-2 border-cyan-accent font-bold'
              : 'text-universe-muted hover:text-white'
          }`}
        >
          Interview Guide & Talking Points
        </button>
      </div>

      {/* Tab: Data Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">Relational Enterprise Data Dictionary</h3>
            <span className="text-xs font-mono text-cyan-accent">PostgreSQL / SQLite Schema</span>
          </div>

          <div className="overflow-x-auto border border-universe-border rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-universe-surface text-universe-dim uppercase text-[10px]">
                <tr>
                  <th className="p-3">Field Name</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3">Nullability</th>
                  <th className="p-3 font-sans">Business Purpose & Integrity Constraint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border text-universe-text font-sans">
                {dataDictionary.map((item) => (
                  <tr key={item.field} className="hover:bg-universe-surface/40">
                    <td className="p-3 font-mono text-cyan-accent font-semibold">{item.field}</td>
                    <td className="p-3 font-mono text-violet-accent">{item.type}</td>
                    <td className="p-3 font-mono text-universe-muted">{item.nullAllowed}</td>
                    <td className="p-3 text-universe-muted text-xs">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Metric Definitions */}
      {activeTab === 'metrics' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">Canonical Mathematical Metric Definitions</h3>
            <span className="text-xs font-mono text-mint-accent">Consistent Across SQL, Excel, and BI</span>
          </div>

          <div className="space-y-3">
            {metricDefinitions.map((m) => (
              <div key={m.name} className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-white">{m.name}</h4>
                  <span className="text-[10px] font-mono text-universe-dim px-2 py-0.5 rounded bg-universe-card border border-universe-border">
                    {m.scope}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-universe-bg border border-universe-border font-mono text-xs text-cyan-accent">
                  Formula: {m.formula}
                </div>
                <p className="text-xs text-universe-muted">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: System Architecture */}
      {activeTab === 'architecture' && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-white">Production Stack & Architecture Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
              <div className="font-bold text-cyan-accent font-mono uppercase text-xs">Backend Infrastructure</div>
              <ul className="text-universe-muted space-y-1.5 leading-relaxed font-mono">
                <li>• Python 3.13 / FastAPI asynchronous REST API</li>
                <li>• SQLAlchemy ORM (PostgreSQL & SQLite Dual-Mode)</li>
                <li>• Pandas 2.2 / NumPy 2.0 analytical processing</li>
                <li>• OpenPyXL multi-tab styled Excel generator</li>
                <li>• Pytest comprehensive 8-suite automated test coverage</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
              <div className="font-bold text-violet-accent font-mono uppercase text-xs">Frontend Architecture</div>
              <ul className="text-universe-muted space-y-1.5 leading-relaxed font-mono">
                <li>• React 19 + TypeScript with strict static typing</li>
                <li>• Vite build tool with lightning HMR & dev proxy</li>
                <li>• Tailwind CSS with 'Luminous Data Universe' token system</li>
                <li>• Recharts interactive data visualization suite</li>
                <li>• Lucide icons & keyboard-accessible command palette</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Interview Talking Points */}
      {activeTab === 'setup' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">2027 Fresher Interview Script & Key Talking Points</h3>
            <span className="text-xs font-mono text-cyan-accent">Data Specialist Portfolio Highlight</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
              <div className="font-bold text-cyan-accent text-sm">1. How to Introduce the Platform to a Recruiter</div>
              <p className="text-universe-text leading-relaxed">
                "I engineered the <strong>DataOps Command Center</strong> to solve the widespread industry problem of untrusted business data and cross-system ledger discrepancies. It acts as an automated intelligence layer between operational systems like ERPs and financial general ledgers, enforcing data profiling, DQ rules, tolerance-based reconciliation, and automated executive reporting."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
              <div className="font-bold text-violet-accent text-sm">2. Demonstrating Technical Depth in Excel & SQL</div>
              <p className="text-universe-text leading-relaxed">
                "Rather than simple UI mockups, I implemented a genuine openpyxl reporting engine that produces production-grade 6-tab workbooks with freeze panes, conditional formatting, and verified number formatting. In the SQL Intelligence layer, I authored CTEs and window running total queries with strict read-only execution guardrails."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
              <div className="font-bold text-mint-accent text-sm">3. Demonstrating Power BI & Tableau Readiness</div>
              <p className="text-universe-text leading-relaxed">
                "In enterprise BI, data specialists must design clean star-schemas. I defined normalized Fact and Dimension tables (FactTransactions, DimDate, DimCustomer, DimProduct, DimDepartment), wrote tested DAX measures (Total Revenue, DQ Pass Rate, Reconciliation Rate), and built an automated CSV package generator that exports ready-to-import files."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
