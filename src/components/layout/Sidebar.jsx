import React, { useEffect, useState } from 'react';
import { Home, Layers, Plus, Settings, Info, AlertTriangle, Music, Download } from 'lucide-react';
import { games } from '../../config/games';
import azerothLogo from '../../assets/azeroth_legacy_logo.png';
import styles from './Sidebar.module.css';
import { useLocalization } from '../../i18n/LocalizationContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Sidebar = ({
    activeView,
    setActiveView,
    activeGameId,
    setActiveGameId,
    installedGameIds,
    onManageClients,
    integrityStatus,
    isMusicPlaying,
    onToggleMusic,
    appVersion,
    updateInfo,
    customGameNames = {},
    onRenameGame
}) => {
    const { t } = useLocalization();
    const [filteredGames, setFilteredGames] = useState([]);

    // Update filtered games when installedGameIds changes
    useEffect(() => {
        const newFilteredGames = games.filter(g => installedGameIds.includes(g.id));
        setFilteredGames(newFilteredGames);
    }, [installedGameIds]);
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarLogo}>
                <div className={styles.sidebarLogoGlow}>
                    <img src={azerothLogo} alt="WoW Launcher" />
                </div>
            </div>

            <div className={styles.navMenu}>
                <div className={styles.navLabel}>MENU</div>
                <button 
                    className={`${styles.navItem} ${activeView === 'dashboard' ? styles.active : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >
                    <Home size={18} /> {t('menu.dashboard')}
                </button>
                
                <div className={styles.navLabel}>{t('menu.clients')}</div>
                {filteredGames.map(game => (
                    <div 
                        key={game.id}
                        className={`${styles.navItem} ${activeView === 'game' && activeGameId === game.id ? styles.active : ''}`}
                        onClick={() => {
                            setActiveGameId(game.id);
                            setActiveView('game');
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <Layers size={18} /> 
                        <span className={styles.gameName}>
                            {customGameNames[game.id] || t(`games.${game.id}.shortName`) || game.menuLabel || game.version}
                        </span>
                        <button 
                            className={styles.renameBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                onRenameGame(game.id, customGameNames[game.id] || t(`games.${game.id}.shortName`) || game.menuLabel || game.version);
                            }}
                            title="Rename"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                ))}
                
                <button 
                    className={`${styles.navItem} ${styles.manageGamesBtn}`}
                    onClick={onManageClients}
                >
                    <Plus size={14} /> {t('menu.manageClientsBtn')}
                </button>

                <div className={styles.navLabel}>{t('menu.downloads')}</div>
                <button
                    className={`${styles.navItem} ${activeView === 'downloads' ? styles.active : ''}`}
                    onClick={() => setActiveView('downloads')}
                >
                    <Download size={18} /> {t('menu.downloadsBtn')}
                </button>

                <div className={styles.navLabel}>TOOLS</div>
                <button
                    className={`${styles.navItem} ${activeView === 'settings' ? styles.active : ''}`}
                    onClick={() => setActiveView('settings')}
                >
                    <Settings size={18} /> {t('menu.settings')}
                </button>
                <button 
                    className={`${styles.navItem} ${activeView === 'about' ? styles.active : ''}`}
                    onClick={() => setActiveView('about')}
                >
                    <Info size={18} /> {t('menu.about')}
                    {integrityStatus === 'danger' && <AlertTriangle size={14} color="#ef4444" className={styles.dangerIcon} />}
                </button>
            </div>

            <div className={styles.sidebarFooter}>
                <div className={styles.bottomControls}>
                    <button className={styles.musicToggle} onClick={onToggleMusic} title={t('menu.toggleMusic')}>
                        {isMusicPlaying ? <Music size={16} className="animate-pulse" /> : <Music size={16} />}
                    </button>
                    <LanguageSwitcher />
                </div>
                <div className={styles.versionInfo}>
                    <span className={styles.versionText}>v{appVersion}</span>
                    {updateInfo && updateInfo.updateAvailable && (
                        <a href={updateInfo.url} target="_blank" rel="noreferrer" className={styles.updateBadge} title={t('menu.updateAvailable')}>
                            <Download size={12} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
