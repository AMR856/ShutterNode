'use client';

import { ReactNode } from 'react';
import styles from './Preview.module.css';

interface PreviewProps {
  title?: string;
  children?: ReactNode;
  imageUrl?: string;
  loading?: boolean;
  error?: string;
}

export default function Preview({
  title = 'Preview',
  children,
  imageUrl,
  loading = false,
  error,
}: PreviewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.info}>
          {loading && <span className={styles.badge}>Processing...</span>}
          {error && <span className={`${styles.badge} ${styles.error}`}>Error</span>}
          {!loading && !error && imageUrl && (
            <span className={`${styles.badge} ${styles.success}`}>Ready</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Processing your image...</p>
          </div>
        )}

        {imageUrl && !loading && !error && (
          <div className={styles.imageContainer}>
            <img src={imageUrl} alt="Processed result" className={styles.image} />
          </div>
        )}

        {!imageUrl && !loading && !error && (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <path d="M21 15l-5-5L5 21"></path>
            </svg>
            <p>No preview available</p>
            <small>Upload an image to see the preview</small>
          </div>
        )}

        {children}
      </div>

      {imageUrl && !loading && (
        <div className={styles.actions}>
          <button className={styles.button}>Download</button>
          <button className={styles.button}>Share</button>
        </div>
      )}
    </div>
  );
}
