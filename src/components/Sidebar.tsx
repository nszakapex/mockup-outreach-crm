'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prospects', label: 'Prospects', icon: Users },
  { href: '/approval', label: 'Approval Queue', icon: CheckCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg lg:hidden"
        style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink)' }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-paper-2)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-5 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}
          >
            <Zap size={16} style={{ color: 'var(--color-paper)' }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Mockup Outreach
            </div>
            <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
              localhost:3001
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded lg:hidden"
            style={{ color: 'var(--color-ink-3)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? 'var(--color-accent-muted)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-ink-2)',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--color-paper-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-4 text-xs shrink-0"
          style={{
            color: 'var(--color-ink-muted)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* TODO: [Hermes Integration] Show Hermes connection status here */}
          <div>mockup-outreach-crm</div>
          <div className="mt-1 opacity-60">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
