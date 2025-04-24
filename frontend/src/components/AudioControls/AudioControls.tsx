import React from 'react';

// AudioControls 인터페이스 정의
export interface AudioControlsProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

// AudioControls 컴포넌트 내보내기
export const AudioControls: React.FC<AudioControlsProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording
}) => {
  return (
    <div className="flex items-center justify-center w-full max-w-md">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
      >
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
            <rect x="6" y="6" width="8" height="8" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a2 2 0 00-2 2v6a2 2 0 104 0V4a2 2 0 00-2-2z" />
            <path d="M6 9a4 4 0 118 0v1.5c0 .83.67 1.5 1.5 1.5H16v1a5 5 0 01-10 0v-1h.5A1.5 1.5 0 008 10.5V9z" />
          </svg>
        )}
      </button>
      
      <div className="ml-4">
        <p className="text-sm font-medium">
          {isRecording ? '말하는 중... 버튼을 눌러 종료하세요.' : '버튼을 눌러 말하기 시작하세요.'}
        </p>
      </div>
    </div>
  );
};

export default AudioControls;