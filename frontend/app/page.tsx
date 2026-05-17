'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from './components/Layout';
import Auth from './components/Auth';
import SettingsCard, { SettingValue } from './components/SettingsCard';
import Preview from './components/Preview';
import AuthModal from './components/AuthModal';
import { imageService } from './services/imageService';
import { authService } from './services/authService';
import styles from './page.module.css';

const getEmailFromAuthPayload = (data: unknown): string => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const payload = data as { email?: unknown; data?: { email?: unknown } };

  if (typeof payload.email === 'string') {
    return payload.email;
  }

  if (typeof payload.data?.email === 'string') {
    return payload.data.email;
  }

  return '';
};

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Restore authentication state from localStorage on mount and whenever storage changes
  useEffect(() => {
    const restoreAuthState = () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      
      if (token) {
        setIsLoggedIn(true);
        if (email) {
          setUserEmail(email);
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
      }
    };

    // Restore on initial mount
    restoreAuthState();

    // Listen for storage changes (e.g., login/logout from another tab)
    window.addEventListener('storage', restoreAuthState);
    window.addEventListener('focus', restoreAuthState);

    return () => {
      window.removeEventListener('storage', restoreAuthState);
      window.removeEventListener('focus', restoreAuthState);
    };
  }, []);
  
  // Image ID for transformations
  const [imageId, setImageId] = useState('');

  // Resize Settings
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [resizeCrop, setResizeCrop] = useState('fill');
  const [resizeGravity, setResizeGravity] = useState('auto');
  const [resizeZoom, setResizeZoom] = useState('');

  // Rotate & Flip
  const [rotate, setRotate] = useState('');
  const [flip, setFlip] = useState('none');

  // Adjustments
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [gamma, setGamma] = useState(1);
  const [sharpen, setSharpen] = useState(0);
  const [unsharpMask, setUnsharpMask] = useState(0);

  // Filters
  const [grayscale, setGrayscale] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [negate, setNegate] = useState(false);
  const [blur, setBlur] = useState(0);
  const [pixelate, setPixelate] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [oilPaint, setOilPaint] = useState(0);
  const [cartoonify, setCartoonify] = useState(false);
  const [cartoonifyAmount, setCartoonifyAmount] = useState('');
  const [art, setArt] = useState('');

  // Watermark
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkFontFamily, setWatermarkFontFamily] = useState('Arial');
  const [watermarkFontSize, setWatermarkFontSize] = useState(40);
  const [watermarkFontColor, setWatermarkFontColor] = useState('#FFFFFF');
  const [watermarkGravity, setWatermarkGravity] = useState('south_east');
  const [watermarkX, setWatermarkX] = useState(10);
  const [watermarkY, setWatermarkY] = useState(10);
  const [watermarkOpacity, setWatermarkOpacity] = useState(60);

  // Quality/Output
  const [quality, setQuality] = useState('');
  const [dpr, setDpr] = useState('');
  const [format, setFormat] = useState('');
  const [fetchFormat, setFetchFormat] = useState('');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUserEmail('');
    setPreviewImage(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      const uploadResult = await imageService.uploadImage(file);
      setImageId(uploadResult.publicId);

      if (uploadResult.url) {
        setPreviewImage(uploadResult.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleTransform = async () => {
    if (!imageId && !previewImage) {
      alert('Please upload an image or enter a public ID');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await imageService.transformImage({
        publicId: imageId,
        width: resizeWidth,
        height: resizeHeight,
        zoom: resizeZoom,
        crop: resizeCrop,
        gravity: resizeGravity,
        rotate: rotate,
        flip: flip,
        brightness: brightness,
        contrast: contrast,
        saturation: saturation,
        hue: hue,
        vibrance: vibrance,
        gamma: gamma,
        sharpen: sharpen,
        unsharpMask: unsharpMask,
        grayscale: grayscale,
        sepia: sepia,
        negate: negate,
        blur: blur,
        pixelate: pixelate,
        vignette: vignette,
        oilPaint: oilPaint,
        cartoonify: cartoonify,
        cartoonifyAmount: cartoonifyAmount,
        art: art,
        watermarkText: watermarkText,
        watermarkFontFamily: watermarkFontFamily,
        watermarkFontSize: watermarkFontSize,
        watermarkFontColor: watermarkFontColor,
        watermarkGravity: watermarkGravity,
        watermarkX: watermarkX,
        watermarkY: watermarkY,
        watermarkOpacity: watermarkOpacity,
        quality: quality,
        dpr: dpr,
        format: format,
        fetchFormat: fetchFormat,
      });

      if (result.url) {
        setPreviewImage(result.url);
      }
    } catch (error) {
      console.error('Transform failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Settings cards configuration
  const imageIdSettings: SettingValue[] = [
    {
      label: 'Public ID',
      value: imageId,
      onChange: (val) => setImageId(val as string),
    },
  ];

  const resizeSettings: SettingValue[] = [
    {
      label: 'Width',
      value: resizeWidth,
      onChange: (val) => setResizeWidth(val as string),
      type: 'number',
    },
    {
      label: 'Height',
      value: resizeHeight,
      onChange: (val) => setResizeHeight(val as string),
      type: 'number',
    },
    {
      label: 'Zoom',
      value: resizeZoom,
      onChange: (val) => setResizeZoom(val as string),
      type: 'number',
    },
    {
      label: 'Crop',
      value: resizeCrop,
      onChange: (val) => setResizeCrop(val as string),
      type: 'select',
      options: [
        { label: 'Fill', value: 'fill' },
        { label: 'Fit', value: 'fit' },
        { label: 'Limit', value: 'limit' },
        { label: 'Pad', value: 'pad' },
        { label: 'Scale', value: 'scale' },
        { label: 'Thumb', value: 'thumb' },
      ],
    },
    {
      label: 'Gravity',
      value: resizeGravity,
      onChange: (val) => setResizeGravity(val as string),
      type: 'select',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Face', value: 'face' },
        { label: 'Faces', value: 'faces' },
        { label: 'Center', value: 'center' },
        { label: 'North', value: 'north' },
        { label: 'South', value: 'south' },
        { label: 'East', value: 'east' },
        { label: 'West', value: 'west' },
        { label: 'NE', value: 'north_east' },
        { label: 'NW', value: 'north_west' },
        { label: 'SE', value: 'south_east' },
        { label: 'SW', value: 'south_west' },
      ],
    },
  ];

  const rotateFlipSettings: SettingValue[] = [
    {
      label: 'Rotate',
      value: rotate,
      onChange: (val) => setRotate(val as string),
      type: 'number',
    },
    {
      label: 'Flip',
      value: flip,
      onChange: (val) => setFlip(val as string),
      type: 'select',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Vertical', value: 'vertical' },
        { label: 'Both', value: 'both' },
      ],
    },
  ];

  const adjustmentsSettings: SettingValue[] = [
    {
      label: 'Brightness',
      value: brightness,
      onChange: (val) => setBrightness(val as number),
      type: 'range',
      min: -100,
      max: 100,
    },
    {
      label: 'Contrast',
      value: contrast,
      onChange: (val) => setContrast(val as number),
      type: 'range',
      min: -100,
      max: 100,
    },
    {
      label: 'Saturation',
      value: saturation,
      onChange: (val) => setSaturation(val as number),
      type: 'range',
      min: -100,
      max: 100,
    },
    {
      label: 'Hue',
      value: hue,
      onChange: (val) => setHue(val as number),
      type: 'range',
      min: -180,
      max: 180,
    },
    {
      label: 'Vibrance',
      value: vibrance,
      onChange: (val) => setVibrance(val as number),
      type: 'range',
      min: -100,
      max: 100,
    },
    {
      label: 'Gamma',
      value: gamma,
      onChange: (val) => setGamma(val as number),
      type: 'range',
      min: 0,
      max: 10,
      step: 0.1,
    },
    {
      label: 'Sharpen',
      value: sharpen,
      onChange: (val) => setSharpen(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      label: 'Unsharp Mask',
      value: unsharpMask,
      onChange: (val) => setUnsharpMask(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
  ];

  const filtersSettings: SettingValue[] = [
    {
      label: 'Cartoonify Amount',
      value: cartoonifyAmount,
      onChange: (val) => setCartoonifyAmount(val as string),
      type: 'number',
    },
    {
      label: 'Art Filter',
      value: art,
      onChange: (val) => setArt(val as string),
    },
    {
      label: 'Blur',
      value: blur,
      onChange: (val) => setBlur(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      label: 'Pixelate',
      value: pixelate,
      onChange: (val) => setPixelate(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      label: 'Vignette',
      value: vignette,
      onChange: (val) => setVignette(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      label: 'Oil Paint',
      value: oilPaint,
      onChange: (val) => setOilPaint(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
    { label: 'Grayscale', value: grayscale, onChange: (val) => setGrayscale(val as boolean), type: 'checkbox' },
    { label: 'Sepia', value: sepia, onChange: (val) => setSepia(val as boolean), type: 'checkbox' },
    { label: 'Negate', value: negate, onChange: (val) => setNegate(val as boolean), type: 'checkbox' },
    { label: 'Cartoonify', value: cartoonify, onChange: (val) => setCartoonify(val as boolean), type: 'checkbox' },
  ];

  const watermarkSettings: SettingValue[] = [
    {
      label: 'Watermark Text',
      value: watermarkText,
      onChange: (val) => setWatermarkText(val as string),
    },
    {
      label: 'Font Size',
      value: watermarkFontSize,
      onChange: (val) => setWatermarkFontSize(val as number),
      type: 'number',
    },
    {
      label: 'Font Family',
      value: watermarkFontFamily,
      onChange: (val) => setWatermarkFontFamily(val as string),
      type: 'select',
      options: [
        { label: 'Arial', value: 'Arial' },
        { label: 'Courier', value: 'Courier' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Times New Roman', value: 'Times New Roman' },
        { label: 'Verdana', value: 'Verdana' },
      ],
    },
    {
      label: 'Font Color',
      value: watermarkFontColor,
      onChange: (val) => setWatermarkFontColor(val as string),
      type: 'color',
    },
    {
      label: 'X Position',
      value: watermarkX,
      onChange: (val) => setWatermarkX(val as number),
      type: 'number',
    },
    {
      label: 'Y Position',
      value: watermarkY,
      onChange: (val) => setWatermarkY(val as number),
      type: 'number',
    },
    {
      label: 'Gravity',
      value: watermarkGravity,
      onChange: (val) => setWatermarkGravity(val as string),
      type: 'select',
      options: [
        { label: 'SE', value: 'south_east' },
        { label: 'SW', value: 'south_west' },
        { label: 'NE', value: 'north_east' },
        { label: 'NW', value: 'north_west' },
        { label: 'Center', value: 'center' },
        { label: 'N', value: 'north' },
        { label: 'S', value: 'south' },
        { label: 'E', value: 'east' },
        { label: 'W', value: 'west' },
      ],
    },
    {
      label: 'Opacity',
      value: watermarkOpacity,
      onChange: (val) => setWatermarkOpacity(val as number),
      type: 'range',
      min: 0,
      max: 100,
    },
  ];

  const qualitySettings: SettingValue[] = [
    {
      label: 'Quality',
      value: quality,
      onChange: (val) => setQuality(val as string),
    },
    {
      label: 'DPR',
      value: dpr,
      onChange: (val) => setDpr(val as string),
      type: 'number',
      min: 1,
    },
    {
      label: 'Format',
      value: format,
      onChange: (val) => setFormat(val as string),
      type: 'select',
      options: [
        { label: 'None', value: '' },
        { label: 'JPG', value: 'jpg' },
        { label: 'PNG', value: 'png' },
        { label: 'WebP', value: 'webp' },
        { label: 'AVIF', value: 'avif' },
        { label: 'GIF', value: 'gif' },
        // { label: 'PDF', value: 'pdf' },
        { label: 'Auto', value: 'auto' },
      ],
    },
    {
      label: 'Fetch Format',
      value: fetchFormat,
      onChange: (val) => setFetchFormat(val as string),
      type: 'select',
      options: [
        { label: 'None', value: '' },
        { label: 'Auto', value: 'auto' },
      ],
    },
  ];

  return (
    <>
      <Layout
        topBar={
          <div className={styles.topBarContent}>
            <div className={styles.logo}>
              <h1 className={styles.appTitle}>ShutterNode</h1>
            </div>
            <div className={styles.topBarActions}>
              <Link
                className={styles.galleryLink}
                href="/my-images"
                onClick={(event) => {
                  if (!isLoggedIn) {
                    event.preventDefault();
                    setIsAuthModalOpen(true);
                    return;
                  }

                  event.preventDefault();
                  router.push('/my-images');
                }}
              >
                My Images
              </Link>
              <Auth
                isLoggedIn={isLoggedIn}
                userEmail={userEmail}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </div>
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

                {/* Image ID */}
                <SettingsCard
                  title="Image ID"
                  description="Enter public ID to transform"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  }
                  settings={imageIdSettings}
                />

                {/* Resize Settings */}
                <SettingsCard
                  title="Resize"
                  description="Adjust dimensions and crop"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" strokeWidth="2" />
                    </svg>
                  }
                  settings={resizeSettings}
                />

                {/* Rotate & Flip */}
                <SettingsCard
                  title="Rotate & Flip"
                  description="Rotation and flip options"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 4a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" strokeWidth="2" />
                    </svg>
                  }
                  settings={rotateFlipSettings}
                />

                {/* Adjustments */}
                <SettingsCard
                  title="Adjustments"
                  description="Color and tone adjustments"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" opacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10v2H2v-2a10 10 0 0110-10z" />
                    </svg>
                  }
                  settings={adjustmentsSettings}
                />

                {/* Filters */}
                <SettingsCard
                  title="Filters"
                  description="Apply visual effects"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="2" width="20" height="20" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                  settings={filtersSettings}
                />

                {/* Style/Output */}
                {/* <SettingsCard
                  title="Style & Output"
                  description="Border, background, radius"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" strokeWidth="2" />
                    </svg>
                  }
                  settings={styleSettings}
                /> */}

                {/* Watermark */}
                <SettingsCard
                  title="Watermark"
                  description="Add text watermark"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 12a8 8 0 018-8v8H4z" strokeWidth="2" />
                      <path d="M20 12a8 8 0 01-8 8v-8h8z" strokeWidth="2" />
                    </svg>
                  }
                  settings={watermarkSettings}
                />

                {/* Quality/Output */}
                <SettingsCard
                  title="Quality & Format"
                  description="Output settings"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v20M2 12h20" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  }
                  settings={qualitySettings}
                />

                {/* Transform Button */}
                <button
                  onClick={handleTransform}
                  disabled={isProcessing}
                  className={styles.transformButton}
                >
                  {isProcessing ? 'Transforming...' : 'Apply Transform'}
                </button>
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(data) => {
          const email = getEmailFromAuthPayload(data);
          setIsLoggedIn(true);
          setUserEmail(email);
          localStorage.setItem('userEmail', email);
        }}
        onRegisterSuccess={() => {
          setIsLoggedIn(false);
          setUserEmail('');
        }}
      />
    </>
  );
}
