'use client';

import { ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps {
  topBar: ReactNode;
  sidebar: ReactNode;
  preview: ReactNode;
}

export default function Layout({ topBar, sidebar, preview }: LayoutProps) {
  return (
    <div className={styles.layout}>
      {/* Top Bar */}
      <header className={styles.topBar}>{topBar}</header>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>{sidebar}</aside>

        {/* Right Preview */}
        <section className={styles.preview}>{preview}</section>
      </div>
    </div>
  );
}
