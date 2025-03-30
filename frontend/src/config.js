// Message rate limiting configuration
// Must match backend config.py
export const MESSAGE_LIMIT = 10;
export const TIME_FRAME = 'minute';

// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
