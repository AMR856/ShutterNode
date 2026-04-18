'use client';

import { useState } from 'react';
import styles from './Auth.module.css';

interface AuthProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Auth({ isLoggedIn, onLogin, onLogout }: AuthProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.authContainer}>
      <div className={styles.statusIndicator}>
        <span className={`${styles.dot} ${isLoggedIn ? styles.active : styles.inactive}`}></span>
        <span className={styles.statusText}>
          {isLoggedIn ? 'Logged In' : 'Logged Out'}
        </span>
      </div>

      <button
        className={styles.authButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 10a3 3 0 100-6 3 3 0 000 6zm0 1.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM10 14c-5.523 0-9 2.239-9 4v1c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-1c0-1.761-3.477-4-9-4z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <p className={styles.userLabel}>
              {isLoggedIn ? 'user@example.com' : 'Not authenticated'}
            </p>
          </div>

          <button
            className={`${styles.dropdownButton} ${isLoggedIn ? styles.danger : styles.success}`}
            onClick={() => {
              if (isLoggedIn) {
                onLogout();
              } else {
                onLogin();
              }
              setIsOpen(false);
            }}
          >
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>
      )}
    </div>
  );
}
