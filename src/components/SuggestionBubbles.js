import React from 'react';

const SuggestionBubbles = ({ onSuggestionClick }) => {
  const suggestions = [
    {
      id: 'practice-interview',
      icon: 'fas fa-microphone',
      title: 'Practice Interview Questions',
      description: 'Get ready for your next interview'
    },
    {
      id: 'find-resources',
      icon: 'fas fa-book',
      title: 'Find Resources',
      description: 'Career training and education'
    },
    {
      id: 'connect-mentors',
      icon: 'fas fa-users',
      title: 'Connect to Mentors',
      description: 'Build your professional network'
    },
    {
      id: 'resume-help',
      icon: 'fas fa-file-alt',
      title: 'Resume Help',
      description: 'Improve your resume'
    },
    {
      id: 'job-search',
      icon: 'fas fa-search',
      title: 'Job Search',
      description: 'Find opportunities'
    },
    {
      id: 'career-advice',
      icon: 'fas fa-lightbulb',
      title: 'Career Advice',
      description: 'Get guidance and tips'
    }
  ];

  return (
    <div className="suggestions-container">
      <div className="suggestions-header">
        <h3>Quick Actions</h3>
        <p>Choose a topic to get started</p>
      </div>
      <div className="suggestion-bubbles">
        {suggestions.map(suggestion => (
          <button
            key={suggestion.id}
            className="suggestion-bubble"
            onClick={() => onSuggestionClick(suggestion.id)}
          >
            <div className="bubble-icon">
              <i className={suggestion.icon}></i>
            </div>
            <div className="bubble-content">
              <h4>{suggestion.title}</h4>
              <p>{suggestion.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionBubbles;
