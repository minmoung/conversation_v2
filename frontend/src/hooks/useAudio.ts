import { useState, useEffect, useRef } from 'react';

export const useAudio = (url: string, playbackRate: number = 1.0) => {
  const [audio] = useState(new Audio(url));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    // 오디오 소스 및 재생 속도 설정
    audio.src = url;
    audio.playbackRate = playbackRate;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.ended) {
        setIsPlaying(false);
      } else if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    
    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audio, url, playbackRate]);
  
  useEffect(() => {
    audio.playbackRate = playbackRate;
  }, [audio, playbackRate]);
  
  const play = () => {
    audio.play();
  };
  
  const pause = () => {
    audio.pause();
  };
  
  const seek = (time: number) => {
    audio.currentTime = time;
    setCurrentTime(time);
  };
  
  return {
    audio,
    isPlaying,
    currentTime,
    play,
    pause,
    seek
  };
};