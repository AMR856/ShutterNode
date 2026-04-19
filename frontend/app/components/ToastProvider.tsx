'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        success: {
          style: {
            borderColor: 'var(--success)',
          },
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--card-bg)',
          },
        },
        error: {
          style: {
            borderColor: 'var(--error)',
          },
          iconTheme: {
            primary: 'var(--error)',
            secondary: 'var(--card-bg)',
          },
        },
        loading: {
          style: {
            borderColor: 'var(--primary)',
          },
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'var(--card-bg)',
          },
        },
      }}
    />
  );
}
