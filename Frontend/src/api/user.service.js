// User Service - API calls related to user operations
import httpClient from './httpClient';

export const userService = {
  getUser: (id) => httpClient.get(`/users/${id}`),
  getAllUsers: () => httpClient.get('/users'),
  createUser: (userData) => httpClient.post('/users', userData),
  updateUser: (id, userData) => httpClient.put(`/users/${id}`, userData),
  deleteUser: (id) => httpClient.delete(`/users/${id}`),
};

export default userService;
