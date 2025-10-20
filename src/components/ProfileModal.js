import React, { useState } from 'react';

const ProfileModal = ({ onClose }) => {
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    location: 'San Diego, CA',
    militaryBranch: 'Navy',
    spouseRank: 'E-6',
    experience: '5-10 years',
    skills: ['Project Management', 'Customer Service', 'Administrative Support'],
    interests: ['Remote Work', 'Healthcare', 'Education'],
    availability: 'Full-time'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillAdd = (skill) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Profile saved:', profile);
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          <div className="profile-section">
            <div className="section-header">
              <h3>Personal Information</h3>
              <button 
                className="edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                className="form-input"
              />
            </div>
          </div>

          <div className="profile-section">
            <h3>Military Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Military Branch</label>
                <select
                  value={profile.militaryBranch}
                  onChange={(e) => handleInputChange('militaryBranch', e.target.value)}
                  disabled={!isEditing}
                  className="form-select"
                >
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </select>
              </div>

              <div className="form-group">
                <label>Spouse Rank</label>
                <input
                  type="text"
                  value={profile.spouseRank}
                  onChange={(e) => handleInputChange('spouseRank', e.target.value)}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Career Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Experience Level</label>
                <select
                  value={profile.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  disabled={!isEditing}
                  className="form-select"
                >
                  <option value="0-2 years">0-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div className="form-group">
                <label>Availability</label>
                <select
                  value={profile.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  disabled={!isEditing}
                  className="form-select"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Skills</label>
              <div className="skills-container">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    {isEditing && (
                      <button 
                        onClick={() => handleSkillRemove(skill)}
                        className="remove-skill"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <input
                    type="text"
                    placeholder="Add skill..."
                    className="add-skill-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSkillAdd(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && (
            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
