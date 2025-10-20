import React from 'react';

const Header = ({ onProfileClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <i className="fas fa-shield-alt"></i>
            <h1>Military Spouse Job Connect</h1>
          </div>
          <p className="tagline">Your AI-powered career companion</p>
        </div>
        <div className="header-actions">
          <button className="profile-button" onClick={onProfileClick}>
            <i className="fas fa-user-circle"></i>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
