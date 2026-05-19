import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ background:'#07091a' }}>
      <Sidebar />
      <Header />
      <main className="ml-56 pt-14 min-h-screen">
        <div className="p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
