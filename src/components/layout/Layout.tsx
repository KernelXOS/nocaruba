import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-noc-bg dark:bg-transparent transition-colors duration-200">
      <Sidebar />
      <Header />
      <main className="ml-56 pt-20 min-h-screen">
        <div className="px-8 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
