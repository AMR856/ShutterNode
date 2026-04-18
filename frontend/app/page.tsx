'use client';

import { useState } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import SettingsCard, { SettingValue } from './components/SettingsCard';
import Preview from './components/Preview';
import styles from './page.module.css';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter Settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Resize Settings
  const [resizeMode, setResizeMode] = useState('fit');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);

  // Effect Settings
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);

  // Quality Settings
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState('jpeg');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPreviewImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
        // Simulate processing
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const colorSettings: SettingValue[] = [
    {
      label: 'Brightness',
      value: brightness,
      onChange: (val) => setBrightness(val as number),
      type: 'range',
      min: 0,
      max: 200,
    },
    {
      label: 'Contrast',
      value: contrast,
      onChange: (val) => setContrast(val as number),
      type: 'range',
      min: 0,
      max: 200,
    },
    {
      label: 'Saturation',
      value: saturation,
      onChange: (val) => setSaturation(val as number),
      type: 'range',
      min: 0,
      max: 200,
    },
  ];

  const effectSettings: SettingValue[] = [
    {
      label: 'Blur',
      value: blur,
      onChange: (val) => setBlur(val as number),
      type: 'range',
      min: 0,
      max: 20,
    },
    {
      label: 'Grayscale',
      value: grayscale,
      onChange: (val) => setGrayscale(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      label: 'Sepia',
      value: sepia,
      onChange: (val) => setSepia(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
  ];

  const resizeSettings: SettingValue[] = [
    {
      label: 'Mode',
      value: resizeMode,
      onChange: (val) => setResizeMode(val as string),
      type: 'select',
      options: [
        { label: 'Fit', value: 'fit' },
        { label: 'Fill', value: 'fill' },
        { label: 'Stretch', value: 'stretch' },
      ],
    },
    {
      label: 'Width',
      value: width,
      onChange: (val) => setWidth(val as number),
      type: 'number',
      min: 100,
      max: 4000,
    },
    {
      label: 'Height',
      value: height,
      onChange: (val) => setHeight(val as number),
      type: 'number',
      min: 100,
      max: 4000,
    },
  ];

  const qualitySettings: SettingValue[] = [
    {
      label: 'Format',
      value: format,
      onChange: (val) => setFormat(val as string),
      type: 'select',
      options: [
        { label: 'JPEG', value: 'jpeg' },
        { label: 'PNG', value: 'png' },
        { label: 'WebP', value: 'webp' },
      ],
    },
    {
      label: 'Quality',
      value: quality,
      onChange: (val) => setQuality(val as number),
      type: 'range',
      min: 1,
      max: 100,
    },
  ];

  return (
    <Layout
      topBar={
        <div className={styles.topBarContent}>
          <div className={styles.logo}>
            <h1 className={styles.appTitle}>Image Processor</h1>
          </div>
          <Auth
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </div>
      }
      sidebar={
        <div className={styles.sidebarContent}>
          {!isLoggedIn ? (
            <div className={styles.authPrompt}>
              <p>Please log in to access image processing features</p>
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <div className={styles.uploadCard}>
                <label htmlFor="imageInput" className={styles.uploadLabel}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M2 12h20" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Upload Image</span>
                </label>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
              </div>

              {/* Filter Settings */}
              <SettingsCard
                title="Color & Filters"
                description="Adjust colors and apply filters"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                    <path d="M12 2a10 10 0 0110 10v2H2v-2a10 10 0 0110-10z" />
                  </svg>
                }
                settings={colorSettings}
              />

              {/* Effect Settings */}
              <SettingsCard
                title="Effects"
                description="Apply visual effects"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                }
                settings={effectSettings}
              />

              {/* Resize Settings */}
              <SettingsCard
                title="Resize"
                description="Adjust image dimensions"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" strokeWidth="2" />
                  </svg>
                }
                settings={resizeSettings}
              />

              {/* Quality Settings */}
              <SettingsCard
                title="Export"
                description="Output format and quality"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M2 12h20" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                settings={qualitySettings}
              />
            </>
          )}
        </div>
      }
      preview={
        <Preview
          title="Preview"
          imageUrl={previewImage || undefined}
          loading={isProcessing}
          error={isLoggedIn && !previewImage && !isProcessing ? undefined : undefined}
        />
      }
    />
  );
}
