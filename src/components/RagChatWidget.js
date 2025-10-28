import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import ChatInterface from './ChatInterface';

const generateId = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeMessage = (message, fallbackType = 'system') => ({
  id: message.id ? message.id : generateId(),
  type: message.type ? message.type : fallbackType,
  content: message.content ? message.content : '',
  timestamp: message.timestamp ? message.timestamp : new Date().toISOString()
});

const RagChatWidget = forwardRef(
  (
    {
      apiUrl,
      initialMessages = [],
      placeholder,
      maxLength
    },
    ref
  ) => {
    const [messages, setMessages] = useState(
      initialMessages.map((msg) => normalizeMessage(msg, 'bot'))
    );
    const [isLoading, setIsLoading] = useState(false);
    const messagesRef = useRef(messages);

    const updateMessages = (next) => {
      messagesRef.current = next;
      setMessages(next);
    };

    const sendMessage = async (rawText) => {
      const trimmed = rawText.trim();
      if (!trimmed || !apiUrl) return;

      const userMessage = normalizeMessage({ type: 'user', content: trimmed }, 'user');
      updateMessages([...messagesRef.current, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed })
        });

        if (!response.ok) return;

        const data = await response.json();
        const replyText = typeof data === 'string' ? data : data?.reply || '';

        if (!replyText.trim()) return;

        const botMessage = normalizeMessage({ type: 'bot', content: replyText }, 'bot');
        updateMessages([...messagesRef.current, botMessage]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        sendMessage,
        resetConversation: () => updateMessages(initialMessages.map((msg) => normalizeMessage(msg, 'bot'))),
        getMessages: () => messagesRef.current
      }),
      [initialMessages]
    );

    return (
      <ChatInterface
        messages={messages}
        onSendMessage={sendMessage}
        isTyping={isLoading}
        inputDisabled={isLoading}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    );
  }
);

export default RagChatWidget;
