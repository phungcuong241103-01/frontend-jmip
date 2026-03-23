import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Chào bạn! Mình là JMIP Assistant. Bạn cần mình tư vấn về nghề nghiệp hay phân tích kỹ năng IT?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatWithAI(userMsg.content);
      if (data && data.reply) {
        setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, mình không thể kết nối tới máy chủ lúc này.' }]);
      }
    } catch (err) {
      console.error('Chat error', err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, có lỗi xảy ra! Hãy thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-body">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white border border-outline-variant/20 shadow-xl rounded-t-xl rounded-bl-xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <div className="flex flex-col">
              <span className="font-headline font-bold">JMIP Assistant</span>
              <span className="text-[10px] tracking-widest uppercase">NgocAI Powered</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-zinc-200 cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-l-xl rounded-br-xl'
                      : 'bg-surface-container-low text-on-surface rounded-r-xl rounded-bl-xl'
                  } shadow-sm whitespace-pre-wrap`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low text-on-surface p-3 rounded-r-xl rounded-bl-xl text-sm italic shadow-sm">
                  Đang phân tích...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-outline-variant/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 bg-surface-container-low px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary rounded-md"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-md disabled:bg-zinc-300 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
