import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30-second timeout
});

// Interceptor for cleaner error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) throw new Error("rate_limit");
    if (error.code === 'ECONNABORTED') throw new Error("timeout");
    throw error;
  }
);

export const analyzeText = async (text, lang = 'en', signal) => {
  const response = await api.post('/api/analyze/text', { text, lang }, { signal });
  return response.data;
};

export const analyzeImage = async (imageFile, lang = 'en', signal) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('lang', lang);
  const response = await api.post('/api/analyze/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal
  });
  return response.data;
};

export const analyzeVoice = async (audioBlob, lang = 'en', signal) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('lang', lang);
  const response = await api.post('/api/analyze/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal
  });
  return response.data;
};