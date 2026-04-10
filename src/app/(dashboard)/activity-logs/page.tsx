'use client';

import { useEffect, useState } from 'react';

interface ActivityLog {
  id: string;
  user_id: string;
  employee_name?: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, search, action, targetType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(action && { action }),
        ...(targetType && { targetType }),
      });
      const res = await fetch(`/api/activity-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ko-KR');
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      CREATE: 'badge-success',
      UPDATE: 'badge-warning',
      DELETE: 'badge-danger',
      LOGIN: 'badge-secondary',
      LOGOUT: 'badge-secondary',
    };
    return <span className={`badge ${badges[action] || 'badge-secondary'}`}>{action}</span>;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">활동 로그</h2>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 작업</option>
            <option value="CREATE">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
            <option value="LOGIN">로그인</option>
            <option value="LOGOUT">로그아웃</option>
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 대상</option>
            <option value="employee">사원</option>
            <option value="client">거래처</option>
            <option value="contract">계약</option>
            <option value="subscription">구독</option>
            <option value="plan">플랜</option>
            <option value="department">부서</option>
            <option value="revenue">매출</option>
          </select>
          <button type="submit" className="btn btn-secondary">검색</button>
        </form>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">활동 로그가 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>사용자</th>
                  <th>작업</th>
                  <th>대상</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.employee_name || log.user_id}</td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{log.target_type}</td>
                    <td>{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </button>
              <span>
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= total}
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}