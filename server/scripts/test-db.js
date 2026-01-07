require('dotenv').config();
const { sequelize } = require('../config/database');

const testConnection = async () => {
  try {
    console.log('🔍 Testing MySQL connection...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful');

    // Test sync (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronization successful');

    // Test basic queries
    const User = require('../models/User');
    const Client = require('../models/Client');

    const userCount = await User.count();
    const clientCount = await Client.count();

    console.log(`📊 Database status:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Clients: ${clientCount}`);

    console.log('🎉 MySQL setup is working correctly!');

  } catch (error) {
    console.error('❌ MySQL test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Check your .env file with correct DB credentials');
    console.log('3. Create database: CREATE DATABASE relictum_launcher;');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

testConnection();
