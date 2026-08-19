import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Alerts } from './pages/Alerts';
import { Zones } from './pages/Zones';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Correlation } from './pages/Correlation';
import { Revenue } from './pages/Revenue';
import { Settings } from './pages/Settings';
import { useLiveAlerts } from './services/dashboardData';

const App: React.FC = () => {
  const location = useLocation();
  const activePage = location.pathname.replace('/', '') || 'dashboard';

  // Lift alert state so Navbar notification bell can share it without a second polling interval
  const { alerts, loading: alertsLoading, error: alertsError, lastUpdated } = useLiveAlerts(15000);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-slate-100">
      <Sidebar activePage={activePage} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar alerts={alerts} alertsError={alertsError} />
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.05),transparent_28%),#080d16]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <Dashboard
                sharedAlerts={alerts}
                sharedAlertsLoading={alertsLoading}
                sharedAlertsError={alertsError}
                sharedLastUpdated={lastUpdated}
              />
            } />
            <Route path="/alerts" element={<Alerts alerts={alerts} loading={alertsLoading} error={alertsError} lastUpdated={lastUpdated} />} />
            <Route path="/zones" element={<Zones alerts={alerts} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports alerts={alerts} />} />
            <Route path="/correlation" element={<Correlation />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
