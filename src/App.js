import React, { useMemo, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import SuggestionBubbles from './components/SuggestionBubbles';
import RagChatWidget from './components/RagChatWidget';
import ProfileModal from './components/ProfileModal';
import SourceUploader from './components/SourceUploader';

function App() {
  const chatRef = useRef(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const ragApiUrl = process.env.REACT_APP_RAG_API_URL || 'http://localhost:8000/api/chat';
  const sourcesApiUrl = useMemo(() => {
    if (!ragApiUrl) return '';
    try {
      const parsed = new URL(ragApiUrl);
      parsed.pathname = parsed.pathname.replace(/\/chat\/?$/, '/sources');
      return parsed.toString();
    } catch {
      return ragApiUrl.replace(/\/chat\/?$/, '/sources');
    }
  }, [ragApiUrl]);
  const sourcesUploadApiUrl = useMemo(() => {
    if (!sourcesApiUrl) return '';
    try {
      const parsed = new URL(sourcesApiUrl);
      parsed.pathname = parsed.pathname.replace(/\/sources\/?$/, '/sources/upload');
      return parsed.toString();
    } catch {
      return sourcesApiUrl.replace(/\/sources\/?$/, '/sources/upload');
    }
  }, [sourcesApiUrl]);
  const initialChatMessages = useMemo(
    () => [
      {
        type: 'bot',
        content: 'Hello! How can I assist you today?'
      }
    ],
    []
  );

  const handleSuggestionClick = (suggestion) => {
    const suggestionMessages = {
      'practice-interview': 'I have an interview coming up. Can you help me practice interview questions for my target role?',
      'find-resources': 'What resources or programs support military spouses who want to grow their careers?',
      'connect-mentors': 'Can you connect me with mentors in industries that value military spouse experience?',
      'resume-help': 'Could you review my resume and suggest improvements for roles that accommodate frequent relocations?',
      'job-search': 'I am looking for job opportunities. Please recommend roles that fit a flexible or remote lifestyle.',
      'career-advice': 'I want career advice tailored for military spouses. Where should I start?'
    };

    const prompt = suggestionMessages[suggestion] || 'I would like support with my career journey as a military spouse.';
    if (chatRef.current?.sendMessage) {
      chatRef.current.sendMessage(prompt);
    }
  };

  // const handleFilterChange = (filterType, value) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     [filterType]: value
  //   }));
  // };

  return (
    <div className="app">
      <Header onProfileClick={() => setShowProfileModal(true)} />
      <main className="main-content">
        <SourceUploader apiUrl={sourcesApiUrl} uploadApiUrl={sourcesUploadApiUrl} />
        <SuggestionBubbles onSuggestionClick={handleSuggestionClick} />
        <RagChatWidget
          ref={chatRef}
          apiUrl={ragApiUrl}
          placeholder="Share your career goals, questions, or challenges..."
          initialMessages={initialChatMessages}
        />
      </main>
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default App;
