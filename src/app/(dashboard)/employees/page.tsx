'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  position: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  departments?: { name: string };
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    departmentId: '',
    position: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
  });

  const pageSize = 10;

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [page, search]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees?page=${page}&pageSize=${pageSize}&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeId: employee.employee_id,
        name: employee.name,
        email: employee.email,
        password: '',
        departmentId: '',
        position: employee.position || '',
        role: employee.role,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        departmentId: '',
        position: '',
        role: 'staff',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      password: '',
      departmentId: '',
      position: '',
      role: 'staff',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingEmployee ? '/api/employees' : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';

    const body: any = {
      name: formData.name,
      email: formData.email,
      departmentId: formData.departmentId || null,
      position: formData.position || null,
      role: formData.role,
    };

    if (editingEmployee) {
      body.id = editingEmployee.id;
    } else {
      body.employeeId = formData.employeeId;
      body.password = formData.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        fetchEmployees();
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
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEmployees();
      } else {
        const data = await res.json();
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'badge-danger',
      manager: 'badge-warning',
      staff: 'badge-secondary',
    };
    return <span className={`badge ${badges[role]}`}>{role}</span>;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge-success',
      inactive: 'badge-secondary',
    };
    return <span className={`badge ${badges[status]}`}>{status}</span>;
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">사원관리</h2>
          <button className="btn btn-primary" onClick={() => openModal()}>
            사원 등록
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="사원명, 사원아이디, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">검색</button>
        </form>

        {loading ? (
          <div className="empty-state">로딩 중...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">사원이 없습니다.</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>사원아이디</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>부서</th>
                  <th>직책</th>
                  <th>권한</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.departments?.name || '-'}</td>
                    <td>{emp.position || '-'}</td>
                    <td>{getRoleBadge(emp.role)}</td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => openModal(emp)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(emp.id)}
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
                {editingEmployee ? '사원 수정' : '사원 등록'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">사원아이디 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  disabled={!!editingEmployee}
                  required={!editingEmployee}
                />
              </div>
              <div className="form-group">
                <label className="form-label">이름 *</label>
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
                <label className="form-label">이메일 *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              {!editingEmployee && (
                <div className="form-group">
                  <label className="form-label">비밀번호 *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">부서</label>
                <select
                  className="form-select"
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                >
                  <option value="">선택하세요</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">직책</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">권한</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'manager' | 'staff',
                    })
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
