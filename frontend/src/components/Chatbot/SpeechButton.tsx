import React, { useState } from "react";

interface SpeechButtonProps {
  onResult: (text: string) => void;
}

const SpeechButton: React.FC<SpeechButtonProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    setIsListening(true);
    
    // 타입 단언(Type Assertion)을 사용하여 기존에 정의된 타입을 활용
    const SpeechRecognition = window.webkitSpeechRecognition as any;
    const recognition = new SpeechRecognition();
    
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event: any) => {
      // 이벤트 객체에서 필요한 속성을 안전하게 추출
      const results = event.results;
      if (results && results[0] && results[0][0] && results[0][0].transcript) {
        const text = results[0][0].transcript;
        onResult(text);
        setIsListening(false);
      } else {
        console.error("음성 인식 결과를 찾을 수 없습니다.");
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
  };

  return (
    <button 
      onClick={startListening}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      {isListening ? "Listening..." : "🎤 Speak"}
    </button>
  );
};

export default SpeechButton;