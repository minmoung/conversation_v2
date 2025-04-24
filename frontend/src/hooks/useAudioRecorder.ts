import { useState, useCallback } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  audioBlob: Blob | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      // 데이터 수집
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setChunks(prev => [...prev, e.data]);
        }
      };
      
      // 녹음 종료 시 Blob 생성
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setChunks([]);
        
        // 스트림 트랙 종료
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setChunks([]);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  return { isRecording, startRecording, stopRecording, audioBlob };
};