const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.ENUM('classic', 'tbc', 'wotlk'),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT, // Use BIGINT for large file sizes
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  downloadUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mirrorUrls: {
    type: DataTypes.JSON, // Store as JSON array
    defaultValue: []
  },
  patchUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  files: {
    type: DataTypes.JSON, // Store file manifest as JSON
    defaultValue: []
  },
  systemRequirements: {
    type: DataTypes.JSON, // Store requirements as JSON
    defaultValue: {
      minRam: 1,
      minDiskSpace: 4,
      recommendedRam: 2,
      recommendedDiskSpace: 8
    }
  },
  changelog: {
    type: DataTypes.JSON, // Store changelog as JSON array
    defaultValue: []
  },
  // Stats
  totalDownloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'clients',
  indexes: [
    { fields: ['client_id'] },
    { fields: ['is_active'] }
  ]
});

// Instance method to update download stats
Client.prototype.incrementDownloads = async function() {
  this.totalDownloads += 1;
  this.lastUpdated = new Date();
  return await this.save();
};

// Instance method to get file by path
Client.prototype.getFile = function(filePath) {
  return this.files.find(file => file.path === filePath);
};

// Instance method to verify file integrity
Client.prototype.verifyFile = function(filePath, sha256) {
  const file = this.getFile(filePath);
  return file && file.sha256 === sha256;
};

// Static method to get active clients
Client.getActiveClients = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

// Static method to find client by id
Client.findByClientId = async function(clientId) {
  return await this.findOne({
    where: {
      clientId: clientId,
      isActive: true
    }
  });
};

module.exports = Client;
