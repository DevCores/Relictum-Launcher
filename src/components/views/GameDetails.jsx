import React, { useState, useEffect } from 'react';
import { Play, Globe, FolderSearch, RefreshCw, Download } from 'lucide-react';
import styles from './GameDetails.module.css';
import ipcRenderer from '../../utils/ipc';
import { useLocalization } from '../../i18n/LocalizationContext';

const GameDetails = ({
  activeGame,
  activeGameId,
  currentPath,
  isPlaying,
  onPlay,
  onConfigureRealmlist,
  onLocateGame,
  onForgetGame
}) => {
  const { t } = useLocalization();
  const [detectedVersion, setDetectedVersion] = useState(null);
  const [isVersionCompatible, setIsVersionCompatible] = useState(true);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    const fetchVersion = async () => {
      if (currentPath) {
        try {
          const version = await ipcRenderer.invoke('get-game-version', currentPath);
          setDetectedVersion(version);
        } catch (error) {
          console.error('Failed to get game version:', error);
          setDetectedVersion(null);
        }
      } else {
        setDetectedVersion(null);
      }
    };
    fetchVersion();
  }, [currentPath]);

  useEffect(() => {
    if (currentPath && detectedVersion && activeGame.version) {
      /** Extract major version number (e.g. "3.3.5" -> "3") */
      // This handles cases like "Version 3.3" -> "3", "3.3.5a" -> "3", "v1.12" -> "1"
      const getMajor = (v) => {
        const match = v.toString().match(/(\d+)/);
        return match ? match[0] : null;
      };

      const gameMajor = getMajor(activeGame.version);
      const detectedMajor = getMajor(detectedVersion);

      // Check compatibility only if both versions were successfully parsed
      if (gameMajor && detectedMajor) {
        setIsVersionCompatible(gameMajor === detectedMajor);
      } else {
        // Default to compatible if version parsing fails to prevent blocking valid clients
        setIsVersionCompatible(true);
      }
    } else {
      setIsVersionCompatible(true);
    }
  }, [detectedVersion, activeGame, currentPath]);

  useEffect(() => {
    checkForUpdates();
  }, [currentPath, activeGameId]);

  const checkForUpdates = async () => {
    if (!currentPath) return;

    try {
      setCheckingUpdates(true);
      const result = await ipcRenderer.invoke('check-client-integrity', {
        gamePath: currentPath,
        clientId: activeGameId
      });

      // Convert integrity result to update status format
      setUpdateStatus({
        needsUpdate: result.canUpdate,
        message: result.message,
        status: result.status,
        details: result.details
      });
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateStatus({
        needsUpdate: false,
        message: `Check failed: ${error.message}`
      });
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleUpdateClient = async () => {
    try {
      const result = await ipcRenderer.invoke('update-client', {
        gamePath: currentPath,
        clientId: activeGameId
      });
      if (result.success) {
        console.log(result.message);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className={styles.gameView} data-game={activeGame.id}>
      <div className={styles.gameHeader}>
        <div 
          className={styles.gameArtWrapper}
          style={{
            filter: `drop-shadow(0 0 30px ${activeGame.id === 'tbc' ? 'rgba(40, 255, 60, 0.6)' : 'rgba(0, 140, 255, 0.6)'})`
          }}
        >
          <img 
            src={activeGame.cardArt || activeGame.icon}  
            className={styles.gameHeaderArt} 
            alt={activeGame.name} 
          />
        </div>

        <div className={styles.gameInfoActions}>
          <div className={styles.playSection}>
            {currentPath ? (
              <div className={styles.playButtonGroup}>
                <button 
                  className={`${styles.playButtonLarge} ${isPlaying ? styles.playing : ''} ${!isVersionCompatible ? styles.disabledError : ''}`}
                  onClick={onPlay}
                  disabled={isPlaying || !isVersionCompatible}
                >
                  <Play size={24} fill="currentColor" /> 
                  {!isVersionCompatible ? t('gameDetails.wrongVersion') : (isPlaying ? t('gameDetails.playing') : t('gameDetails.play'))}
                </button>
                <button 
                  className={styles.iconBtnLarge} 
                  onClick={onConfigureRealmlist}
                  title={t('gameDetails.configureRealmlist')}
                >
                  <Globe size={24} />
                </button>
              </div>
            ) : (
              <div className={styles.installSection}>
                <div className={styles.installButtons}>
                  <button className={styles.locateButton} onClick={onLocateGame}>
                    <FolderSearch size={16} /> {t('gameDetails.locateGame')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.gameDetailsGrid}>
        <div className={styles.detailCard}>
          <h4>{t('gameDetails.version')}</h4>
          <p>{activeGame.version}</p>
          {detectedVersion && (
            <p className={!isVersionCompatible ? styles.errorText : ''} style={isVersionCompatible ? { fontSize: '0.8em', color: '#888', marginTop: '4px' } : { fontSize: '0.9em', marginTop: '4px' }}>
              {t('gameDetails.detected')}: {detectedVersion} {!isVersionCompatible && `(${t('gameDetails.incompatible')})`}
            </p>
          )}
        </div>
        <div className={styles.detailCard}>
          <h4>{t('gameDetails.path')}</h4>
          <p className={styles.pathText} title={currentPath || t('gameDetails.notInstalled')}>
            {currentPath || t('gameDetails.notInstalled')}
          </p>
          {currentPath && (
            <button className={styles.removePathBtn} onClick={onForgetGame}>Remove</button>
          )}
        </div>

        {currentPath && (
          <div className={styles.detailCard}>
            <h4>{t('gameDetails.updates')}</h4>
            {checkingUpdates ? (
              <div className={styles.updateChecking}>
                <RefreshCw size={16} className={styles.spinning} />
                <span>Checking for updates...</span>
              </div>
            ) : updateStatus ? (
              <div className={styles.updateInfo}>
                <div className={`updateStatus ${updateStatus.needsUpdate ? 'needsUpdate' : 'upToDate'}`}>
                  {updateStatus.status === 'valid' ? t('gameDetails.statusValid') :
                   updateStatus.status === 'incomplete' ? t('gameDetails.statusMissing') :
                   updateStatus.status === 'corrupted' ? t('gameDetails.statusCorrupted') :
                   t('gameDetails.statusUnknown')}
                </div>
                <p className={styles.updateMessage}>{updateStatus.message}</p>

                {updateStatus.details && (
                  <div className={styles.updateDetails}>
                    {updateStatus.details.missing && updateStatus.details.missing.length > 0 && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Missing files:</span>
                        <span className={styles.detailValue}>{updateStatus.details.missing.length}</span>
                      </div>
                    )}
                    {updateStatus.details.corrupted && updateStatus.details.corrupted.length > 0 && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Corrupted files:</span>
                        <span className={styles.detailValue}>{updateStatus.details.corrupted.length}</span>
                      </div>
                    )}
                    {updateStatus.details.valid && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Valid files:</span>
                        <span className={styles.detailValue}>{updateStatus.details.valid}</span>
                      </div>
                    )}
                  </div>
                )}

                {updateStatus.needsUpdate && (
                  <button className={styles.updateBtn} onClick={handleUpdateClient}>
                    <Download size={14} />
                    {updateStatus.status === 'missing' ? t('gameDetails.downloadAndInstall') : t('gameDetails.repairClient')}
                  </button>
                )}
                <button className={styles.checkUpdateBtn} onClick={checkForUpdates}>
                  <RefreshCw size={14} />
                  {t('gameDetails.checkUpdates')}
                </button>
              </div>
            ) : (
              <p>No update information available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
