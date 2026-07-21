import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck, LogOut, LogIn, User } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 🌟 주소가 '/' 이면 'HOME' 탭 활성화, 그 외에는 탭 파라미터 값 사용
  const currentTab = location.pathname === '/' ? 'HOME' : (searchParams.get('tab') || 'HOME');
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail') || '비회원(게스트)';
  const userName = localStorage.getItem('userName') || userEmail.split('@')[0];

  const handleTabClick = (tabName) => {
    if (tabName === 'HOME') {
      navigate('/'); // 홈 탭은 깔끔하게 루트 경로로 이동
    } else {
      navigate(`/home?tab=${tabName}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    alert('로그아웃되었습니다.');
    navigate('/login');
  };

  // 🌟 핵심 수정 포인트: '/' (홈 화면)에서는 숨기지 않고 오직 '/login'에서만 탭을 숨기도록 조건 변경
  const isAuthPage = location.pathname === '/login';

  return (
    <header className="header">
      <div className="header-left-group">
        {/* 로고 영역 */}
        <div className="logo-area" onClick={() => navigate('/')}>
          <div className="logo-icon" style={{ width: 34, height: 34 }}>
            <ShieldCheck color="#ffffff" size={20} />
          </div>
          <span className="logo-title">AI 리터러시 역량 테스트 플랫폼</span>
        </div>

        {/* 🌟 로그인 페이지가 아닐 때만 네비게이션 탭 항상 표시 */}
        {!isAuthPage && (
          <nav className="header-nav">
            <button
              className={`header-tab-btn ${currentTab === 'HOME' ? 'active' : ''}`}
              onClick={() => handleTabClick('HOME')}
            >
              홈
            </button>

            <button
              className={`header-tab-btn ${currentTab === 'EXAM' ? 'active' : ''}`}
              onClick={() => handleTabClick('EXAM')}
            >
              평가
            </button>

            <button
              className={`header-tab-btn ${currentTab === 'CHECK' ? 'active' : ''}`}
              onClick={() => handleTabClick('CHECK')}
            >
              시험 점검
            </button>

            <button
              className={`header-tab-btn ${currentTab === 'PRACTICE' ? 'active' : ''}`}
              onClick={() => handleTabClick('PRACTICE')}
            >
              연습문제
            </button>

            <button
              className={`header-tab-btn ${currentTab === 'NOTICE' ? 'active' : ''}`}
              onClick={() => handleTabClick('NOTICE')}
            >
              공지사항
            </button>

            <button
              className={`header-tab-btn ${currentTab === 'FAQ' ? 'active' : ''}`}
              onClick={() => handleTabClick('FAQ')}
            >
              FAQ
            </button>
          </nav>
        )}
      </div>

      {/* 🌟 로그인/로그아웃 버튼 등 우측 영역도 항상 표시 */}
      <div className="nav-right">
        {userRole && userRole !== 'GUEST' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="header-user-badge">
              <User size={14} color="#2563EB" />
              <span>{userName}님 ({userRole === 'APPLICANT' ? '응시자' : '관리자'})</span>
            </div>
            <button className="logout-btn header-logout-btn" onClick={handleLogout}>
              <LogOut size={15} />
              <span>로그아웃</span>
            </button>
          </div>
        ) : (
          <button className="nav-action-btn" onClick={() => navigate('/login')}>
            <LogIn size={15} style={{ marginRight: 4 }} />
            <span>로그인 / 회원가입</span>
          </button>
        )}
      </div>
    </header>
  );
}