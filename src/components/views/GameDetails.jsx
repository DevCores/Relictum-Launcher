import React from 'react';
import { Play, Globe, FolderSearch } from 'lucide-react';
import styles from './GameDetails.module.css';

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
                  className={`${styles.playButtonLarge} ${isPlaying ? styles.playing : ''}`}
                  onClick={onPlay}
                  disabled={isPlaying}
                >
                  <Play size={24} fill="currentColor" /> PLAY
                </button>
                <button 
                  className={styles.iconBtnLarge} 
                  onClick={onConfigureRealmlist}
                  title="Configure Realmlist"
                >
                  <Globe size={24} />
                </button>
              </div>
            ) : (
              <div className={styles.installSection}>
                <div className={styles.installButtons}>
                  <button className={styles.locateButton} onClick={onLocateGame}>
                    <FolderSearch size={16} /> Locate Existing Installation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.gameDetailsGrid}>
        <div className={styles.detailCard}>
          <h4>Game Version</h4>
          <p>{activeGame.version}</p>
        </div>
        <div className={styles.detailCard}>
          <h4>Installation Path</h4>
          <p className={styles.pathText} title={currentPath || 'Not Installed'}>
            {currentPath || 'Not Installed'}
          </p>
          {currentPath && (
            <button className={styles.removePathBtn} onClick={onForgetGame}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
