'use client';

import { useEffect, useState } from 'react';

interface Contract {
  id: string;
  contract_number: string;
  client_id: string;
  title: string;
  description?: string;
  amount: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  payment_terms: 'immediate' | 'monthly' | 'installment';
  attachment_url?: string;
  clients?: { name: string };
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    amount: '',
    startDate: '',
    endDate: '',
    paymentTerms: 'immediate' as 'immediate' | 'monthly' | 'installment',
    attachmentUrl: '',
  });

  const pageSize = 10;

  useEffect(() => {
    fetchClients();
    fetchContracts();
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

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(status && { status }),
        ...(clientFilter && { clientId: clientFilter }),
      });
      const res = await fetch(`/api/contracts?${params}`);
      const data = await res.json();
      if (data.success) {
        setContracts(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  const openModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        clientId: contract.client_id,
        title: contract.title,
        description: contract.description || '',
        amount: contract.amount.toString(),
        startDate: contract.start_date,
        endDate: contract.end_date,
        paymentTerms: contract.payment_terms,
        attachmentUrl: contract.attachment_url || '',
      });
    } else {
      setEditingContract(null);
      setFormData({
        clientId: '',
        title: '',
        description: '',
        amount: '',
        startDate: '',
        endDate: '',
        paymentTerms: 'immediate',
        attachmentUrl: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContract(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/contracts';
    const method = editingContract ? 'PUT' : 'POST';

    const body: any = {
      clientId: formData.clientId,
      title: formData.title,
      description: formData.description || null,
      amount: parseFloat(formData.amount) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      paymentTerms: formData.paymentTerms,
      attachmentUrl: formData.attachmentUrl || null,
    };

    if (editingContract) {
      body.id = editingContract.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchContracts();
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
      const res = await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        fetchContracts();
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
      const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchContracts();
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
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      active: 'badge-success',
      expired: 'badge-secondary',
      terminated: 'badge-danger',
    };
    return <span className={`badge ${badges[status]}`}>{status}</span>;
  };

  const getPaymentTerms = (terms: string) => {
    const labels: Record<string, string> = {
      immediate: '즉시결제',
      monthly: '월말결제',
      installment: '분할결제',
    };
    return labels[terms] || terms;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">계약관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            계약 등록
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="계약명, 계약번호 검색..."
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
            <option value="active">진행중</option>
            <option value="expired">만료</option>
            <option value="terminated">해지</option>
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
        ) : contracts.length === 0 ? (
          <div className="empty-state">계약이 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>계약번호</th>
                  <th>계약명</th>
                  <th>거래처</th>
                  <th>금액</th>
                  <th>기간</th>
                  <th>결제조건</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.contract_number}</td>
                    <td>{contract.title}</td>
                    <td>{contract.clients?.name || '-'}</td>
                    <td>{formatCurrency(contract.amount)}</td>
                    <td>
                      {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
                    </td>
                    <td>{getPaymentTerms(contract.payment_terms)}</td>
                    <td>{getStatusBadge(contract.status)}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: 'auto', display: 'inline-block', marginRight: '0.5rem' }}
                        value={contract.status}
                        onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                      >
                        <option value="pending">대기중</option>
                        <option value="active">진행중</option>
                        <option value="expired">만료</option>
                        <option value="terminated">해지</option>
                      </select>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(contract)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(contract.id)}
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
                {editingContract ? '계약 수정' : '계약 등록'}
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
                <label className="form-label">계약명 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">설명</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">금액</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
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
                <label className="form-label">종료일 *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">결제조건</label>
                <select
                  className="form-select"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentTerms: e.target.value as any,
                    })
                  }
                >
                  <option value="immediate">즉시결제</option>
                  <option value="monthly">월말결제</option>
                  <option value="installment">분할결제</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">첨부파일 URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.attachmentUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, attachmentUrl: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContract ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
