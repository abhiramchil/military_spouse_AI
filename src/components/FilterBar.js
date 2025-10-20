import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  const filterOptions = {
    location: [
      { value: '', label: 'All Locations' },
      { value: 'remote', label: 'Remote' },
      { value: 'washington-dc', label: 'Washington, DC' },
      { value: 'san-diego', label: 'San Diego, CA' },
      { value: 'norfolk', label: 'Norfolk, VA' },
      { value: 'colorado-springs', label: 'Colorado Springs, CO' },
      { value: 'other', label: 'Other' }
    ],
    jobType: [
      { value: '', label: 'All Job Types' },
      { value: 'full-time', label: 'Full-time' },
      { value: 'part-time', label: 'Part-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'internship', label: 'Internship' }
    ],
    experience: [
      { value: '', label: 'All Experience Levels' },
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior Level' },
      { value: 'executive', label: 'Executive' }
    ],
    industry: [
      { value: '', label: 'All Industries' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'education', label: 'Education' },
      { value: 'technology', label: 'Technology' },
      { value: 'finance', label: 'Finance' },
      { value: 'government', label: 'Government' },
      { value: 'nonprofit', label: 'Non-profit' },
      { value: 'retail', label: 'Retail' },
      { value: 'other', label: 'Other' }
    ]
  };

  return (
    <div className="filter-bar">
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="location-filter">Location</label>
          <select
            id="location-filter"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="filter-select"
          >
            {filterOptions.location.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="job-type-filter">Job Type</label>
          <select
            id="job-type-filter"
            value={filters.jobType}
            onChange={(e) => onFilterChange('jobType', e.target.value)}
            className="filter-select"
          >
            {filterOptions.jobType.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="experience-filter">Experience</label>
          <select
            id="experience-filter"
            value={filters.experience}
            onChange={(e) => onFilterChange('experience', e.target.value)}
            className="filter-select"
          >
            {filterOptions.experience.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="industry-filter">Industry</label>
          <select
            id="industry-filter"
            value={filters.industry}
            onChange={(e) => onFilterChange('industry', e.target.value)}
            className="filter-select"
          >
            {filterOptions.industry.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className="clear-filters-btn" onClick={() => {
          onFilterChange('location', '');
          onFilterChange('jobType', '');
          onFilterChange('experience', '');
          onFilterChange('industry', '');
        }}>
          <i className="fas fa-times"></i>
          Clear All
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
