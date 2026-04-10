'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('회원가입이 완료되었습니다. 로그인해 주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        employeeId,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('사원아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 100 100"
          style={{ marginBottom: '0.75rem' }}
        >
          <defs>
            <linearGradient id="hexGradient" gradientTransform="rotate(30)">
              <stop offset="0%" stopColor="#FF6D00" />
              <stop offset="33.33%" stopColor="#FFD600" />
              <stop offset="66.67%" stopColor="#1A237E" />
              <stop offset="100%" stopColor="#FF6D00" />
            </linearGradient>
          </defs>
          <polygon
            points="50,0 100,25 100,75 50,100 0,75 0,25"
            fill="url(#hexGradient)"
            stroke="none"
          />
          <polygon
            points="50,12 87.5,31 87.5,69 50,88 12.5,69 12.5,31"
            fill="rgba(255,255,255,0.15)"
            stroke="none"
          />
        </svg>
        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>
          TaxAI Admin
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            사원아이디
          </label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
        </div>
        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#ccc' : '#000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
        계정이 없으신가요?{' '}
        <Link href="/register" style={{ color: '#000', fontWeight: '500' }}>
          회원가입
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Suspense fallback={<div style={{ color: '#666' }}>로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
