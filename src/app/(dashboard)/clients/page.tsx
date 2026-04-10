'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: string;
  name: string;
  business_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  grade: 'A' | 'B' | 'C';
  address?: string;
  memo?: string;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    businessNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    grade: 'C' as 'A' | 'B' | 'C',
    address: '',
    memo: '',
  });

  const pageSize = 10;

  useEffect(() => {
    fetchClients();
  }, [page, search, grade]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(grade && { grade }),
      });
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        businessNumber: client.business_number || '',
        contactName: client.contact_name || '',
        contactEmail: client.contact_email || '',
        contactPhone: client.contact_phone || '',
        grade: client.grade,
        address: client.address || '',
        memo: client.memo || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        businessNumber: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        grade: 'C',
        address: '',
        memo: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';

    const body: any = {
      name: formData.name,
      businessNumber: formData.businessNumber || null,
      contactName: formData.contactName || null,
      contactEmail: formData.contactEmail || null,
      contactPhone: formData.contactPhone || null,
      grade: formData.grade,
      address: formData.address || null,
      memo: formData.memo || null,
    };

    if (editingClient) {
      body.id = editingClient.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchClients();
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
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const getGradeBadge = (grade: string) => {
    const badges: Record<string, string> = {
      A: 'badge-success',
      B: 'badge-warning',
      C: 'badge-secondary',
    };
    return <span className={`badge ${badges[grade]}`}>{grade}등급</span>;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">거래처관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            거래처 등록
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="거래처명, 사업자번호, 담당자 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 등급</option>
            <option value="A">A등급</option>
            <option value="B">B등급</option>
            <option value="C">C등급</option>
          </select>
          <button type="submit" className="btn btn-secondary">검색</button>
        </form>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">거래처가 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>거래처명</th>
                  <th>사업자번호</th>
                  <th>담당자</th>
                  <th>연락처</th>
                  <th>이메일</th>
                  <th>등급</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.business_number || '-'}</td>
                    <td>{client.contact_name || '-'}</td>
                    <td>{client.contact_phone || '-'}</td>
                    <td>{client.contact_email || '-'}</td>
                    <td>{getGradeBadge(client.grade)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(client)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(client.id)}
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
                {editingClient ? '거래처 수정' : '거래처 등록'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">거래처명 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">사업자번호</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.businessNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, businessNumber: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">담당자</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">연락처</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">이메일</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">등급</label>
                <select
                  className="form-select"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grade: e.target.value as 'A' | 'B' | 'C',
                    })
                  }
                >
                  <option value="A">A등급</option>
                  <option value="B">B등급</option>
                  <option value="C">C등급</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">주소</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">메모</label>
                <textarea
                  className="form-textarea"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
