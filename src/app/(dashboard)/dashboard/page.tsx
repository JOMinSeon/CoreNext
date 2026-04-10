import { auth } from '@/lib/auth';
import { query } from '@/lib/database';
import { redirect } from 'next/navigation';

async function getDashboardStats() {
  const employees = await query<{ count: string }>`SELECT COUNT(*) as count FROM employees`;
  const clients = await query<{ count: string }>`SELECT COUNT(*) as count FROM clients`;
  const totalContracts = await query<{ count: string }>`SELECT COUNT(*) as count FROM contracts`;
  const activeContracts = await query<{ count: string }>`SELECT COUNT(*) as count FROM contracts WHERE status = 'active'`;
  const totalSubscriptions = await query<{ count: string }>`SELECT COUNT(*) as count FROM subscriptions`;
  const activeSubscriptions = await query<{ count: string }>`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`;
  const revenueResult = await query<{ sum: string | number }>`SELECT COALESCE(SUM(price), 0) as sum FROM subscriptions WHERE status = 'active'`;
  const pendingContracts = await query<{ count: string }>`SELECT COUNT(*) as count FROM contracts WHERE status = 'pending'`;

  return {
    totalEmployees: parseInt(employees[0]?.count || '0'),
    totalClients: parseInt(clients[0]?.count || '0'),
    totalContracts: parseInt(totalContracts[0]?.count || '0'),
    activeContracts: parseInt(activeContracts[0]?.count || '0'),
    totalSubscriptions: parseInt(totalSubscriptions[0]?.count || '0'),
    activeSubscriptions: parseInt(activeSubscriptions[0]?.count || '0'),
    monthlyRevenue: typeof revenueResult[0]?.sum === 'string' ? parseInt(revenueResult[0]?.sum || '0') : (revenueResult[0]?.sum || 0),
    pendingContracts: parseInt(pendingContracts[0]?.count || '0'),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const stats = await getDashboardStats();
  const userName = (session.user as any)?.name || (session.user as any)?.employeeId || '사용자';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="main-content">
      <h1 className="page-title">
        안녕하세요, {userName}님
      </h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">전체 사원</div>
          <div className="stat-value">{stats.totalEmployees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 거래처</div>
          <div className="stat-value">{stats.totalClients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 계약</div>
          <div className="stat-value">{stats.totalContracts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">진행중 계약</div>
          <div className="stat-value">{stats.activeContracts}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">구독 현황</h3>
          </div>
          <div className="stats-grid">
            <div>
              <div className="stat-label">전체 구독</div>
              <div className="stat-value">{stats.totalSubscriptions}</div>
            </div>
            <div>
              <div className="stat-label">활성 구독</div>
              <div className="stat-value" style={{ color: '#22c55e' }}>
                {stats.activeSubscriptions}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div className="stat-label">월간 예상 수익</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {formatCurrency(stats.monthlyRevenue)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">계약 현황</h3>
          </div>
          <div className="stats-grid">
            <div>
              <div className="stat-label">전체 계약</div>
              <div className="stat-value">{stats.totalContracts}</div>
            </div>
            <div>
              <div className="stat-label">대기중</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {stats.pendingContracts}
              </div>
            </div>
            <div>
              <div className="stat-label">진행중</div>
              <div className="stat-value" style={{ color: '#22c55e' }}>
                {stats.activeContracts}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
