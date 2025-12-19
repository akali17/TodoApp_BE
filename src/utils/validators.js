// Input validation utilities

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  if (!password || password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true };
};

const validateUsername = (username) => {
  // At least 3 characters, alphanumeric and underscores only
  if (!username || username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" };
  }
  if (username.length > 30) {
    return { valid: false, message: "Username must be less than 30 characters" };
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers and underscores" };
  }
  return { valid: true };
};

const sanitizeError = (error) => {
  // Don't expose internal error messages in production
  if (process.env.NODE_ENV === 'production') {
    // Log the real error for debugging
    console.error('Error:', error);
    
    // Return generic message
    if (error.name === 'ValidationError') {
      return 'Validation error';
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return 'Duplicate entry';
    }
    return 'Internal server error';
  }
  
  // In development, return the actual error
  return error.message;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeError,
};
