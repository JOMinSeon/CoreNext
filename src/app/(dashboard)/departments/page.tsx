'use client';

import { useEffect, useState } from 'react';

interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        description: dept.description || '',
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDept(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = '/api/departments';
    const method = editingDept ? 'PUT' : 'POST';

    const body: any = {
      name: formData.name,
      description: formData.description || null,
    };

    if (editingDept) {
      body.id = editingDept.id;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchDepartments();
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
      const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDepartments();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">부서 관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            부서 등록
          </button>
        </div>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : departments.length === 0 ? (
          <div className="empty-state">부서가 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>부서명</th>
                  <th>설명</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>{dept.description || '-'}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(dept)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(dept.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDept ? '부서 수정' : '부서 등록'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">부서명 *</label>
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
                <label className="form-label">설명</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}