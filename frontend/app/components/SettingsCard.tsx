'use client';

import { ReactNode } from 'react';
import styles from './SettingsCard.module.css';

export interface SettingValue {
  label: string;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  type?: 'range' | 'select' | 'checkbox' | 'number' | 'color';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
}

interface SettingsCardProps {
  title: string;
  icon?: ReactNode;
  settings: SettingValue[];
  description?: string;
}

export default function SettingsCard({
  title,
  icon,
  settings,
  description,
}: SettingsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>

      <div className={styles.settingsContainer}>
        {settings.map((setting, idx) => (
          <div key={idx} className={styles.settingItem}>
            <label className={styles.label}>{setting.label}</label>

            {setting.type === 'range' && (
              <div className={styles.rangeContainer}>
                <input
                  type="range"
                  min={setting.min ?? 0}
                  max={setting.max ?? 100}
                  step={setting.step ?? 1}
                  value={String(setting.value)}
                  onChange={(e) => setting.onChange(parseFloat(e.target.value))}
                  className={styles.range}
                />
                <span className={styles.rangeValue}>{setting.value}</span>
              </div>
            )}

            {setting.type === 'select' && (
              <select
                value={String(setting.value)}
                onChange={(e) => setting.onChange(e.target.value)}
                className={styles.select}
              >
                {setting.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {setting.type === 'number' && (
              <input
                type="number"
                value={String(setting.value)}
                onChange={(e) => setting.onChange(parseFloat(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className={styles.input}
              />
            )}

            {setting.type === 'checkbox' && (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={Boolean(setting.value)}
                  onChange={(e) => setting.onChange(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Enabled</span>
              </label>
            )}

            {setting.type === 'color' && (
              <input
                type="color"
                value={String(setting.value)}
                onChange={(e) => setting.onChange(e.target.value)}
                className={styles.colorPicker}
              />
            )}

            {!setting.type && (
              <input
                type="text"
                value={String(setting.value)}
                onChange={(e) => setting.onChange(e.target.value)}
                className={styles.input}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
