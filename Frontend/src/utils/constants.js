// Application Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
};

// Database field length limits (must match backend schema)
export const FIELD_LIMITS = {
  STORY: {
    TITLE: 500,           // Increased from 255
    DESCRIPTION: 65535,   // Increased from 500 (TEXT field)
    WRITERS: 65535,       // Increased from 500 (TEXT field)
    CONTENT: 65535,       // TEXT field limit
  },
  CHARACTER: {
    NAME: 255,            // Increased from 100
    ROLE: 255,            // Increased from 100
    DESCRIPTION: 65535,   // Increased from 1000 (TEXT field)
    ACTOR_NAME: 255,      // Increased from 100
  },
  SCENE: {
    TITLE: 1000,          // Scene title/event - max 1000 characters
    EVENT: 1000,          // Scene event - max 1000 characters  
    DESCRIPTION: 10000,   // Scene description - max 10000 characters (timelineJson is TEXT 65K shared by all scenes)
    CONTENT: 10000,       // Scene content - max 10000 characters
  },
};

// Validation helper
export const validateFieldLength = (value, limit, fieldName) => {
  if (!value) return { valid: true };
  const length = value.length;
  if (length > limit) {
    return {
      valid: false,
      message: `${fieldName} exceeds maximum length of ${limit} characters (current: ${length})`,
      exceeded: length - limit,
    };
  }
  return { valid: true, remaining: limit - length };
};

export default {
  API_BASE_URL,
  USER_ROLES,
  HTTP_METHODS,
  STORAGE_KEYS,
  FIELD_LIMITS,
  validateFieldLength,
};
