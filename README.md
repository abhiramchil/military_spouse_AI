# Military Spouse Job Connect - AI Chatbot Frontend

A React.js frontend application for an AI chatbot designed to help military spouses connect with job opportunities and career resources.

## Features

- **Modern Chat Interface**: Clean, responsive chat UI with typing indicators
- **Suggestion Bubbles**: Quick action buttons for common tasks like:
  - Practice Interview Questions
  - Find Resources
  - Connect to Mentors
  - Resume Help
  - Job Search
  - Career Advice
- **Filter System**: Dropdown filters for location, job type, experience level, and industry
- **Profile Management**: Comprehensive profile editing with military-specific fields
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/
│   ├── Header.js          # App header with logo and profile button
│   ├── FilterBar.js       # Filter dropdowns for job search
│   ├── SuggestionBubbles.js # Quick action suggestion buttons
│   ├── ChatInterface.js   # Main chat component
│   └── ProfileModal.js    # Profile editing modal
├── App.js                 # Main application component
├── App.css               # Main styles
├── index.js              # React entry point
└── index.css             # Global styles
```

## Key Components

### Suggestion Bubbles
Interactive buttons that provide quick access to common chatbot functions. Each bubble triggers a specific conversation starter.

### Filter System
Located in the header area, provides dropdown selectors for:
- Location (including remote work options)
- Job Type (full-time, part-time, contract, etc.)
- Experience Level
- Industry

### Profile Modal
Comprehensive profile management including:
- Personal information
- Military-specific details (branch, spouse rank)
- Career information and skills
- Availability preferences

### Chat Interface
- Real-time message display
- Typing indicators
- Character count
- Responsive design

## Styling

The application uses a modern design with:
- Gradient backgrounds
- Glass-morphism effects
- Military-inspired color scheme (blues and purples)
- Smooth animations and transitions
- Mobile-first responsive design

## Future Enhancements

- Backend integration for real AI chatbot functionality
- User authentication
- Job posting integration
- Resume upload and parsing
- Interview scheduling
- Mentor matching system

## Technologies Used

- React.js 18
- CSS3 with modern features
- Font Awesome icons
- Google Fonts (Inter)
- Responsive design principles
