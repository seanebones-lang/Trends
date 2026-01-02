import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ConfigPanel from './components/ConfigPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard />
      <ConfigPanel />
    </div>
  );
}

export default App;
