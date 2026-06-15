'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle,
  FileJson,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { APP_NAME, EXPECTED_LOCAL_URL } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', detail: 'Command center', icon: LayoutDashboard },
  { href: '/prospects', label: 'Prospects', detail: 'Research workspace', icon: Users },
  { href: '/import', label: 'Hermes Import', detail: 'Preview and gate', icon: FileJson },
  { href: '/approval', label: 'Approval Queue', detail: 'Manual review', icon: CheckCircle },
  { href: '/send-queue', label: 'Send Queue', detail: 'Controlled sends', icon: Mail },
  { href: '/settings', label: 'Settings', detail: 'Sender and env', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden"
        style={{
          background: 'var(--color-paper-glass)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-ink)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(16px)',
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full flex-col
          transition-transform duration-300
          lg:static lg:z-auto lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-paper-glass)',
          borderRight: '1px solid var(--color-border)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex min-h-24 items-start gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--color-divider)' }}>
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-paper-2)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Sparkles size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Mockup Outreach
            </div>
            <div className="mt-1 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
              Premium outreach OS
            </div>
            <div className="mt-2 truncate font-mono text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
              {EXPECTED_LOCAL_URL}
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg lg:hidden"
            style={{ color: 'var(--color-ink-3)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          <div
            className="rounded-xl border p-3"
            style={{
              background: 'var(--color-paper-2)',
              borderColor: 'var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--color-emerald)' }} />
              Local QA workspace
            </div>
            <div className="mt-2 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
              Imports, approvals, and sends stay behind explicit page actions.
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-4">
          {NAV_ITEMS.map(({ href, label, detail, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all"
                style={{
                  background: active ? 'var(--color-paper-2)' : 'transparent',
                  color: active ? 'var(--color-ink)' : 'var(--color-ink-2)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  border: active ? '1px solid var(--color-border)' : '1px solid transparent',
                }}
                onMouseEnter={(event) => {
                  if (!active) event.currentTarget.style.background = 'var(--color-paper-hover)';
                }}
                onMouseLeave={(event) => {
                  if (!active) event.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: active ? 'var(--color-accent-subtle)' : 'var(--color-paper-3)',
                    color: active ? 'var(--color-accent)' : 'var(--color-ink-3)',
                  }}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{label}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>
                    {detail}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-xs" style={{ borderTop: '1px solid var(--color-divider)' }}>
          <div className="font-semibold" style={{ color: 'var(--color-ink)' }}>
            {APP_NAME}
          </div>
          <div className="mt-1 leading-5" style={{ color: 'var(--color-ink-3)' }}>
            Apex, Resinate, and future lanes.
          </div>
          <div className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>
            Sender state verified per page
          </div>
        </div>
      </aside>
    </>
  );
}
