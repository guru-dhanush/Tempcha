'use client';

import { QrCode, CreditCard, Home, LayoutDashboard, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { title: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, href: '/dashboard' },
  { title: 'My Rooms', icon: <QrCode className="h-5 w-5" />, href: '/dashboard/rooms' },
  { title: 'Subscriptions', icon: <Zap className="h-5 w-5" />, href: '/dashboard/subscriptions' },
  { title: 'Billing', icon: <CreditCard className="h-5 w-5" />, href: '/dashboard/payments' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col grow justify-between items-start px-3 text-sm font-medium">
      <div className="w-full space-y-1">
        {sidebarItems.map((item) => {
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground',
                active
                  ? 'text-foreground font-semibold'
                  : 'hover:bg-white/5'
              )}
              style={active ? {
                background: 'linear-gradient(135deg, hsl(258 100% 65% / 0.15), hsl(220 100% 60% / 0.1))',
                border: '1px solid hsl(258 50% 60% / 0.2)',
              } : {}}
            >
              <span className={active ? 'text-purple-400' : ''}>{item.icon}</span>
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
