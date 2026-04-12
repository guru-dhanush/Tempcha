import Link from 'next/link';
import { ReactNode } from 'react';
import { Zap } from 'lucide-react';
import '../../../styles/dashboard.css';
import { Sidebar } from '@/components/dashboard/layout/sidebar';
import { SidebarUserInfo } from '@/components/dashboard/layout/sidebar-user-info';

interface Props { children: ReactNode; }

export function DashboardLayout({ children }: Props) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] relative overflow-hidden" style={{background:'hsl(224 30% 5%)'}}>
      {/* Ambient orb */}
      <div className="orb orb-purple w-[500px] h-[500px] top-0 left-0 opacity-30 pointer-events-none fixed" />

      {/* Sidebar */}
      <div className="hidden border-r md:flex flex-col relative" style={{borderColor:'hsl(224 20% 11%)'}}>
        <div className="flex items-center px-6 py-6 border-b" style={{borderColor:'hsl(224 20% 11%)'}}>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))'}}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            Flash<span className="glow-text">Room</span>
          </Link>
        </div>
        <div className="flex flex-col grow py-4">
          <Sidebar />
          <SidebarUserInfo />
        </div>
      </div>

      <div className="flex flex-col relative z-10">{children}</div>
    </div>
  );
}
