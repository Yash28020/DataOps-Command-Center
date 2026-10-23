import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { OverviewPage } from './pages/OverviewPage';
import { SourcesPage } from './pages/SourcesPage';
import { QualityPage } from './pages/QualityPage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { SqlPage } from './pages/SqlPage';
import { ReportsPage } from './pages/ReportsPage';
import { BiWorkspacePage } from './pages/BiWorkspacePage';
import { OperationsPage } from './pages/OperationsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activePeriod, setActivePeriod] = useState('Q4 2026');

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      window.location.reload();
    } catch (err) {
      alert('Failed to seed demonstration data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRunValidation = async () => {
    try {
      await api.runValidation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunRecon = async () => {
    try {
      await api.executeReconciliation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await api.generateExcelReport(activePeriod);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-universe-bg text-universe-text font-sans flex flex-col selection:bg-cyan-accent/30 selection:text-white">
        {/* Top Navbar */}
        <Navbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onSeedDemo={handleSeedDemo}
          isSeeding={isSeeding}
          activePeriod={activePeriod}
          setActivePeriod={setActivePeriod}
        />

        {/* Main Body Area */}
        <div className="flex flex-1">
          {/* Collapsible Left Rail */}
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

          {/* Page View Container */}
          <main className="flex-1 min-w-0 overflow-y-auto bg-universe-grid bg-fixed pb-16">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
              <Route path="/sql" element={<SqlPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/bi-workspace" element={<BiWorkspacePage />} />
              <Route path="/operations" element={<OperationsPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSeedDemo={handleSeedDemo}
          onRunValidation={handleRunValidation}
          onRunRecon={handleRunRecon}
          onGenerateReport={handleGenerateReport}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
