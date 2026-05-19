import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useAlerts } from '@/hooks/useAlerts';
import { usePatients } from '@/hooks/usePatients';

export default function Layout() {
  const { unacknowledged } = useAlerts();
  const { isLive } = usePatients();
  const alertCount = unacknowledged.length;

  return (
    <div className="flex h-full min-h-screen bg-bg-base grid-bg">
      <Sidebar alertCount={alertCount} isLive={isLive} />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <TopBar alertCount={alertCount} isLive={isLive} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 p-4 md:p-6 animate-fade-up">
          <Outlet />
        </main>
      </div>
      <MobileNav alertCount={alertCount} />
    </div>
  );
}
