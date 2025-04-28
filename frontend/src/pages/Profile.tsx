import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLessonContext } from '../contexts/LessonContext';
//import { getUserProfile, getUserStats, getUserBadges } from '../services/api';
import { authApi } from '../services/api';
import ProgressBar from '../components/ProgressBar/ProgressBar';

interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  points: number;
  joinDate: string;
}

interface UserStats {
  lessonsCompleted: number;
  totalLessonsAvailable: number;
  practiceMinutes: number;
  streakDays: number;
  averageScore: number;
  vocabularyLearned: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedDate?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { completedLessons } = useLessonContext();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'badges' | 'achievements'>('progress');

  useEffect(() => {
    // 로그인 상태 확인
    alert("123");
    console.log("============================== user",user);
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // 사용자 프로필 정보 로드
        const profileData = await authApi.getUserProfile();
        setProfile(profileData.data);

        // 사용자 통계 정보 로드
        const statsData = await authApi.getUserStats(user.id);
        setStats(statsData.data);

        // 사용자 배지 정보 로드
        const badgesData = await authApi.getUserBadges(user.id);
        setBadges(badgesData.data);
      } catch (error) {
        console.error('프로필 데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, isAuthenticated, navigate]);

  // 경험치 바 계산 함수
  const calculateExpProgress = () => {
    if (!profile) return 0;
    
    // 레벨별 필요 경험치: level * 100
    const requiredExp = profile.level * 100;
    const currentExp = profile.points % requiredExp;
    
    return (currentExp / requiredExp) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">프로필을 불러올 수 없습니다.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* 프로필 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
        <div className="container mx-auto flex flex-col items-center md:flex-row md:items-start">
          {/* 아바타 */}
          <div className="relative mb-4 md:mb-0 md:mr-6">
            <div className="w-24 h-24 rounded-full bg-white p-1">
              <img 
                src={profile.avatar || '/assets/images/default-avatar.png'} 
                alt="사용자 아바타" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-blue-900 rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {profile.level}
            </div>
          </div>
          
          {/* 사용자 정보 */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="opacity-80">가입일: {new Date(profile.joinDate).toLocaleDateString()}</p>
            
            {/* 레벨 진행도 */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>레벨 {profile.level}</span>
                <span>레벨 {profile.level + 1}</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full w-full">
                <div 
                  className="h-full bg-yellow-400 rounded-full" 
                  style={{ width: `${calculateExpProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0 text-center">
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-xl font-bold">{stats.lessonsCompleted}</p>
              <p className="text-xs">완료한 레슨</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-xl font-bold">{stats.streakDays}일</p>
              <p className="text-xs">연속 학습</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="bg-white shadow">
        <div className="container mx-auto">
          <div className="flex">
            <button 
              className={`py-4 px-6 font-medium ${activeTab === 'progress' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('progress')}
            >
              학습 진행도
            </button>
            <button 
              className={`py-4 px-6 font-medium ${activeTab === 'badges' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('badges')}
            >
              배지
            </button>
            <button 
              className={`py-4 px-6 font-medium ${activeTab === 'achievements' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('achievements')}
            >
              통계
            </button>
          </div>
        </div>
      </div>
      
      {/* 탭 콘텐츠 */}
      <div className="container mx-auto py-6 px-4">
        {/* 학습 진행도 탭 */}
        {activeTab === 'progress' && (
          <div>
            <h2 className="text-xl font-bold mb-4">내 학습 진행도</h2>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">전체 진행률</span>
                <span className="text-sm text-gray-500">{stats.lessonsCompleted}/{stats.totalLessonsAvailable} 레슨</span>
              </div>
              <ProgressBar 
                current={stats.lessonsCompleted} 
                total={stats.totalLessonsAvailable} 
                completed={[]}
              />
            </div>
            
            <h3 className="font-bold mb-2">최근 학습 활동</h3>
            <div className="space-y-4">
              {/* {completedLessons.slice(0, 5).map((lesson, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{lesson.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(lesson.completedAt).toLocaleDateString()} · 점수: {lesson.score}/100
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    className="text-sm bg-blue-100 text-blue-600 py-1 px-3 rounded-full"
                  >
                    복습하기
                  </button>
                </div>
              ))} */}
              
              {completedLessons.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">아직 완료한 레슨이 없어요.</p>
                  <button 
                    onClick={() => navigate('/lessons')}
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
                  >
                    첫 레슨 시작하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 배지 탭 */}
        {activeTab === 'badges' && (
          <div>
            <h2 className="text-xl font-bold mb-4">내가 획득한 배지</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.filter(badge => badge.earnedDate).map((badge) => (
                <div key={badge.id} className="bg-white rounded-lg shadow p-4 text-center">
                  <img 
                    src={badge.iconUrl} 
                    alt={badge.name} 
                    className="w-16 h-16 mx-auto mb-2"
                  />
                  <h3 className="font-medium">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  <p className="text-xs text-blue-500 mt-2">
                    획득일: {badge.earnedDate ? new Date(badge.earnedDate).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
              
              {badges.filter(badge => badge.earnedDate).length === 0 && (
                <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">아직 획득한 배지가 없어요.</p>
                  <p className="text-sm text-gray-400 mt-2">더 많은 레슨을 완료하면 배지를 얻을 수 있어요!</p>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold mt-8 mb-4">도전 가능한 배지</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.filter(badge => !badge.earnedDate).map((badge) => (
                <div key={badge.id} className="bg-white rounded-lg shadow p-4 text-center opacity-70">
                  <img 
                    src={badge.iconUrl} 
                    alt={badge.name} 
                    className="w-16 h-16 mx-auto mb-2 grayscale"
                  />
                  <h3 className="font-medium">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 통계 탭 */}
        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-xl font-bold mb-4">나의 학습 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-500 mb-2">총 학습 시간</h3>
                <p className="text-3xl font-bold">{stats.practiceMinutes} 분</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-500 mb-2">총 학습한 단어</h3>
                <p className="text-3xl font-bold">{stats.vocabularyLearned} 개</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-500 mb-2">평균 점수</h3>
                <p className="text-3xl font-bold">{stats.averageScore} 점</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-500 mb-2">최고 연속 학습</h3>
                <p className="text-3xl font-bold">{stats.streakDays} 일</p>
              </div>
            </div>
            
            <h3 className="font-bold mt-8 mb-4">월간 학습 현황</h3>
            <div className="bg-white rounded-lg shadow p-6">
              {/* 여기에 월간 학습 현황 차트를 추가할 수 있습니다 */}
              <div className="h-40 flex items-center justify-center">
                <p className="text-gray-400">월간 학습 데이터 차트가 표시됩니다</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;