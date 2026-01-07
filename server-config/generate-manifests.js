const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Конфигурация клиентов
const clients = [
    {
        id: 'classic',
        name: 'World of Warcraft Classic',
        version: '1.12.1',
        gameDir: 'path/to/classic/client', // Укажите путь к распакованному клиенту
        requiredFiles: [
            'WoW.exe',
            'Launcher.exe',
            'Data/wow-1.12.1-enUS-locale.mpq',
            'Data/wow-1.12.1-enUS-speech.mpq',
            'Data/wow-1.12.1-enUS-base.mpq'
        ]
    },
    {
        id: 'tbc',
        name: 'The Burning Crusade',
        version: '2.4.3',
        gameDir: 'path/to/tbc/client',
        requiredFiles: [
            'WoW.exe',
            'Launcher.exe',
            'Data/expansion-locale-enUS.MPQ',
            'Data/expansion-speech-enUS.MPQ',
            'Data/expansion.MPQ',
            'Data/wow-locale-enUS.MPQ',
            'Data/wow-speech-enUS.MPQ',
            'Data/wow.MPQ'
        ]
    },
    {
        id: 'wotlk',
        name: 'Wrath of the Lich King',
        version: '3.3.5a',
        gameDir: 'path/to/wotlk/client',
        requiredFiles: [
            'WoW.exe',
            'Launcher.exe',
            'Data/LichKing-locale-enUS.MPQ',
            'Data/LichKing-speech-enUS.MPQ',
            'Data/LichKing.MPQ',
            'Data/expansion-locale-enUS.MPQ',
            'Data/expansion-speech-enUS.MPQ',
            'Data/expansion.MPQ',
            'Data/wow-locale-enUS.MPQ',
            'Data/wow-speech-enUS.MPQ',
            'Data/wow.MPQ'
        ]
    }
];

// Функция для расчета SHA256 хэша файла
function calculateFileHash(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (error) {
        console.error(`Error calculating hash for ${filePath}:`, error.message);
        return null;
    }
}

// Функция для генерации манифеста
function generateManifest(client) {
    console.log(`Generating manifest for ${client.name}...`);

    const manifest = {
        version: client.version,
        lastUpdated: new Date().toISOString().split('T')[0],
        files: {}
    };

    // Проверяем существование директории клиента
    if (!fs.existsSync(client.gameDir)) {
        console.error(`Game directory not found: ${client.gameDir}`);
        console.log(`Please update the gameDir path in this script for ${client.name}`);
        return null;
    }

    // Рассчитываем хэши для всех необходимых файлов
    for (const file of client.requiredFiles) {
        const filePath = path.join(client.gameDir, file.replace(/\//g, path.sep));

        if (fs.existsSync(filePath)) {
            const hash = calculateFileHash(filePath);
            if (hash) {
                manifest.files[file] = hash;
                console.log(`✓ ${file}: ${hash.substring(0, 16)}...`);
            } else {
                console.error(`✗ Failed to hash ${file}`);
            }
        } else {
            console.error(`✗ File not found: ${filePath}`);
        }
    }

    // Добавляем информацию о патчах (пустая для начала)
    manifest.patches = [
        {
            version: client.version,
            url: `https://your-server.com/patches/${client.id}/${client.version}.patch`,
            size: 0, // Рассчитать размер патча
            checksum: 'patch-hash-here' // Рассчитать хэш патча
        }
    ];

    return manifest;
}

// Генерируем манифесты для всех клиентов
console.log('Starting manifest generation...\n');

for (const client of clients) {
    const manifest = generateManifest(client);

    if (manifest) {
        const manifestPath = path.join(__dirname, `${client.id}-manifest.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✓ Manifest saved: ${manifestPath}\n`);
    } else {
        console.log(`✗ Failed to generate manifest for ${client.name}\n`);
    }
}

console.log('Manifest generation complete!');
console.log('\nNext steps:');
console.log('1. Update gameDir paths in this script to point to your actual game installations');
console.log('2. Run this script again to generate real manifests');
console.log('3. Upload manifests to your server at /api/manifests/');
console.log('4. Create and upload the actual game ZIP files');
console.log('5. Update the URLs in electron/main.js to point to your server');

