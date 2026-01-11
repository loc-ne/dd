'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react';
import { API_URL } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatRoomProps {
  roomId: number;
  roomTitle: string;
}

export default function AiChatRoom({ roomId, roomTitle }: AiChatRoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Fetch initial suggestions khi mở chat
  useEffect(() => {
    async function fetchInitialSuggestions() {
      if (!isOpen) return;
      try {
        const res = await fetch(`${API_URL}/ai/suggestions?roomId=${roomId}`);
        const data = await res.json();
        if (data.success && data.data.suggestedQuestions) {
          setSuggestedQuestions(data.data.suggestedQuestions);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestedQuestions([
          'Tổng chi phí hàng tháng?',
          'Phòng có tiện ích gì?',
          'Đánh giá phòng thế nào?',
          'Khu vực có an toàn không?',
        ]);
      }
    }
    fetchInitialSuggestions();
  }, [isOpen, roomId]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Xin chào! 👋 Mình là trợ lý AI của **PhongTro.vn**.\n\nMình đang hỗ trợ bạn về phòng **"${roomTitle}"**.\n\nBạn có thể hỏi mình về:\n- 💰 Giá cả và tổng chi phí hàng tháng\n- 🏠 Tiện ích và quy định phòng\n- ⭐ Đánh giá từ người thuê cũ\n- 👤 Thông tin chủ nhà\n- 📍 Khu vực xung quanh\n\nHãy hỏi mình bất cứ điều gì!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, roomTitle]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          roomId: roomId,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.success
          ? data.data.message
          : 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Cập nhật suggested questions từ response
      if (data.success && data.data.suggestedQuestions?.length > 0) {
        setSuggestedQuestions(data.data.suggestedQuestions);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Xin lỗi, không thể kết nối đến server. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Đã xóa lịch sử chat! \n\nMình vẫn đang hỗ trợ về phòng **"${roomTitle}"**. Hãy hỏi mình bất cứ điều gì!`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  // Sử dụng suggestedQuestions từ API (dynamic)
  const quickQuestions = suggestedQuestions.length > 0 
    ? suggestedQuestions 
    : ['Tổng chi phí hàng tháng?', 'Phòng có tiện ích gì?', 'Đánh giá phòng thế nào?', 'Khu vực có an toàn không?'];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <Sparkles className="w-5 h-5" />
        <span>Hỏi AI về phòng này</span>
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Trợ lý AI</h3>
            <p className="text-xs text-indigo-100 truncate max-w-[180px]">
              {roomTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Xóa lịch sử chat"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                }`}
            >
              {message.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-white" />
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-md'
                }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 text-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-gray-500">Đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions - Hiển thị gợi ý động từ API */}
      {quickQuestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-500 mb-2">💡 Gợi ý câu hỏi:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(question);
                  inputRef.current?.focus();
                }}
                className="text-xs px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-full transition-all border border-indigo-100 hover:border-indigo-200 hover:shadow-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi..."
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-20"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
