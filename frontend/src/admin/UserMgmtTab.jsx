import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api, authHeaders } from '../api/client';

export default function UserMgmtTab() {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 감독관 목록 불러오기 함수
  const fetchSupervisors = async () => {
    try {
      const { data } = await api.get('/admin/users', { headers: authHeaders() });
      const supervisorList = data.filter(u => u.role === 'SUPERVISOR');
      setUsers(supervisorList);
    } catch (error) {
      setLoadError('감독관 목록을 불러오지 못했습니다. 다시 로그인한 뒤 시도해주세요.');
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  // 감독관 승인 처리 함수
  const handleApprove = async (userId) => {
    if (!window.confirm('해당 감독관의 가입을 승인하시겠습니까?')) return;
    try {
      await api.put(`/admin/users/${userId}/approve`, {}, { headers: authHeaders() });
      setSuccessMsg('감독관 권한이 성공적으로 승인되었습니다.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSupervisors();
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  // 🌟 감독관 권한 취소 처리 함수 추가
  const handleRevoke = async (userId) => {
    if (!window.confirm('해당 감독관의 권한을 취소하시겠습니까? (로그인 및 관제가 차단됩니다)')) return;
    try {
      await api.put(`/admin/users/${userId}/revoke`, {}, { headers: authHeaders() });
      setSuccessMsg('감독관 권한이 취소되었습니다.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSupervisors();
    } catch (error) {
      alert('권한 취소 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="card" style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}>
          <Users size={24} />
        </div>
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>감독관 가입 승인 및 권한 관리</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>회원가입한 감독관 계정을 승인하거나 부여된 권한을 취소할 수 있습니다.</p>
        </div>
      </div>

      {loadError && <div className="alert-box alert-error" style={{ marginBottom: '1rem' }}>{loadError}</div>}
      {successMsg && <div className="alert-box alert-success" style={{ marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '6px' }}>{successMsg}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '0.75rem' }}>감독관 이름</th>
              <th style={{ padding: '0.75rem' }}>이메일</th>
              <th style={{ padding: '0.75rem' }}>역할</th>
              <th style={{ padding: '0.75rem' }}>승인 상태</th>
              <th style={{ padding: '0.75rem' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  등록된 감독관이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isApproved = user.approvalStatus === 'APPROVED';
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{user.name}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        감독관
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: isApproved ? '#dcfce7' : '#fef3c7',
                          color: isApproved ? '#16a34a' : '#d97706',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {isApproved ? '승인 완료' : '승인 대기 중'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {!isApproved ? (
                        <button
                          onClick={() => handleApprove(user.id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          승인하기
                        </button>
                      ) : (
                        /* 🌟 승인 완료된 계정에는 [권한 취소] 버튼 노출 */
                        <button
                          onClick={() => handleRevoke(user.id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          권한 취소
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}