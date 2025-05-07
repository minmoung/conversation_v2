import React, { useState } from "react";
import SpeechButton from "./SpeechButton";
import { sendMessageToAI } from '../../services/api';

const ChatBox: React.FC = () => {
  const [conversation, setConversation] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>(""); // 입력 필드 상태

  const handleSpeechResult = async (text: string) => {
    console.log("Received speech result:", text);
    
    setConversation([...conversation, `👤: ${text}`]);

    const response = await sendMessageToAI(text);
    const aiReply = response.reply;

    console.log("Received AI result:", aiReply); 
    setConversation([...conversation, `👤: ${text}`, `🤖: ${aiReply}`]);
    // playTextAsAudio(aiReply);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    handleSpeechResult(userInput); // 동일한 처리
    setUserInput(""); // 입력 필드 초기화
  };

  return (
    <div>
      <h2>AI English Chat</h2>
      <div>
        {conversation.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
      </div>

       {/* 텍스트 입력 폼 */}
       <form onSubmit={handleTextSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="AI에 전송할 말을 입력하세요!"
          style={{ width: "300px", padding: "0.5rem" }}
        />
        <button type="submit" style={{ marginLeft: "0.5rem" }}>Send</button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <SpeechButton onResult={handleSpeechResult} />
      </div>
    </div>
  );
};

export default ChatBox;