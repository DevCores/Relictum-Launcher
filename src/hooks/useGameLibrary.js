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
        const installed = [];

        for (const game of games) {
            const gamePath = gamePaths[game.id];
            let isInstalled = false;

            if (gamePath) {
                // If we have a saved path, verify the game is actually installed there
                try {
                    const integrityCheck = await ipcRenderer.invoke('check-client-integrity', {
                        gamePath,
                        clientId: game.id
                    });

                    // Game is installed if files exist (valid, incomplete, or corrupted)
                    if (integrityCheck.status !== 'missing') {
                        isInstalled = true;
                    } else {
                        // Path exists but game is missing - remove invalid path
                        const newPaths = { ...gamePaths };
                        delete newPaths[game.id];
                        setGamePaths(newPaths);
                        localStorage.setItem('warmane_game_paths', JSON.stringify(newPaths));
                    }
                } catch (error) {
                    console.error(`Failed to check integrity for ${game.id}:`, error);
                    // If integrity check fails, assume game is not properly installed
                    isInstalled = false;
                }
            } else {
                // If no saved path, try to auto-detect installation
                try {
                    const integrityCheck = await ipcRenderer.invoke('check-client-integrity', {
                        gamePath: null, // Will trigger auto-detection
                        clientId: game.id
                    });

                    if (integrityCheck.status !== 'missing') {
                        isInstalled = true;
                        // Save the auto-detected path
                        if (integrityCheck.installPath) {
                            savePath(game.id, integrityCheck.installPath);
                        }
                    }
                } catch (error) {
                    // Auto-detection failed, game not found
                    isInstalled = false;
                }
            }

            if (isInstalled) {
                installed.push(game.id);
            }
        }

        // Add manually installed games (for demo/downloaded clients)
        manuallyInstalledGameIds.forEach(gameId => {
            if (!installed.includes(gameId)) {
                installed.push(gameId);
            }
        });

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
        console.log('Adding manually installed game:', gameId);
        if (!manuallyInstalledGameIds.includes(gameId)) {
            const newManuallyInstalled = [...manuallyInstalledGameIds, gameId];
            setManuallyInstalledGameIds(newManuallyInstalled);
            localStorage.setItem('warmane_manually_installed_games', JSON.stringify(newManuallyInstalled));
            checkInstalledGames();
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
