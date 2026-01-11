// API Configuration
// Centralized API URL configuration for the entire application

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to build API endpoints
export const apiEndpoint = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
