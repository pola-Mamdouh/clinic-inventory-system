import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 text-white flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[240px]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
