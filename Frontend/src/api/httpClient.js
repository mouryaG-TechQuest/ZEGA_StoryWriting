// Simple HTTP client using fetch with JSON handling and auth header support
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function buildHeaders(path) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  // Avoid sending Authorization to auth endpoints
  const isAuthEndpoint = path.startsWith('/auth/');
  if (token && !isAuthEndpoint) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const parseJson = contentType.includes('application/json');
  const data = parseJson ? await res.json().catch(() => null) : await res.text().catch(() => '');
  if (!res.ok) {
    const message = (data && data.message) || `HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const httpClient = {
  get: async (url) => {
    const res = await fetch(`${BASE_URL}${url}`, { headers: buildHeaders(url) });
    return handleResponse(res);
  },
  post: async (url, data) => {
    const res = await fetch(`${BASE_URL}${url}`, { method: 'POST', headers: buildHeaders(url), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  put: async (url, data) => {
    const res = await fetch(`${BASE_URL}${url}`, { method: 'PUT', headers: buildHeaders(url), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (url) => {
    const res = await fetch(`${BASE_URL}${url}`, { method: 'DELETE', headers: buildHeaders(url) });
    return handleResponse(res);
  },
};

export default httpClient;
