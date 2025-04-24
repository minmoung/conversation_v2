import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Slider, Typography, Box, Stack, Tooltip } from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff, 
  Mic, 
  MicOff, 
  Speed, 
  SkipNext, 
  SkipPrevious, 
  Replay 
} from '@mui/icons-material';
import { useLesson } from '../../contexts/LessonContext';

interface AudioControlsProps {
  audioUrl?: string;
  onRecordingComplete?: (blob: Blob) => void;
  allowRecording?: boolean;
  allowPlayback?: boolean;
  showSpeedControls?: boolean;
  showVolumeControls?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  audioUrl,
  onRecordingComplete,
  allowRecording = true,
  allowPlayback = true,
  showSpeedControls = true,
  showVolumeControls = true,
  onPlaybackStart,
  onPlaybackEnd
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { speechSpeed, setSpeechSpeed } = useLesson();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 컴포넌트 마운트 시 오디오 요소 생성
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
          setIsLoading(false);
        }
      };
      audioRef.current.onended = handlePlaybackEnd;
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      // 재생 속도 설정
      switch (speechSpeed) {
        case 'very-slow':
          if (audioRef.current) audioRef.current.playbackRate = 0.6;
          break;
        case 'slow':
          if (audioRef.current) audioRef.current.playbackRate = 0.8;
          break;
        case 'normal':
          if (audioRef.current) audioRef.current.playbackRate = 1.0;
          break;
        case 'fast':
          if (audioRef.current) audioRef.current.playbackRate = 1.25;
          break;
        case 'very-fast':
          if (audioRef.current) audioRef.current.playbackRate = 1.5;
          break;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (isRecording) {
        stopRecording();
      }
    };
  }, [audioUrl, speechSpeed]);

  // 재생/일시정지 처리
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (onPlaybackStart) onPlaybackStart();
        })
        .catch(error => {
          console.error('Audio playback failed:', error);
        });
    }
  };

  // 재생 종료 처리
  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onPlaybackEnd) onPlaybackEnd();
  };

  // 음소거 토글
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    
    if (isMuted) {
      audioRef.current.volume = volume;
    }
  };

  // 볼륨 조절
  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    
    if (!audioRef.current) return;
    
    audioRef.current.volume = value;
    setVolume(value);
    
    if (value === 0) {
      setIsMuted(true);
      audioRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  // 재생 위치 조절
  const handleTimeChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  // 재생 속도 조절
  const handleSpeedChange = (speed: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast') => {
    setSpeechSpeed(speed);
    
    if (!audioRef.current) return;
    
    switch (speed) {
      case 'very-slow':
        audioRef.current.playbackRate = 0.6;
        break;
      case 'slow':
        audioRef.current.playbackRate = 0.8;
        break;
      case 'normal':
        audioRef.current.playbackRate = 1.0;
        break;
      case 'fast':
        audioRef.current.playbackRate = 1.25;
        break;
      case 'very-fast':
        audioRef.current.playbackRate = 1.5;
        break;
    }
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        
        // 스트림 트랙 정리
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 녹음 토글
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 시간 포맷팅 (초 -> MM:SS)
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 처음부터 다시 재생
  const restartPlayback = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        if (onPlaybackStart) onPlaybackStart();
      })
      .catch(error => {
        console.error('Audio restart failed:', error);
      });
  };

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      {/* 재생 컨트롤 */}
      {allowPlayback && (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <IconButton 
              onClick={restartPlayback} 
              disabled={!audioUrl || isLoading}
              size="small"
            >
              <Replay fontSize="small" />
            </IconButton>
            
            <IconButton 
              onClick={togglePlayback} 
              disabled={!audioUrl || isLoading}
              color={isPlaying ? "primary" : "default"}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            {showVolumeControls && (
              <>
                <IconButton onClick={toggleMute}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                
                <Slider
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.1}
                  aria-label="Volume"
                  sx={{ width: 100 }}
                />
              </>
            )}
          </Stack>
          
          {/* 재생 시간 표시 및 시크바 */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            
            <Slider
              value={currentTime}
              onChange={handleTimeChange}
              min={0}
              max={duration || 1}
              step={0.1}
              disabled={!audioUrl || isLoading}
              aria-label="Time"
              sx={{ mx: 2 }}
            />
            
            <Typography variant="caption" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Stack>
        </>
      )}
      
      {/* 속도 컨트롤 */}
      {showSpeedControls && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <Speed fontSize="small" />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['very-slow', 'slow', 'normal', 'fast', 'very-fast'] as const).map((speed) => (
              <Tooltip key={speed} title={`${speed.replace('-', ' ')}`}>
                <Box
                  onClick={() => handleSpeedChange(speed)}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: speechSpeed === speed ? 'primary.main' : 'background.paper',
                    color: speechSpeed === speed ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: speechSpeed === speed ? 'primary.dark' : 'action.hover',
                    },
                    fontSize: 'small',
                  }}
                >
                  {speed === 'very-slow' ? '0.6x' : 
                   speed === 'slow' ? '0.8x' : 
                   speed === 'normal' ? '1.0x' : 
                   speed === 'fast' ? '1.25x' : '1.5x'}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Stack>
      )}
      
      {/* 녹음 컨트롤 */}
      {allowRecording && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <IconButton
            onClick={toggleRecording}
            color={isRecording ? "error" : "primary"}
            sx={{ border: isRecording ? '2px solid #f44336' : '2px solid #e0e0e0', p: 1.5 }}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </IconButton>
          
          {isRecording && (
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="error" sx={{ animation: 'pulse 1.5s infinite' }}>
                Recording...
              </Typography>
              <Box
                component="span"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  ml: 1,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};