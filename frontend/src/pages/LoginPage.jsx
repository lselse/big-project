import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 💡 버튼 활성화 여부 확인 (공백 제외)
  const isFormValid =
    (formData.username || '').trim() !== '' &&
    (formData.password || '').trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault(); // 기본 폼 제출(새로고침) 완벽 차단

    const currentUsername = (formData.username || '').trim();
    const currentPassword = (formData.password || '').trim();

    // 💡 엔터키를 누르거나 브라우저 강제 제출이 일어나도 여기서 무조건 차단됩니다.
    if (currentUsername === '' || currentPassword === '') {
      setErrorMessage('수험 번호(아이디)와 비밀번호를 모두 입력해주세요.');
      return; // 🚨 여기서 함수가 종료되므로 절대 navigate('/check')가 실행되지 않습니다.
    }

    setErrorMessage(''); // 에러 메시지 초기화
    console.log('로그인 시도:', { username: currentUsername, password: currentPassword });

    // 정상적으로 값이 있을 때만 이동
    navigate('/check');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            AI 리터러시 역량 테스트 플랫폼
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            공정한 비대면 코딩 평가를 위한 안전한 접속 화면입니다.
          </p>
        </div>

        {/* 💡 noValidate 추가: 브라우저 기본 검증 무시하고 커스텀 검증(handleSubmit)만 실행 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 text-center font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수험 번호 (이메일 / 아이디)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                  placeholder="예: applicant@aivle.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="off"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`group relative flex w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-md transition-all ${
                isFormValid
                  ? 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
                  : 'bg-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              로그인 및 본인 확인 시작
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}