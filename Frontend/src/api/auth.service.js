import httpClient from './httpClient';

const AUTH_PREFIX = '/auth';

export const authService = {
  register: async (username, password, confirmPassword, firstName, lastName, email, phoneNumber = '') => {
    return httpClient.post(`${AUTH_PREFIX}/register`, {
      username,
      password,
      confirmPassword,
      firstName,
      lastName,
      email,
      phoneNumber
    });
  },
  login: async (username, password) => {
    const res = await httpClient.post(`${AUTH_PREFIX}/login`, { username, password });
    // res expected to contain { token: '...' }
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.username);
      if (res.firstName) localStorage.setItem('firstName', res.firstName);
      if (res.lastName) localStorage.setItem('lastName', res.lastName);
      if (res.email) localStorage.setItem('email', res.email);
    }
    return res;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
  },
  getToken: () => localStorage.getItem('token'),
  verifyEmail: async (token) => {
    return httpClient.get(`${AUTH_PREFIX}/verify-email?token=${token}`);
  },
  forgotPassword: async (email) => {
    return httpClient.post(`${AUTH_PREFIX}/forgot-password`, { email });
  },
  resetPassword: async (email, resetCode, newPassword, confirmPassword) => {
    return httpClient.post(`${AUTH_PREFIX}/reset-password?email=${email}`, {
      resetCode,
      newPassword,
      confirmPassword
    });
  },
  forgotUsername: async (email) => {
    return httpClient.post(`${AUTH_PREFIX}/forgot-username`, { email });
  },
  updateProfile: async (profileData) => {
    return httpClient.put(`${AUTH_PREFIX}/profile`, profileData);
  }
};

export default authService;
