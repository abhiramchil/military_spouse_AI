import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({
  messages,
  onSendMessage,
  isTyping = false,
  error = null,
  onRetry,
  inputDisabled = false,
  placeholder = 'Ask me about job opportunities, career advice, or anything else...',
  maxLength = 500
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || inputDisabled) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}-message`}>
            <div className="message-avatar">
              {message.type === 'bot' ? (
                <i className="fas fa-robot"></i>
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.content}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot-message typing-message">
            <div className="message-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <div className="chat-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="chat-input"
            maxLength={maxLength}
            disabled={inputDisabled}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!inputValue.trim() || inputDisabled}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        {error && (
          <div className="chat-error">
            <span>{error}</span>
            {onRetry && (
              <button type="button" onClick={onRetry} className="retry-button">
                Retry
              </button>
            )}
          </div>
        )}
        <div className="input-footer">
          <span className="char-count">{inputValue.length}/{maxLength}</span>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
