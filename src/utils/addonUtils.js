import localAddons from '../assets/addons.json';

export const fetchWarperiaAddons = async (ipcRenderer, activeGameId, activeGameVersion) => {
    const wotlkLocal = localAddons.map(a => ({ ...a, gameVersion: '3.3.5' }));
    
    try {
        // If WotLK, use local cache first for immediate display (simulated by returning local first if needed, 
        // but here we just return the promise result or fallback)
        
        const addons = await ipcRenderer.invoke('fetch-warperia-addons', activeGameId);
        if (addons && addons.length > 0) {
            return addons;
        } else if (activeGameId === 'wotlk') {
            // Fallback to local if fetch fails/empty for WotLK
            return wotlkLocal;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching Warperia addons:", error);
        if (activeGameId === 'wotlk') {
            return wotlkLocal;
        } else {
            return [];
        }
    }
};

export const groupAddons = (list) => {
    if (!list || list.length === 0) return [];

    let items = list.map(item => {
        if (typeof item === 'string') return { folderName: item, title: item };
        return item;
    }).sort((a, b) => a.folderName.length - b.folderName.length);

    const groups = {};
    const processed = new Set();

    // Pass 1: Parent-Child (e.g. "Recount" -> "Recount_Modes")
    items.forEach(item => {
        if (processed.has(item.folderName)) return;

        const children = items.filter(other => 
            other.folderName !== item.folderName && 
            !processed.has(other.folderName) &&
            (other.folderName.startsWith(item.folderName + '_') || other.folderName.startsWith(item.folderName + '-'))
        );

        if (children.length > 0) {
            groups[item.folderName] = { ...item, modules: children };
            processed.add(item.folderName);
            children.forEach(c => processed.add(c.folderName));
        }
    });

    // Pass 2: Shared Prefix (e.g. "DBM-Core", "DBM-PvP" -> group under "DBM-Core")
    const remaining = items.filter(i => !processed.has(i.folderName));
    
    remaining.forEach(item => {
        if (processed.has(item.folderName)) return;

        let prefix = '';
        const separators = ['-', '_'];
        
        for (const sep of separators) {
            const idx = item.folderName.indexOf(sep);
            if (idx >= 3) { // Require at least 3 chars for prefix to avoid weak matches
                const candidate = item.folderName.substring(0, idx);
                const cluster = remaining.filter(other => 
                     !processed.has(other.folderName) && 
                     (other.folderName.startsWith(candidate + '-') || other.folderName.startsWith(candidate + '_'))
                );
                
                if (cluster.length > 1) {
                     prefix = candidate;
                     break; 
                }
            }
        }

        if (prefix) {
            const cluster = remaining.filter(other => 
                !processed.has(other.folderName) && 
                (other.folderName.startsWith(prefix + '-') || other.folderName.startsWith(prefix + '_'))
            );
            
            // Find best parent (prefer "Core", "Base", "Common", or just keep shortest)
            let parent = cluster[0];
            const priorityKeywords = ['core', 'base', 'common', 'main'];
            const bestCandidate = cluster.find(c => priorityKeywords.some(k => c.folderName.toLowerCase().includes(k)));
            if (bestCandidate) parent = bestCandidate;

            const children = cluster.filter(c => c.folderName !== parent.folderName);
            groups[parent.folderName] = { ...parent, modules: children };
            
            cluster.forEach(c => processed.add(c.folderName));
        } else {
            if (!processed.has(item.folderName)) {
               groups[item.folderName] = { ...item, modules: [] };
               processed.add(item.folderName);
            }
        }
    });

    return Object.values(groups);
};

export const processAddonsForDisplay = (groupedAddonsList) => {
    return groupedAddonsList.map(addon => {
        // Manual overrides for common mismatches
        const overrides = {
            'DBM-Core': 'Deadly Boss Mods',
            'AtlasLoot': 'AtlasLoot Enhanced',
            'Recount': 'Recount',
            'Questie': 'Questie'
        };
        
        let searchTitle = addon.title;
        if (overrides[addon.title]) searchTitle = overrides[addon.title];

        // Try to find matching metadata in localAddons
        const meta = localAddons.find(a => 
            a.title.toLowerCase() === searchTitle.toLowerCase() || 
            (searchTitle.toLowerCase().includes(a.title.toLowerCase()) && a.title.length > 3) ||
            (a.title.toLowerCase().includes(searchTitle.toLowerCase()) && searchTitle.length > 3)
        );
        
        // Use the Store Title if found (better display name), otherwise keep folder name
        const displayTitle = meta ? meta.title : addon.title;
        
        return { ...addon, ...meta, title: displayTitle, originalFolderName: addon.folderName };
    });
};

export const filterAddons = (source, addonSearch, addonSort) => {
    let filtered = source.filter(addon => 
        addon.title.toLowerCase().includes(addonSearch.toLowerCase()) || 
        addon.description.toLowerCase().includes(addonSearch.toLowerCase())
    );
    
    // Sorting Logic
    if (addonSort === 'a-z') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (addonSort === 'z-a') {
        filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (addonSort === 'newest') {
        const getDateVal = (url) => {
            if (!url) return 0;
            const match = url.match(/\/(\d{4})\/(\d{2})\//);
            return match ? parseInt(match[1]) * 100 + parseInt(match[2]) : 0;
        };
        filtered.sort((a, b) => getDateVal(b.image) - getDateVal(a.image));
    }
    // 'popular' keeps original order (default from JSON)
    
    return filtered;
};
