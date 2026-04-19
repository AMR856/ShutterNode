'use client';

import { useState } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (data: any) => void;
  onRegisterSuccess?: (data: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onRegisterSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterTab, setIsRegisterTab] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(loginEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Logging in...');

    try {
      const response = await authService.login(loginEmail, loginPassword);
      toast.dismiss(loadingToast);
      toast.success('Login successful!');
      setLoginEmail('');
      setLoginPassword('');
      onClose();
      onLoginSuccess?.(response);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerEmail || !registerPassword || !registerPasswordConfirm) {
      setRegisterError('Please fill in all fields');
      return;
    }

    if (!validateEmail(registerEmail)) {
      setRegisterError('Please enter a valid email');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setRegisterError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Creating account...');

    try {
      const response = await authService.register(registerEmail, registerPassword);
      toast.dismiss(loadingToast);
      toast.success('Account created successfully!');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterPasswordConfirm('');
      setRegisterError('');
      onClose();
      onRegisterSuccess?.(response);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMessage = error.message || 'Registration failed';
      setRegisterError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${!isRegisterTab ? styles.activeTab : ''}`}
            onClick={() => {
              setIsRegisterTab(false);
              setRegisterError('');
            }}
          >
            Login
          </button>
          <button
            className={`${styles.tab} ${isRegisterTab ? styles.activeTab : ''}`}
            onClick={() => {
              setIsRegisterTab(true);
              setRegisterError('');
            }}
          >
            Register
          </button>
        </div>

        {!isRegisterTab ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <h2 className={styles.title}>Login</h2>

            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.label}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <h2 className={styles.title}>Create Account</h2>

            {registerError && (
              <div className={styles.errorMessage}>{registerError}</div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="register-email" className={styles.label}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="your@email.com"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-password" className={styles.label}>
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-password-confirm" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="register-password-confirm"
                type="password"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
