'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        로딩 중...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/employees', label: '사원관리', roles: ['admin'] },
    { href: '/clients', label: '거래처관리' },
    { href: '/contracts', label: '계약관리' },
    { href: '/subscriptions', label: '구독관리' },
    { href: '/revenue', label: '매출관리' },
    { href: '/plans', label: '플랜관리' },
    { href: '/departments', label: '부서관리', roles: ['admin'] },
    { href: '/activity-logs', label: '활동로그', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes((session.user as any).role);
  });

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: sidebarOpen ? '250px' : '60px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          transition: 'width 0.3s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
          }}
        >
          {sidebarOpen && <span style={{ fontWeight: 'bold' }}>TaxAI Admin</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
          >
            {sidebarOpen ? '×' : '☰'}
          </button>
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                color: pathname === item.href ? '#fff' : '#aaa',
                backgroundColor: pathname === item.href ? '#333' : 'transparent',
                borderLeft: pathname === item.href ? '3px solid #fff' : '3px solid transparent',
              }}
            >
              <span style={{ marginRight: sidebarOpen ? '0.75rem' : '0', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
          {sidebarOpen && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: '500' }}>{(session.user as any).name}</div>
              <div style={{ color: '#aaa', fontSize: '0.75rem' }}>{(session.user as any).role}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {sidebarOpen ? '로그아웃' : 'OUT'}
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        {children}
      </main>
    </div>
  );
}
