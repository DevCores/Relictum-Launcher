import { useState, useEffect } from 'react';
import { games } from '../config/games';
import ipcRenderer from '../utils/ipc';

export const useGameLibrary = () => {
    const [activeGameId, setActiveGameId] = useState('wotlk');
    const [gamePaths, setGamePaths] = useState({});
    const [visibleGameIds, setVisibleGameIds] = useState(games.map(g => g.id));
    const [installedGameIds, setInstalledGameIds] = useState([]);
    const [manuallyInstalledGameIds, setManuallyInstalledGameIds] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);

    // Load visible games
    useEffect(() => {
        try {
            const savedVisibleGames = localStorage.getItem('warmane_visible_games');
            if (savedVisibleGames) {
                const parsed = JSON.parse(savedVisibleGames);
                if (Array.isArray(parsed)) {
                    setVisibleGameIds(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load visible games settings:", e);
        }
    }, []);

    // Save visible games
    useEffect(() => {
        localStorage.setItem('warmane_visible_games', JSON.stringify(visibleGameIds));
    }, [visibleGameIds]);

    // Load game paths and manually installed games
    useEffect(() => {
        const savedPaths = localStorage.getItem('warmane_game_paths');
        if (savedPaths) {
            setGamePaths(JSON.parse(savedPaths));
        }

        const savedManuallyInstalled = localStorage.getItem('warmane_manually_installed_games');
        if (savedManuallyInstalled) {
            setManuallyInstalledGameIds(JSON.parse(savedManuallyInstalled));
        }
    }, []);

    // Check installed games when gamePaths or manuallyInstalledGameIds change
    useEffect(() => {
        console.log('useEffect triggered: gamePaths changed or manuallyInstalledGameIds changed');
        console.log('Current manuallyInstalledGameIds:', manuallyInstalledGameIds);
        checkInstalledGames();
    }, [gamePaths, manuallyInstalledGameIds]);

    // Also check on mount
    useEffect(() => {
        checkInstalledGames();
    }, []);

    // Listen for game events
    useEffect(() => {
        const handleGameClosed = () => setIsPlaying(false);
        
        // We handle launch error via promise or separate event, but global listener is good too
        const handleGameLaunchError = (event, message) => {
            setIsPlaying(false);
            // Error handling usually requires UI (Modal), so we might bubble this up or expose an error state
        };

        ipcRenderer.on('game-closed', handleGameClosed);
        ipcRenderer.on('game-launch-error', handleGameLaunchError);

        return () => {
            if (ipcRenderer.removeListener) {
                ipcRenderer.removeListener('game-closed', handleGameClosed);
                ipcRenderer.removeListener('game-launch-error', handleGameLaunchError);
            }
        };
    }, []);

    const checkInstalledGames = async () => {
        console.log('Checking installed games...');
        console.log('Current manuallyInstalledGameIds:', manuallyInstalledGameIds);

        // For downloaded clients, we simply trust manuallyInstalledGameIds
        // In production, you might want to add integrity checks here
        const installed = [...manuallyInstalledGameIds];

        console.log('Final installed games:', installed);
        setInstalledGameIds(installed);
    };

    const toggleGameVisibility = (gameId) => {
        setVisibleGameIds(prev => {
            if (!Array.isArray(prev)) return [gameId]; // Safety fallback

            if (prev.includes(gameId)) {
                if (prev.length <= 1) return prev;
                if (gameId === activeGameId) {
                    const nextGame = prev.find(id => id !== gameId);
                    if (nextGame) setActiveGameId(nextGame);
                }
                return prev.filter(id => id !== gameId);
            } else {
                return [...prev, gameId];
            }
        });
    };

    const savePath = (gameId, path) => {
        const newPaths = { ...gamePaths, [gameId]: path };
        setGamePaths(newPaths);
        localStorage.setItem('warmane_game_paths', JSON.stringify(newPaths));
    };

    const handleLocateGame = async () => {
        const path = await ipcRenderer.invoke('select-game-path');
        if (path) {
            savePath(activeGameId, path);
        }
    };

    const handleForgetGame = (gameId = activeGameId) => {
        // Remove from real paths
        const newPaths = { ...gamePaths };
        delete newPaths[gameId];
        setGamePaths(newPaths);
        localStorage.setItem('warmane_game_paths', JSON.stringify(newPaths));

        // Remove from manually installed games
        removeManuallyInstalledGame(gameId);

        // If we removed the active game, switch to another installed game
        if (gameId === activeGameId) {
            const remainingInstalled = installedGameIds.filter(id => id !== gameId);
            if (remainingInstalled.length > 0) {
                setActiveGameId(remainingInstalled[0]);
            } else {
                // If no games left, switch to first available game
                setActiveGameId(games[0]?.id || null);
            }
        }
    };

    const launchGame = async (path, { clearCache, autoClose } = {}) => {
        setIsPlaying(true);
        
        if (clearCache) {
            try {
                await ipcRenderer.invoke('clear-game-cache', path);
            } catch (e) {
                console.error("Failed to clear cache:", e);
            }
        }

        setTimeout(() => {
            ipcRenderer.send('launch-game', path);
            if (autoClose) {
                setTimeout(() => ipcRenderer.send('close-window'), 2000);
            }
        }, 1000);
    };

    const addManuallyInstalledGame = (gameId) => {
        console.log('addManuallyInstalledGame called with:', gameId);
        console.log('Current manuallyInstalledGameIds:', manuallyInstalledGameIds);
        if (!manuallyInstalledGameIds.includes(gameId)) {
            const newManuallyInstalled = [...manuallyInstalledGameIds, gameId];
            console.log('New manuallyInstalledGameIds:', newManuallyInstalled);
            setManuallyInstalledGameIds(newManuallyInstalled);
            localStorage.setItem('warmane_manually_installed_games', JSON.stringify(newManuallyInstalled));
            checkInstalledGames();
        } else {
            console.log('Game already in manuallyInstalledGameIds, skipping');
        }
    };

    const removeManuallyInstalledGame = (gameId) => {
        console.log('Removing manually installed game:', gameId);
        const newManuallyInstalled = manuallyInstalledGameIds.filter(id => id !== gameId);
        setManuallyInstalledGameIds(newManuallyInstalled);
        localStorage.setItem('warmane_manually_installed_games', JSON.stringify(newManuallyInstalled));
        checkInstalledGames();
    };

    const refreshInstalledGames = () => {
        checkInstalledGames();
    };

    return {
        activeGameId,
        setActiveGameId,
        visibleGameIds,
        installedGameIds,
        toggleGameVisibility,
        gamePaths,
        savePath,
        handleLocateGame,
        handleForgetGame,
        launchGame,
        isPlaying,
        setIsPlaying,
        checkInstalledGames,
        refreshInstalledGames,
        addManuallyInstalledGame,
        removeManuallyInstalledGame
    };
};
