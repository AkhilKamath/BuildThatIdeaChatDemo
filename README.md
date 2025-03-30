# Chatbot with Payment Integration

A full-stack chatbot application with usage limits and Stripe payment integration, built with FastAPI and React.

## Features
- Interactive chat interface with real-time message updates
- Message tracking with configurable daily limits
- Premium subscription via Stripe payment integration
- User authentication with JWT tokens
- Multiple chat sessions with editing capabilities
- Clean, modern UI with responsive design

## Tech Stack
### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database
- **JWT**: Token-based authentication
- **Stripe**: Payment processing
- **Bcrypt**: Password hashing

### Frontend
- **React**: UI framework with hooks
- **Axios**: HTTP client
- **Styled Components**: CSS-in-JS styling
- **Context API**: State management

## Architecture & Design Decisions

### Authentication Flow
- JWT-based authentication for secure API access
- Token stored in localStorage with proper expiration
- Protected routes and API endpoints

### Chat System
- Real-time message updates using polling
- Efficient message pagination and lazy loading
- Separate chat sessions for better organization
- Message limit tracking per time frame

### Payment Integration
- Seamless Stripe checkout flow
- Premium user status tracking
- Clear upgrade prompts when limits are reached
- Subscription management

### State Management
- React Context for global auth state
- Local state for UI components
- Optimistic updates for better UX
- Loading states to prevent race conditions

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- Stripe account

### Backend Setup
1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL=sqlite:///./chatbot.db
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

4. Start the backend server:
```bash
uvicorn main:app --reload
```
The database tables will be automatically created when you first start the server.

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Set up frontend environment variables in `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-publishable-key
```

4. Start the development server:
```bash
npm start
```

## Usage
1. Access the application at http://localhost:3000
2. Register a new account or login
3. Start chatting with the bot
4. Monitor your message usage
5. Upgrade to premium when needed

## Configuration
Key configuration options in `config.py`:
- `MESSAGE_LIMIT`: Daily message limit for free users
- `TIME_FRAME`: Time frame for message limit (e.g., "24h")
- `JWT_EXPIRATION`: Token expiration time

## Security Considerations
- Passwords are hashed using bcrypt
- JWT tokens for API authentication
- CORS configuration for API security
- Environment variables for sensitive data
- Input validation and sanitization

## Future Improvements
- WebSocket integration for real-time updates
- Message search functionality
- Rich text message formatting
- File attachment support
- User profile customization
- Analytics dashboard for usage metrics
