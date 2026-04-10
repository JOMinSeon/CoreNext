'use client';

import { useEffect, useState } from 'react';

interface Revenue {
  id: string;
  client_id: string;
  client_name?: string;
  employee_id: string;
  employee_name?: string;
  amount: number;
  revenue_date: string;
  description?: string;
  category: string;
  notes?: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

export default function RevenuePage() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    revenueDate: '',
    description: '',
    category: 'general',
    notes: '',
  });

  const pageSize = 10;

  useEffect(() => {
    fetchRevenue();
    fetchClients();
  }, [page, search, clientId, startDate, endDate]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(clientId && { clientId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/revenue?${params}`);
      const data = await res.json();
      if (data.success) {
        setRevenues(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?pageSize=1000');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRevenue();
  };

  const openModal = (revenue?: Revenue) => {
    if (revenue) {
      setEditingRevenue(revenue);
      setFormData({
        clientId: revenue.client_id || '',
        amount: revenue.amount?.toString() || '',
        revenueDate: revenue.revenue_date?.split('T')[0] || '',
        description: revenue.description || '',
        category: revenue.category || 'general',
        notes: revenue.notes || '',
      });
    } else {
      setEditingRevenue(null);
      setFormData({
        clientId: '',
        amount: '',
        revenueDate: new Date().toISOString().split('T')[0],
        description: '',
        category: 'general',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRevenue(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/revenue';
    const method = editingRevenue ? 'PUT' : 'POST';

    const body: any = {
      clientId: formData.clientId,
      amount: parseFloat(formData.amount),
      revenueDate: formData.revenueDate,
      description: formData.description || null,
      category: formData.category,
      notes: formData.notes || null,
    };

    if (editingRevenue) {
      body.id = editingRevenue.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchRevenue();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/revenue?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRevenue();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: '일반',
      project: '프로젝트',
      subscription: '구독',
      service: '서비스',
      etc: '기타',
    };
    return labels[category] || category;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">매출 관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            매출 등록
          </button>
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
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 거래처</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            placeholder="시작일"
          />
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            placeholder="종료일"
          />
          <button type="submit" className="btn btn-secondary">검색</button>
        </form>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : revenues.length === 0 ? (
          <div className="empty-state">매출이 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>거래처</th>
                  <th>금액</th>
                  <th>분류</th>
                  <th>설명</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((revenue) => (
                  <tr key={revenue.id}>
                    <td>{formatDate(revenue.revenue_date)}</td>
                    <td>{revenue.client_name || '-'}</td>
                    <td className="text-right">{formatCurrency(revenue.amount)}</td>
                    <td>{getCategoryLabel(revenue.category)}</td>
                    <td>{revenue.description || '-'}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(revenue)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(revenue.id)}
                      >
                        삭제
                      </button>
                    </td>
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRevenue ? '매출 수정' : '매출 등록'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">거래처 *</label>
                <select
                  className="form-select"
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  required
                >
                  <option value="">거래처 선택</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">금액 *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">매출일 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.revenueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, revenueDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">분류</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="general">일반</option>
                  <option value="project">프로젝트</option>
                  <option value="subscription">구독</option>
                  <option value="service">서비스</option>
                  <option value="etc">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">메모</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRevenue ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}