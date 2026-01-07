require('dotenv').config();
const { sequelize } = require('../config/database');
const Client = require('../models/Client');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected for seeding');
  } catch (error) {
    console.error('MySQL connection error:', error);
    process.exit(1);
  }
};

// Test clients data
const clientsData = [
  {
    clientId: 'classic',
    name: 'World of Warcraft Classic',
    version: '1.12.1',
    description: 'The original World of Warcraft experience. Relive the glory days of Azeroth with the classic gameplay that started it all.',
    size: '2200000000', // ~2.2GB as string for BIGINT
    downloadUrl: 'https://example.com/downloads/wow-classic-1.12.1.zip',
    mirrorUrls: JSON.stringify([
      'https://mirror1.example.com/wow-classic-1.12.1.zip',
      'https://mirror2.example.com/wow-classic-1.12.1.zip'
    ]),
    systemRequirements: JSON.stringify({
      minRam: 1,
      minDiskSpace: 4,
      recommendedRam: 2,
      recommendedDiskSpace: 8
    }),
    files: JSON.stringify([
      {
        path: 'WoW.exe',
        size: 1024000,
        sha256: 'a'.repeat(64),
        isRequired: true
      },
      {
        path: 'Launcher.exe',
        size: 512000,
        sha256: 'b'.repeat(64),
        isRequired: true
      },
      {
        path: 'Data/wow-1.12.1-enUS-locale.mpq',
        size: 500000000,
        sha256: 'c'.repeat(64),
        isRequired: true
      }
    ]),
    changelog: JSON.stringify([
      {
        version: '1.12.1',
        date: new Date('2024-01-15'),
        changes: [
          'Fixed various game crashes',
          'Improved performance',
          'Updated security patches'
        ]
      }
    ])
  },
  {
    clientId: 'tbc',
    name: 'The Burning Crusade',
    version: '2.4.3',
    description: 'Experience the epic saga of The Burning Crusade. Journey to Outland and face the forces of the Burning Legion.',
    size: '4500000000', // ~4.5GB
    downloadUrl: 'https://example.com/downloads/wow-tbc-2.4.3.zip',
    mirrorUrls: JSON.stringify([
      'https://mirror1.example.com/wow-tbc-2.4.3.zip'
    ]),
    systemRequirements: JSON.stringify({
      minRam: 1,
      minDiskSpace: 8,
      recommendedRam: 2,
      recommendedDiskSpace: 12
    }),
    files: JSON.stringify([
      {
        path: 'WoW.exe',
        size: 1100000,
        sha256: 'd'.repeat(64),
        isRequired: true
      },
      {
        path: 'Launcher.exe',
        size: 520000,
        sha256: 'e'.repeat(64),
        isRequired: true
      }
    ]),
    changelog: JSON.stringify([
      {
        version: '2.4.3',
        date: new Date('2024-01-20'),
        changes: [
          'Added Sunwell Plateau raid',
          'New world events',
          'Balance changes for all classes'
        ]
      }
    ])
  },
  {
    clientId: 'wotlk',
    name: 'Wrath of the Lich King',
    version: '3.3.5a',
    description: 'Enter the frozen continent of Northrend in Wrath of the Lich King. Face Arthas and the Scourge in this epic expansion.',
    size: '6800000000', // ~6.8GB
    downloadUrl: 'https://example.com/downloads/wow-wotlk-3.3.5a.zip',
    mirrorUrls: JSON.stringify([
      'https://mirror1.example.com/wow-wotlk-3.3.5a.zip',
      'https://mirror2.example.com/wow-wotlk-3.3.5a.zip',
      'https://mirror3.example.com/wow-wotlk-3.3.5a.zip'
    ]),
    systemRequirements: JSON.stringify({
      minRam: 2,
      minDiskSpace: 12,
      recommendedRam: 4,
      recommendedDiskSpace: 20
    }),
    files: JSON.stringify([
      {
        path: 'WoW.exe',
        size: 1200000,
        sha256: 'f'.repeat(64),
        isRequired: true
      },
      {
        path: 'Launcher.exe',
        size: 530000,
        sha256: 'g'.repeat(64),
        isRequired: true
      }
    ]),
    changelog: JSON.stringify([
      {
        version: '3.3.5a',
        date: new Date('2024-01-25'),
        changes: [
          'Icecrown Citadel raid released',
          'New death knight class',
          'Wintergrasp battleground',
          'Major balance updates'
        ]
      }
    ])
  }
];

// Test users data
const usersData = [
  {
    username: 'admin',
    email: 'admin@relictum.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
    profile: {
      bio: 'Administrator of Relictum Launcher',
      favoriteClients: ['wotlk', 'tbc']
    }
  },
  {
    username: 'testuser',
    email: 'user@test.com',
    password: 'test123',
    role: 'user',
    isVerified: true,
    profile: {
      bio: 'Regular WoW player',
      favoriteClients: ['classic']
    }
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Client.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log('🧹 Cleared existing data');

    // Seed clients
    const clients = await Client.bulkCreate(clientsData);
    console.log(`✅ Seeded ${clients.length} clients`);

    // Seed users
    const users = await User.bulkCreate(usersData);
    console.log(`✅ Seeded ${users.length} users`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test accounts:');
    console.log('Admin: admin@relictum.com / admin123');
    console.log('User: user@test.com / test123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// Run seeding
connectDB().then(seedDatabase);
