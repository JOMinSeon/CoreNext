'use client';

import { useEffect, useState } from 'react';

interface Subscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date?: string;
  billing_cycle: 'monthly' | 'yearly';
  price: number;
  clients?: { name: string };
  plans?: { name: string };
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    planId: '',
    startDate: '',
    endDate: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    price: '',
  });

  const pageSize = 10;

  useEffect(() => {
    fetchClients();
    fetchPlans();
    fetchSubscriptions();
  }, [page, search, status, clientFilter]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?pageSize=100');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(status && { status }),
        ...(clientFilter && { clientId: clientFilter }),
      });
      const res = await fetch(`/api/subscriptions?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  const openModal = (subscription?: Subscription) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        clientId: subscription.client_id,
        planId: subscription.plan_id,
        startDate: subscription.start_date,
        endDate: subscription.end_date || '',
        billingCycle: subscription.billing_cycle,
        price: subscription.price.toString(),
      });
    } else {
      setEditingSubscription(null);
      setFormData({
        clientId: '',
        planId: '',
        startDate: '',
        endDate: '',
        billingCycle: 'monthly',
        price: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubscription(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/subscriptions';
    const method = editingSubscription ? 'PUT' : 'POST';

    const body: any = {
      clientId: formData.clientId,
      planId: formData.planId,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      billingCycle: formData.billingCycle,
      price: parseFloat(formData.price) || 0,
    };

    if (editingSubscription) {
      body.id = editingSubscription.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 취소하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      active: 'badge-success',
      cancelled: 'badge-danger',
      expired: 'badge-secondary',
    };
    return <span className={`badge ${badges[status]}`}>{status}</span>;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">구독관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            구독 등록
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="구독ID 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="active">활성</option>
            <option value="cancelled">취소</option>
            <option value="expired">만료</option>
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
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
          <button type="submit" className="btn btn-secondary">검색</button>
        </form>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : subscriptions.length === 0 ? (
          <div className="empty-state">구독이 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>구독ID</th>
                  <th>거래처</th>
                  <th>플랜</th>
                  <th>결제주기</th>
                  <th>가격</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.id.substring(0, 8)}...</td>
                    <td>{sub.clients?.name || '-'}</td>
                    <td>{sub.plans?.name || '-'}</td>
                    <td>{sub.billing_cycle === 'monthly' ? '월간' : '연간'}</td>
                    <td>{formatCurrency(sub.price)}</td>
                    <td>{formatDate(sub.start_date)}</td>
                    <td>{formatDate(sub.end_date || '')}</td>
                    <td>{getStatusBadge(sub.status)}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                      >
                        <option value="pending">대기중</option>
                        <option value="active">활성</option>
                        <option value="cancelled">취소</option>
                        <option value="expired">만료</option>
                      </select>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(sub)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(sub.id)}
                      >
                        취소
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
                {editingSubscription ? '구독 수정' : '구독 등록'}
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
                  <option value="">선택하세요</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">플랜 *</label>
                <select
                  className="form-select"
                  value={formData.planId}
                  onChange={(e) => {
                    const plan = plans.find((p) => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      planId: e.target.value,
                      price: plan?.price.toString() || '',
                    });
                  }}
                  required
                >
                  <option value="">선택하세요</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">결제주기</label>
                <select
                  className="form-select"
                  value={formData.billingCycle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingCycle: e.target.value as 'monthly' | 'yearly',
                    })
                  }
                >
                  <option value="monthly">월간</option>
                  <option value="yearly">연간</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">가격</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">시작일 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">종료일</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubscription ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
