import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLocalization } from '../../i18n/LocalizationContext';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const { currentLanguage, changeLanguage, availableLanguages, t } = useLocalization();
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 120; // Approximate height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Always show above for better UX in sidebar
      setDropdownPosition({
        bottom: window.innerHeight - rect.top + 4,
        left: Math.max(10, rect.right - 140),
        top: 'auto'
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLanguageName = (lang) => {
    switch (lang) {
      case 'en': return 'English';
      case 'ru': return 'Русский';
      default: return lang.toUpperCase();
    }
  };

  const getLanguageFlag = (lang) => {
    switch (lang) {
      case 'en': return '🇺🇸';
      case 'ru': return '🇷🇺';
      default: return '🌍';
    }
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className={styles.languageSwitcher}>
      <button
        ref={buttonRef}
        className={styles.languageButton}
        onClick={() => setIsOpen(!isOpen)}
        title={t('common.changeLanguage')}
      >
        <Globe size={16} />
        <span className={styles.languageText}>{getLanguageName(currentLanguage)}</span>
        <ChevronDown size={12} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            top: dropdownPosition.top,
            bottom: dropdownPosition.bottom,
            left: dropdownPosition.left
          }}
        >
          {availableLanguages.map(lang => (
            <button
              key={lang}
              className={`${styles.dropdownItem} ${currentLanguage === lang ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              <span className={styles.flag}>{getLanguageFlag(lang)}</span>
              <span className={styles.langName}>{getLanguageName(lang)}</span>
              {currentLanguage === lang && <span className={styles.checkmark}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
