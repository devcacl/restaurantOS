import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { KitchenKDSView } from './views/KitchenKDSView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { PurchasesView } from './views/PurchasesView';
import { DashboardView } from './views/DashboardView';
import { AuditLogsView } from './views/AuditLogsView';

export function App() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'pos' && <POSView />}
          {activeTab === 'kds' && <KitchenKDSView />}
          {activeTab === 'menu' && <ProductsView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'audit' && <AuditLogsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
