import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import SuggestionBubbles from './components/SuggestionBubbles';
import ChatInterface from './components/ChatInterface';
import ProfileModal from './components/ProfileModal';

function App() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    experience: '',
    industry: ''
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI career assistant, here to help military spouses find meaningful employment opportunities. How can I assist you today?',
      timestamp: new Date()
    }
  ]);

  const handleSuggestionClick = (suggestion) => {
    const suggestionMessages = {
      'practice-interview': 'I\'d love to help you practice interview questions! What type of position are you interviewing for?',
      'find-resources': 'I can help you find resources for military spouses. Are you looking for career training, education benefits, or networking opportunities?',
      'connect-mentors': 'Connecting with mentors is a great way to advance your career. What industry or role are you interested in?',
      'resume-help': 'I can help you improve your resume! What type of position are you targeting?',
      'job-search': 'Let\'s find you some great job opportunities! What location and type of work are you looking for?',
      'career-advice': 'I\'m here to provide career guidance! What specific area would you like advice on?'
    };

    const newMessage = {
      id: messages.length + 1,
      type: 'bot',
      content: suggestionMessages[suggestion] || 'How can I help you with that?',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = (message) => {
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: 'Thank you for your message! I\'m here to help you with your career journey. How can I assist you further?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="app">
      <Header onProfileClick={() => setShowProfileModal(true)} />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      <main className="main-content">
        <SuggestionBubbles onSuggestionClick={handleSuggestionClick} />
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
        />
      </main>
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default App;
