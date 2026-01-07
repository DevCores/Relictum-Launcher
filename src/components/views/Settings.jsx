import React, { useState } from 'react';
import { Trash2, ChevronDown, FolderOpen, X } from 'lucide-react';
import styles from './Settings.module.css';
import { themes } from '../../config/themes';
import { useLocalization } from '../../i18n/LocalizationContext';

/**
 * Settings Component
 * Manages application preferences including launcher behavior, 
 * theming, and installation paths.
 */
const Settings = ({
  activeGame,
  autoCloseLauncher,
  toggleAutoClose,
  playMusicOnStartup,
  togglePlayMusicOnStartup,
  clearCacheOnLaunch,
  toggleClearCache,
  handleCleanCacheNow,
  currentTheme,
  setCurrentTheme,
  enableNotifications,
  toggleNotifications,
  enableSoundEffects,
  toggleSoundEffects,
  defaultDownloadPath,
  handleSetDefaultPath,
  handleClearDefaultPath
}) => {
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const { t } = useLocalization();

  return (
    <div className={styles.settingsView}>
      <h2>{t('settings.title')}</h2>

      
      <div className={styles.settingsSection}>
        <h3>{t('settings.game')}</h3>
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.autoCloseLauncher')}</span>
            <span className={styles.toggleDesc}>{t('settings.autoCloseLauncher')}</span>
          </div>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={autoCloseLauncher}
              onChange={toggleAutoClose}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.playMusicOnStartup')}</span>
            <span className={styles.toggleDesc}>{t('settings.playMusicOnStartup')}</span>
          </div>
          <label className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              checked={playMusicOnStartup}
              onChange={togglePlayMusicOnStartup}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        <div className={styles.toggleRow}>
           <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.clearCacheOnLaunch')}</span>
            <span className={styles.toggleDesc}>{t('settings.clearCacheOnLaunch')}</span>
           </div>
           <div className={styles.cacheControlRow}>
               <button 
                   className={styles.cleanCacheBtn} 
                   onClick={handleCleanCacheNow}
                   title={`Clear cache for ${activeGame ? activeGame.shortName : 'Game'}`}
                   disabled={!activeGame}
               >
                   <Trash2 size={14} /> {t('settings.cleanNow')}
               </button>
               <label className={styles.toggleSwitch}>
                   <input 
                       type="checkbox" 
                       checked={clearCacheOnLaunch}
                       onChange={toggleClearCache}
                   />
                   <span className={styles.slider}></span>
               </label>
           </div>
         </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.theme')}</span>
            <span className={styles.toggleDesc}>{t('settings.theme')}</span>
          </div>
          <div className={styles.themeSelectorContainer}>
            <div 
              className={styles.themeSelectorTrigger}
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            >
              <div className={styles.themeSelectorLabel}>
                <span className={styles.themeColorPreview} style={{background: themes[currentTheme]?.colors['--primary-gold']}}></span>
                {themes[currentTheme]?.name}
              </div>
              <ChevronDown size={16} style={{transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}} />
            </div>
            
            {isThemeDropdownOpen && (
              <div className={styles.themeSelectorDropdown}>
                {Object.values(themes).map(theme => (
                  <div 
                    key={theme.id} 
                    className={`${styles.themeOption} ${currentTheme === theme.id ? styles.selected : ''}`}
                    onClick={() => {
                      setCurrentTheme(theme.id);
                      setIsThemeDropdownOpen(false);
                    }}
                  >
                    <span className={styles.themeColorPreview} style={{background: theme.colors['--primary-gold']}}></span>
                    {theme.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>{t('settings.notifications')}</h3>
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.enableNotifications')}</span>
            <span className={styles.toggleDesc}>{t('settings.enableNotifications')}</span>
          </div>
          <label className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              checked={enableNotifications}
              onChange={toggleNotifications}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('settings.enableSoundEffects')}</span>
            <span className={styles.toggleDesc}>{t('settings.enableSoundEffects')}</span>
          </div>
          <label className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              checked={enableSoundEffects}
              onChange={toggleSoundEffects}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

       <div className={styles.settingsSection}>
         <h3>{t('settings.downloads')}</h3>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <div className={styles.settingTitle}>{t('settings.defaultDownloadPath')}</div>
            <div className={styles.settingDesc}>{t('settings.defaultDownloadPath')}</div>
          </div>
          <div className={styles.settingControls}>
            <div className={styles.pathDisplay} title={defaultDownloadPath || 'Ask every time'}>
              {defaultDownloadPath || 'Ask every time'}
            </div>
            <button className={styles.iconBtnSecondary} onClick={handleSetDefaultPath} title={t('settings.changePath')}>
              <FolderOpen size={16} />
            </button>
            {defaultDownloadPath && (
              <button className={styles.iconBtnSecondary} onClick={handleClearDefaultPath} title={t('settings.clearDefaultPath')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
