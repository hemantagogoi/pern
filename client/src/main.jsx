import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './app/store.js';
import './styles.css';

function ensureViewportMeta() {
  const existing = document.querySelector('meta[name="viewport"]');
  if (!existing) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(meta);
    return;
  }
  if (!existing.content.includes('width=device-width')) {
    existing.content = 'width=device-width, initial-scale=1.0';
  }
}

ensureViewportMeta();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position="top-right" />
    </Provider>
  </React.StrictMode>
);
