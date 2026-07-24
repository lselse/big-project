import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, ArrowRight, ShieldAlert, Mail, UserPlus, LogIn, Building2 } from 'lucide-react';
import { api, apiErrorMessage } from '../api/client';
import { persistSession } from '../hooks/useCurrentUser';

export default function AuthPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' 또는 'SIGNUP'

  // 로그인 권한 ('MANAGER' 또는 'ADMIN'). 회원가입은 MANAGER(관리자)만 가능하다.
  const [role, setRole] = useState('MANAGER');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    orgName: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => setFormData({ username: '', email: '', password: '', passwordConfirm: '', orgName: '' });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    setSuccessMsg('');
    resetForm();
  };

  const handleModeSelect = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    resetForm();
    if (mode === 'SIGNUP') setRole('MANAGER');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'SIGNUP') {
      if (!formData.username || !formData.email || !formData.password || !formData.passwordConfirm || !formData.orgName) {
        setErrorMsg('모든 항목을 빠짐없이 입력해주세요.'); return;
      }
      if (formData.password !== formData.passwordConfirm) {
        setErrorMsg('비밀번호가 일치하지 않습니다.'); return;
      }
      try {
        await api.post('/auth/signup', {
          name: formData.username,
          email: formData.email,
          password: formData.password,
          orgName: formData.orgName
        });
        setAuthMode('LOGIN');
        setFormData({ username: '', email: formData.email, password: '', passwordConfirm: '', orgName: '' });
        setSuccessMsg('관리자 가입 및 조직 승인 신청이 접수되었습니다. ADMIN의 조직 승인 후 업무 화면을 이용할 수 있습니다.');
      } catch (error) {
        setErrorMsg(apiErrorMessage(error, '회원가입 중 오류가 발생했습니다.'));
      }
      return;
    }

    if (authMode === 'LOGIN') {
      if (!formData.email.trim() || !formData.password.trim()) {
        setErrorMsg('모든 항목을 빠짐없이 입력해주세요.');
        return;
      }

      try {
        const { data } = await api.post('/auth/login', {
          email: formData.email.trim(),
          password: formData.password.trim(),
          role,
        });
        persistSession(data);

        if (role === 'ADMIN') navigate('/home?tab=ORG_APPROVAL');
        else navigate('/home?tab=' + (data.organization?.status === 'APPROVED' ? 'EXAMINEE_MGMT' : 'ORG_REQUEST'));
      } catch (error) {
        setErrorMsg(apiErrorMessage(error, '로그인 중 오류가 발생했습니다.'));
      }
    }
  };

  const getPlaceholderEmail = () => (role === 'MANAGER' ? 'manager@aivle.com' : 'admin@aivle.com');

  return (
    <div className="auth-container" style={{minHeight: 'calc(100vh - 64px)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
      <div className="auth-box" style={{maxWidth: '480px', width: '100%', padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)'}}>

        {/* 상단 로고 및 타이틀 */}
        <div className="auth-header" style={{textAlign: 'center', marginBottom: '1.75rem'}}>
          <div className="logo-icon" style={{width: 52, height: 52, backgroundColor: '#319795', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto'}}>
            <ShieldCheck color="#ffffff" size={30} />
          </div>
          <h1 style={{fontSize: '1.4rem', margin: '0 0 0.25rem 0', color: '#0f172a', fontWeight: 'bold'}}>ADMIN·관리자 포털</h1>
          <p style={{color: '#64748b', margin: 0, fontSize: '0.85rem'}}>AI 역량 평가 플랫폼 운영진 전용 로그인</p>
        </div>

        {/* 모드 전환 탭 (로그인 / 회원가입) */}
        <div className="mode-tab-container" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: '#f1f5f9', padding: '0.35rem', borderRadius: '10px'}}>
          <button
            type="button"
            className={`mode-tab-btn ${authMode === 'LOGIN' ? 'active' : ''}`}
            onClick={() => handleModeSelect('LOGIN')}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.6rem', border: 'none', borderRadius: '8px', backgroundColor: authMode === 'LOGIN' ? '#ffffff' : 'transparent', color: authMode === 'LOGIN' ? '#319795' : '#64748b', fontWeight: authMode === 'LOGIN' ? 'bold' : '500', cursor: 'pointer', boxShadow: authMode === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}
          >
            <LogIn size={16} /><span>로그인</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${authMode === 'SIGNUP' ? 'active' : ''}`}
            onClick={() => handleModeSelect('SIGNUP')}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.6rem', border: 'none', borderRadius: '8px', backgroundColor: authMode === 'SIGNUP' ? '#ffffff' : 'transparent', color: authMode === 'SIGNUP' ? '#319795' : '#64748b', fontWeight: authMode === 'SIGNUP' ? 'bold' : '500', cursor: 'pointer', boxShadow: authMode === 'SIGNUP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}
          >
            <UserPlus size={16} /><span>관리자 가입 및 조직 신청</span>
          </button>
        </div>

        {/* 권한 선택 탭 (로그인 화면에서만 노출, 회원가입은 관리자 전용) */}
        {authMode === 'LOGIN' && (
          <div className="role-tab-container" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem'}}>
            <button
              type="button"
              onClick={() => handleRoleSelect('MANAGER')}
              style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0.6rem', border: role === 'MANAGER' ? '2px solid #16a34a' : '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: role === 'MANAGER' ? '#f0fdf4' : '#ffffff', color: role === 'MANAGER' ? '#16a34a' : '#64748b', fontWeight: role === 'MANAGER' ? 'bold' : '500', fontSize: '0.85rem', cursor: 'pointer'}}
            >
              <Building2 size={18} /><span>관리자</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0.6rem', border: role === 'ADMIN' ? '2px solid #7c3aed' : '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: role === 'ADMIN' ? '#f5f3ff' : '#ffffff', color: role === 'ADMIN' ? '#7c3aed' : '#64748b', fontWeight: role === 'ADMIN' ? 'bold' : '500', fontSize: '0.85rem', cursor: 'pointer'}}
            >
              <ShieldAlert size={18} /><span>ADMIN</span>
            </button>
          </div>
        )}

        {/* 알림 메시지 */}
        {errorMsg && <div className="alert-box alert-error" style={{padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '0.85rem'}}>{errorMsg}</div>}
        {successMsg && <div className="alert-box alert-success" style={{padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '6px', fontSize: '0.85rem'}}>{successMsg}</div>}

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {authMode === 'SIGNUP' && (
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label" style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155'}}>이름 (실명)</label>
              <div className="input-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <User size={18} color="#94a3b8" style={{position: 'absolute', left: '12px'}} />
                <input type="text" name="username" placeholder="홍길동" value={formData.username} onChange={handleChange} className="form-input" style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem'}} />
              </div>
            </div>
          )}

          <div className="input-group" style={{margin: 0}}>
            <label className="input-label" style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155'}}>
              {authMode === 'SIGNUP' || role === 'MANAGER' ? '관리자 이메일' : 'ADMIN 이메일'}
            </label>
            <div className="input-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Mail size={18} color="#94a3b8" style={{position: 'absolute', left: '12px'}} />
              <input
                type="text"
                name="email"
                placeholder={authMode === 'SIGNUP' ? 'manager@aivle.com' : getPlaceholderEmail()}
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem'}}
              />
            </div>
          </div>

          {authMode === 'SIGNUP' && (
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label" style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155'}}>소속 조직명</label>
              <div className="input-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Building2 size={18} color="#94a3b8" style={{position: 'absolute', left: '12px'}} />
                <input type="text" name="orgName" placeholder="예: A대학교 컴퓨터공학과" value={formData.orgName} onChange={handleChange} className="form-input" style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem'}} />
              </div>
              <p className="text-muted" style={{fontSize: '0.78rem', margin: '0.35rem 0 0 0'}}>입력한 조직은 ADMIN 승인 후 이 계정에 배정됩니다.</p>
            </div>
          )}

          <div className="input-group" style={{margin: 0}}>
            <label className="input-label" style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155'}}>비밀번호</label>
            <div className="input-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Lock size={18} color="#94a3b8" style={{position: 'absolute', left: '12px'}} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem'}}
              />
            </div>
          </div>

          {authMode === 'SIGNUP' && (
            <div className="input-group" style={{margin: 0}}>
              <label className="input-label" style={{display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#334155'}}>비밀번호 확인</label>
              <div className="input-wrapper" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <Lock size={18} color="#94a3b8" style={{position: 'absolute', left: '12px'}} />
                <input type="password" name="passwordConfirm" placeholder="••••••••" value={formData.passwordConfirm} onChange={handleChange} className="form-input" style={{width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem'}} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.85rem',
              backgroundColor: authMode === 'SIGNUP' ? '#16a34a' : (role === 'MANAGER' ? '#16a34a' : '#7c3aed'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span>{authMode === 'LOGIN' ? `${role === 'MANAGER' ? '관리자' : 'ADMIN'} 로그인하기` : '관리자 가입 및 조직 신청하기'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center'}}>
          {authMode === 'LOGIN' ? (
            <span>조직을 새로 신청하려면 상단의 <strong>[관리자 가입 및 조직 신청]</strong> 탭을 눌러주세요.</span>
          ) : (
            <span>이미 계정이 있으신가요? 상단의 <strong>[로그인]</strong> 탭을 눌러 접속하세요.</span>
          )}
        </div>
      </div>
    </div>
  );
}
