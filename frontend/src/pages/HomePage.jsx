import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Shield, Clock, ArrowRight, CheckCircle2, BookOpen, Bell, HelpCircle,
  User, Award, Cpu, Code2, Eye, Lock, Monitor
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 🌟 주소가 '/' 이면 강제로 'HOME' 화면 렌더링, 그 외엔 파라미터 값 사용
  const activeTab = location.pathname === '/' ? 'HOME' : (searchParams.get('tab') || 'EXAM');

  const userRole = location.state?.role || localStorage.getItem('userRole') || 'GUEST';

  // [평가 탭] 데이터
  const examList = [
    {
      id: 1,
      title: '2026년 하반기 신입 공채 AI 리터러시 역량 평가',
      category: '정규 평가 (Python / Java / C++)',
      duration: '90분',
      questions: '총 4문제',
      status: 'AVAILABLE',
      date: '2026.07.20 ~ 2026.07.22',
    }
  ];

  // [연습문제 탭] 데이터
  const practiceList = [
    {
      id: 1,
      title: '[모의 테스트] 실시간 AI 감독 및 사전 장비 점검 체험',
      category: '환경 점검 및 WebRTC 통신 테스트',
      duration: '30분',
      desc: '실제 시험 응시 전에 웹캠, 화면 공유, QR 모바일 연동이 잘 되는지 미리 연습해보세요.',
    }
  ];

  // 공지사항 및 FAQ 데이터
  const notices = [
    { id: 1, title: '[필수 독려] 시험 응시 전 PC 크롬(Chrome) 브라우저 최신 업데이트 안내', date: '2026.07.18' },
    { id: 2, title: '보조 카메라(스마트폰) 거치 각도 및 QR 연결 가이드라인', date: '2026.07.15' }
  ];
  const faqs = [
    { q: 'Q. 휴대폰 보조 카메라는 어떻게 거치해야 하나요?', a: 'A. 응시자의 측면 45도 각도에서 PC 모니터 화면과 응시자의 얼굴, 손이 모두 화면에 들어오도록 거치해야 합니다.' },
    { q: 'Q. 듀얼 모니터를 사용해도 되나요?', a: 'A. 불가능합니다. 사전 장비 점검 시 듀얼 모니터가 감지되면 시험 입장이 제한됩니다.' }
  ];

  const handleProtectedAction = (actionRoute) => {
    if (userRole === 'GUEST') {
      const confirmLogin = window.confirm('🔒 이 기능은 로그인이 필요합니다.\n로그인/회원가입 페이지로 이동하시겠습니까?');
      if (confirmLogin) navigate('/login');
    } else {
      navigate(actionRoute);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)', padding: '2.5rem 0' }}>
      <main className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>

        {userRole !== 'ADMIN' && (
          <>
            {/* =========================================================
                🌟 1. [기본 HOME 화면] 플랫폼 메인 안내 그래픽 섹션 (주소가 '/'일때 나옴)
                ========================================================= */}
            {activeTab === 'HOME' && (
              <section className="hero-section" style={{ display: 'flex', alignItems: 'center', gap: '3rem', padding: '1rem 0', flexWrap: 'wrap' }}>
                <div className="hero-left" style={{ flex: '1 1 500px' }}>
                  <div className="hero-badge" style={{ marginBottom: '1.5rem' }}>
                    <Cpu size={16} color="#2563EB" style={{ marginRight: '6px' }} />
                    <span>🚀 KT AIVLE School 9기 빅프로젝트 23조</span>
                  </div>

                  <h1 className="main-title" style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '1.5rem' }}>
                    AI 리터러시<br />
                    <span className="text-primary">역량 테스트</span> 플랫폼
                  </h1>

                  <p className="sub-description" style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                    실시간 지능형 감시 시스템과 자동 채점 파이프라인으로<br />
                    공정하고 신뢰할 수 있는 개발자 역량 평가를 제공합니다.
                  </p>

                  <div className="button-group" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button className="btn-primary" onClick={() => navigate('/home?tab=EXAM')}>
                      <span>테스트 응시하기</span>
                      <ArrowRight size={18} />
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/home?tab=CHECK')}>
                      장비 점검하기
                    </button>
                  </div>

                  <div className="feature-list" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#334155' }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span>WebRTC 삼중 카메라 실시간 감독</span>
                    </div>
                    <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#334155' }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span>지능형 이상행동 및 객체/이어폰 감지</span>
                    </div>
                  </div>
                </div>

                <div className="hero-right" style={{ flex: '1 1 450px', position: 'relative' }}>
                  <div className="graphic-container">
                    <div className="mockup-window">
                      <div className="window-header" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#1e293b' }}>
                        <div className="dot-group" style={{ display: 'flex', gap: '6px' }}>
                          <span className="dot dot-red"></span>
                          <span className="dot dot-yellow"></span>
                          <span className="dot dot-green"></span>
                        </div>
                        <span className="window-title" style={{ marginLeft: '12px', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>Live AI Supervision & Coding</span>
                      </div>

                      <div className="window-body" style={{ padding: '1.5rem', backgroundColor: '#0f172a' }}>
                        <div className="code-area" style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.7', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}>
                          <div className="code-line" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code2 size={16} color="#3b82f6" />
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>function</span>
                            <span>evaluateAiLiteracy() &#123;</span>
                          </div>
                          <div className="code-line text-muted" style={{ paddingLeft: '1.5rem', color: '#64748b' }}>// AI 화상 감독 및 부정행위 방지 시스템 실시간 작동중</div>
                          <div className="code-line text-purple" style={{ paddingLeft: '1.5rem', color: '#a78bfa' }}>const status = "AI_MONITORING_ACTIVE";</div>
                          <div className="code-line text-green" style={{ paddingLeft: '1.5rem', color: '#4ade80' }}>return analyzeCodeQuality();</div>
                          <div>&#125;</div>
                        </div>

                        <div className="status-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                          <div className="mini-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                            <Eye size={20} color="#3b82f6" />
                            <div>
                              <div className="mini-title" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f8fafc' }}>시선 추적 상태</div>
                              <div className="mini-sub" style={{ fontSize: '0.7rem', color: '#4ade80' }}>정상 (화면 응시)</div>
                            </div>
                          </div>
                          <div className="mini-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                            <Lock size={20} color="#10b981" />
                            <div>
                              <div className="mini-title" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f8fafc' }}>주변 환경 보안</div>
                              <div className="mini-sub" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>외부 음성/기기 차단</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="floating-badge" style={{ position: 'absolute', bottom: '-15px', right: '10px', backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
                      <div className="floating-icon" style={{ padding: '0.5rem', backgroundColor: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                        <Monitor size={24} color="#ffffff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#0f172a' }}>실시간 AI 웹캠 분석</div>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>이상 행동 미감지</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* --- 타이틀 분기 바 (HOME이 아닐 때만 렌더링) --- */}
            {activeTab !== 'HOME' && (
              <div className="content-header-bar" style={{ marginBottom: '2rem' }}>
                <h1 className="content-main-title" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>
                  {activeTab === 'EXAM' && '평가 목록'}
                  {activeTab === 'CHECK' && '사전 환경 점검 안내'}
                  {activeTab === 'PRACTICE' && '연습문제 목록'}
                  {activeTab === 'NOTICE' && '공지사항'}
                  {activeTab === 'FAQ' && '자주 묻는 질문 (FAQ)'}
                </h1>
                {userRole === 'GUEST' && (
                  <span className="badge-status alert-error" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                    ⚠️ 비회원 상태입니다. 상세 기능 이용 시 로그인이 요구됩니다.
                  </span>
                )}
              </div>
            )}

            {/* --- 2. [평가 탭] --- */}
            {activeTab === 'EXAM' && (
              <div className="cards-grid">
                {examList.map((exam) => (
                  <div key={exam.id} className="prog-card">
                    <div className="prog-card-top">
                      <span className="prog-category">{exam.category}</span>
                      <span className="badge-status badge-available">응시 가능</span>
                    </div>
                    <h2 className="prog-title">{exam.title}</h2>
                    <div className="prog-info-list">
                      <div className="prog-info-item"><Clock size={16} color="#64748b" /><span>제한 시간: {exam.duration}</span></div>
                      <div className="prog-info-item"><Award size={16} color="#64748b" /><span>문항 수: {exam.questions}</span></div>
                    </div>
                    <div className="prog-card-footer">
                      <span className="prog-date">{exam.date}</span>
                      <button className="prog-action-btn btn-blue" onClick={() => handleProtectedAction('/exam/check')}>
                        <span>시험 입장</span><ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- 3. [시험 전 점검 탭] --- */}
            {activeTab === 'CHECK' && (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <h2 className="card-title">사전 장비 및 응시 환경 점검 테스트</h2>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>실제 테스트에 참여하기 전 웹캠, 마이크, 화면 공유, 이어폰 연결 상태를 실시간 진단합니다.</p>
                <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => handleProtectedAction('/exam/check')}>
                  <span>환경 검사 시스템 구동</span><ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* --- 4. [연습문제 탭] --- */}
            {activeTab === 'PRACTICE' && (
              <div className="cards-grid">
                {practiceList.map((practice) => (
                  <div key={practice.id} className="prog-card">
                    <div className="prog-card-top">
                      <span className="prog-category">{practice.category}</span>
                    </div>
                    <h2 className="prog-title">{practice.title}</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', flex: 1 }}>{practice.desc}</p>
                    <div className="prog-card-footer">
                      <div className="prog-info-item"><Clock size={16} color="#64748b" /><span>{practice.duration}</span></div>
                      <button className="prog-action-btn btn-outline-blue" onClick={() => handleProtectedAction('/exam/check')}>
                        <span>모의 연습 시작</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- 5. [공지사항 탭] --- */}
            {activeTab === 'NOTICE' && (
              <div className="card" style={{ padding: 0 }}>
                {notices.map((n) => (
                  <div key={n.id} className="notice-row" onClick={() => alert(`[공지] ${n.title}`)}>
                    <span style={{ color: '#1e293b', fontWeight: '500' }}>{n.title}</span>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{n.date}</span>
                  </div>
                ))}
              </div>
            )}

            {/* --- 6. [FAQ 탭] --- */}
            {activeTab === 'FAQ' && (
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {faqs.map((f, idx) => (
                  <div key={idx} style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>{f.q}</div>
                    <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{f.a}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* [관리자 전용 대시보드] */}
        {userRole === 'ADMIN' && (
          <div className="cards-grid">
            <div className="card admin-card" onClick={() => navigate('/admin/dashboard')}>
              <h3>실시간 AI 화상 감독 대시보드</h3>
              <span className="admin-link">대시보드 원격 관리 &rarr;</span>
            </div>
            <div className="card admin-card" onClick={() => navigate('/admin/report')}>
              <h3>AI 종합 분석 평가 보고서 리포트</h3>
              <span className="admin-link">리포트 다운로드 &rarr;</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}