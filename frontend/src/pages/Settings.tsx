import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { getUserSettings, updateUserSettings } from '../services/api';

interface UserSettings {
  speechRate: number;
  autoPlay: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  notifications: boolean;
  showTranslation: boolean;
  theme: 'light' | 'dark' | 'blue';
  avatarType: string;
  soundEffects: boolean;
  voiceType: string;
  lessonDuration: 'short' | 'medium' | 'long';
  parentEmail?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  
  const [settings, setSettings] = useState<UserSettings>({
    speechRate: 1,
    autoPlay: true,
    difficulty: 'medium',
    notifications: true,
    showTranslation: true,
    theme: 'light',
    avatarType: 'default',
    soundEffects: true,
    voiceType: 'female',
    lessonDuration: 'medium'
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('general');

  useEffect(() => {
    // 로그인 상태 확인
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const loadUserSettings = async () => {
      setIsLoading(true);
      try {
        const userSettings = await getUserSettings(user.id);
        setSettings(userSettings);
      } catch (error) {
        console.error('설정 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user, isAuthenticated, navigate]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateUserSettings(user.id, settings);
      setSaveMessage('설정이 저장되었습니다.');
      
      // 3초 후 메시지 제거
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setSaveMessage('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'range') {
      setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* 설정 헤더 */}
      <div className="bg-white shadow">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-gray-500">애플리케이션 설정을 조정하세요</p>
        </div>
      </div>
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 설정 메뉴 */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow p-4">
              <nav className="space-y-1">
                {['general', 'speech', 'appearance', 'account'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`block w-full text-left px-4 py-2 rounded ${
                      activeSection === section
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section === 'general' && '일반 설정'}
                    {section === 'speech' && '음성 및 발음 설정'}
                    {section === 'appearance' && '화면 설정'}
                    {section === 'account' && '계정 설정'}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* 설정 내용 */}
          <div className="md:w-3/4">
            <div className="bg-white rounded-lg shadow p-6">
              {/* 일반 설정 */}
              {activeSection === 'general' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">일반 설정</h2>
                  
                  <div className="space-y-6">
                    {/* 난이도 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">학습 난이도</label>
                      <select
                        name="difficulty"
                        value={settings.difficulty}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      >
                        <option value="easy">쉬움 - 초보자용 (1-2학년)</option>
                        <option value="medium">보통 - 중급자용 (3-4학년)</option>
                        <option value="hard">어려움 - 고급자용 (5-6학년)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        학습 난이도에 따라 대화 내용과 질문의 복잡도가 조절됩니다.
                      </p>
                    </div>
                    
                    {/* 레슨 시간 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">레슨 시간</label>
                      <select
                        name="lessonDuration"
                        value={settings.lessonDuration}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      >
                        <option value="short">짧게 (약 5분)</option>
                        <option value="medium">보통 (약 10분)</option>
                        <option value="long">길게 (약 15분)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        한 번의 레슨에서 다룰 대화의 양을 조절합니다.
                      </p>
                    </div>
                    
                    {/* 자동 재생 설정 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoPlay"
                        name="autoPlay"
                        checked={settings.autoPlay}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="autoPlay" className="ml-2">
                        선생님 음성 자동 재생
                      </label>
                    </div>
                    
                    {/* 번역 표시 설정 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showTranslation"
                        name="showTranslation"
                        checked={settings.showTranslation}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="showTranslation" className="ml-2">
                        한국어 번역 표시하기
                      </label>
                    </div>
                    
                    {/* 알림 설정 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifications"
                        name="notifications"
                        checked={settings.notifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="notifications" className="ml-2">
                        학습 알림 활성화
                      </label>
                    </div>
                    
                    {/* 효과음 설정 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="soundEffects"
                        name="soundEffects"
                        checked={settings.soundEffects}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="soundEffects" className="ml-2">
                        효과음 활성화
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 음성 및 발음 설정 */}
              {activeSection === 'speech' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">음성 및 발음 설정</h2>
                  
                  <div className="space-y-6">
                    {/* 말하기 속도 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">
                        기본 말하기 속도: {settings.speechRate}x
                      </label>
                      <input
                        type="range"
                        name="speechRate"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={settings.speechRate}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>느리게 (0.5x)</span>
                        <span>보통 (1.0x)</span>
                        <span>빠르게 (1.5x)</span>
                      </div>
                    </div>
                    
                    {/* 음성 종류 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">선생님 목소리 종류</label>
                      <select
                        name="voiceType"
                        value={settings.voiceType}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      >
                        <option value="female">여성 목소리</option>
                        <option value="male">남성 목소리</option>
                        <option value="child">아이 목소리</option>
                        <option value="robot">로봇 목소리</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        선생님의 목소리 종류를 선택합니다.
                      </p>
                    </div>
                    
                    {/* 발음 감지 민감도 설정 (미래 기능) */}
                    <div>
                      <label className="block mb-2 font-medium">발음 감지 민감도</label>
                      <select
                        name="pronunciationSensitivity"
                        className="w-full p-2 border rounded"
                        disabled
                      >
                        <option value="high">높음 (엄격한 평가)</option>
                        <option value="medium" selected>중간 (권장)</option>
                        <option value="low">낮음 (관대한 평가)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        준비 중인 기능입니다. 곧 사용 가능해질 예정입니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 화면 설정 */}
              {activeSection === 'appearance' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">화면 설정</h2>
                  
                  <div className="space-y-6">
                    {/* 테마 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">앱 테마</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['light', 'dark', 'blue'].map((theme) => (
                          <div 
                            key={theme}
                            className={`
                              cursor-pointer border-2 rounded-lg p-4 text-center
                              ${settings.theme === theme ? 'border-blue-500' : 'border-gray-200'}
                              ${theme === 'light' ? 'bg-white text-black' : ''}
                              ${theme === 'dark' ? 'bg-gray-800 text-white' : ''}
                              ${theme === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                            `}
                            onClick={() => setSettings(prev => ({ ...prev, theme }))}
                          >
                            {theme === 'light' && '밝은 테마'}
                            {theme === 'dark' && '어두운 테마'}
                            {theme === 'blue' && '파란색 테마'}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 아바타 선택 */}
                    <div>
                      <label className="block mb-2 font-medium">선생님 아바타</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['default', 'robot', 'animal', 'cartoon'].map((avatar) => (
                          <div 
                            key={avatar}
                            className={`
                              cursor-pointer border-2 rounded-lg p-2 text-center
                              ${settings.avatarType === avatar ? 'border-blue-500' : 'border-gray-200'}
                            `}
                            onClick={() => setSettings(prev => ({ ...prev, avatarType: avatar }))}
                          >
                            <div className="h-16 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                              {/* 아바타 미리보기 (실제론 이미지가 들어갈 위치) */}
                              <span className="text-sm text-gray-500">{avatar}</span>
                            </div>
                            <span className="text-xs">
                              {avatar === 'default' && '기본 선생님'}
                              {avatar === 'robot' && '로봇 선생님'}
                              {avatar === 'animal' && '동물 선생님'}
                              {avatar === 'cartoon' && '만화 선생님'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 글꼴 크기 설정 (미래 기능) */}
                    <div>
                      <label className="block mb-2 font-medium">글꼴 크기</label>
                      <select
                        name="fontSize"
                        className="w-full p-2 border rounded"
                        disabled
                      >
                        <option value="small">작게</option>
                        <option value="medium" selected>보통</option>
                        <option value="large">크게</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        준비 중인 기능입니다. 곧 사용 가능해질 예정입니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 계정 설정 */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">계정 설정</h2>
                  
                  <div className="space-y-6">
                    {/* 사용자 정보 */}
                    <div>
                      <label className="block mb-2 font-medium">사용자 정보</label>
                      <div className="flex items-center p-4 bg-gray-50 rounded">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          {user?.name.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 학부모 이메일 설정 */}
                    <div>
                      <label className="block mb-2 font-medium">학부모 이메일</label>
                      <input
                        type="email"
                        name="parentEmail"
                        value={settings.parentEmail || ''}
                        onChange={handleChange}
                        placeholder="학부모님 이메일 주소"
                        className="w-full p-2 border rounded"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        학습 보고서와 알림을 받을 학부모님의 이메일 주소를 입력하세요.
                      </p>
                    </div>
                    
                    {/* 비밀번호 변경 */}
                    <div>
                      <button 
                        className="text-blue-600 hover:underline font-medium"
                        onClick={() => navigate('/change-password')}
                      >
                        비밀번호 변경하기
                      </button>
                    </div>
                    
                    {/* 로그아웃 */}
                    <div>
                      <button 
                        className="text-red-600 hover:underline font-medium"
                        onClick={logout}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 하단 저장 버튼 */}
              <div className="mt-8 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    {saveMessage && (
                      <p className={`text-sm ${saveMessage.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>
                        {saveMessage}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-blue-500 text-white py-2 px-6 rounded disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '설정 저장하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;