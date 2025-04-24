import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  completed: (string | number)[];
  showSteps?: boolean;
  color?: string;
  height?: number;
}

/**
 * 학습 진행 상황을 표시하는 프로그레스 바 컴포넌트
 * 
 * @param current 현재 진행 중인 항목 번호 또는 위치
 * @param total 전체 항목 수
 * @param completed 완료된 항목 ID 또는 인덱스 배열
 * @param showSteps 단계별 표시 여부 (기본값: true)
 * @param color 프로그레스 바 색상 (기본값: 'blue')
 * @param height 프로그레스 바 높이 (기본값: 8)
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  completed,
  showSteps = true,
  color = 'blue',
  height = 8
}) => {
  // 진행률 계산 (백분율)
  const percentage = Math.round((current / total) * 100);
  
  // 완료율 계산 (백분율)
  const completedPercentage = Math.round((completed.length / total) * 100);

  // 색상 클래스 결정
  const getColorClass = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  // 단계 생성
  const renderSteps = () => {
    if (!showSteps) return null;

    return (
      <div className="flex justify-between mt-2">
        {Array.from({ length: total }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = completed.includes(index) || completed.includes(index.toString());
          const isCurrent = current === stepNumber;

          return (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`
                  w-4 h-4 rounded-full 
                  ${isCompleted ? getColorClass() : 'bg-gray-200'} 
                  ${isCurrent ? 'ring-2 ring-blue-300' : ''}
                `}
              ></div>
              {total <= 10 && (
                <span className="text-xs text-gray-500 mt-1">{stepNumber}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 퍼센트 표시 */}
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">진행 상황</span>
        <span className="text-sm font-medium text-gray-700">{`${completedPercentage}% 완료`}</span>
      </div>
      
      {/* 프로그레스 바 */}
      <div 
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {/* 완료된 부분 */}
        <div 
          className={`${getColorClass()} h-full`} 
          style={{ width: `${completedPercentage}%` }}
        ></div>
      </div>
      
      {/* 단계 표시 */}
      {renderSteps()}
    </div>
  );
};

export default ProgressBar;