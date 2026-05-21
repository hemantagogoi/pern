import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const api = axios.create({
  baseURL: API_BASE_URL
});

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const validationErrors = error.response?.data?.errors;
  if (validationErrors?.length) {
    return validationErrors.map((item) => `${item.path}: ${item.msg}`).join(', ');
  }

  if (error.response?.data?.message) return error.response.data.message;
  if (error.message === 'Network Error') return 'Cannot reach the server. Check your internet connection and try again.';
  return error.message || fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function downloadPaperPdf(paper) {
  const response = await api.get(`/papers/${paper.id}/pdf`, {
    responseType: 'blob'
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${paper.title || 'Question Paper'}.pdf`.replaceAll(' ', '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
