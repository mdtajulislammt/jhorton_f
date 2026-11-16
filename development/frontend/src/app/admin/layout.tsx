'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Store,
  Tag,
  ShoppingBag,
  Tv,
  LogOut,
  ShieldCheck,
  User,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminUserDto } from '@/types/api.generated';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Inventory', href: '/admin/inventory', icon: Layers },
  { label: 'Dispensaries', href: '/admin/dispensaries', icon: Store },
  { label: 'Brands', href: '/admin/brands', icon: Tag },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Live Shows', href: '/admin/live-shows', icon: Tv },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminUserDto | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        }
      })
      .catch(() => {});
  }, [isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#071311] text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#0D221E] border-b border-[#1A3832] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#70F1C7]" />
          <span className="font-bold tracking-tight text-white font-['Dela_Gothic_One'] text-sm">
            OWTLET<span className="text-[#70F1C7]">.ADMIN</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#BBD7D1] hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-[#0D221E] border-r border-[#1A3832] shrink-0 sticky top-0 h-screen overflow-y-auto z-30`}
      >
        <div className="p-5 border-b border-[#1A3832] hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#70F1C7]/10 border border-[#70F1C7]/30 flex items-center justify-center text-[#70F1C7]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white font-['Dela_Gothic_One'] tracking-tight text-base leading-none">
                OWTLET<span className="text-[#70F1C7]">.ADMIN</span>
              </div>
              <div className="text-[11px] text-[#BBD7D1] font-medium mt-1">
                Ops & Catalog Console
              </div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#70F1C7] text-[#0D221E] font-bold shadow-md'
                    : 'text-[#BBD7D1] hover:bg-[#122A25] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0D221E]' : 'text-[#70F1C7]'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1A3832] space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-[#BBD7D1] hover:bg-[#122A25] hover:text-white"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#70F1C7]" />
          </a>

          <div className="px-3 py-2 bg-[#071311] rounded-lg border border-[#1A3832] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#1A3832] flex items-center justify-center text-[#70F1C7]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser?.email || 'ops@owtlet.com'}
                </div>
                <div className="text-[10px] text-[#70F1C7] uppercase font-bold tracking-wider">
                  {currentUser?.role || 'ADMIN'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

