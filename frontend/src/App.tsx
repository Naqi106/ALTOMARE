import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-background text-slate-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.08),transparent_28%),#080d16]">
          {activePage === 'dashboard' ? <Dashboard /> : <Analytics />}
        </main>
      </div>
    </div>
  );
};

export default App;
