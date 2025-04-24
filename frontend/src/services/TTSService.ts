import { api } from './api';

interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  returnPhonemes?: boolean;
}

interface TTSResponse {
  audioData: ArrayBuffer;
  phonemes: string[];
}

export class TTSService {
  /**
   * Google TTS API를 사용하여 텍스트를 음성으로 변환
   */
  static async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    try {
      const { voice = 'en-US-Standard-B', rate = 1, pitch = 0, returnPhonemes = true } = options;
      
      const response = await api.post('/api/tts', {
        text,
        voice,
        rate,
        pitch,
        returnPhonemes
      }, {
        responseType: 'arraybuffer'
      });
      
      // 응답에서 음소 정보 추출
      const phonemesHeader = response.headers['x-phonemes'];
      let phonemes: string[] = [];
      
      if (phonemesHeader) {
        try {
          phonemes = JSON.parse(Buffer.from(phonemesHeader, 'base64').toString());
        } catch (err) {
          console.error('Error parsing phonemes data:', err);
        }
      }
      
      return {
        audioData: response.data,
        phonemes
      };
    } catch (error) {
      console.error('TTS synthesis error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }
  
  /**
   * 음성 속도 조절을 위한 설정값 반환
   */
  static getSpeechRateForLevel(level: 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast'): number {
    const rateMap = {
      'very-slow': 0.6,
      'slow': 0.8,
      'normal': 1.0,
      'fast': 1.25,
      'very-fast': 1.5
    };
    
    return rateMap[level];
  }
  
  /**
   * 사용 가능한 음성 목록 조회
   */
  static async getAvailableVoices() {
    try {
      const response = await api.get('/api/tts/voices');
      return response.data;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      throw new Error('Failed to fetch voice list');
    }
  }
}