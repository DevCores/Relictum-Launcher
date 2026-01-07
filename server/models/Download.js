const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Download = sequelize.define('Download', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  client: {
    type: DataTypes.ENUM('classic', 'tbc', 'wotlk'),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 support
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('started', 'completed', 'failed', 'cancelled'),
    defaultValue: 'started'
  },
  downloadType: {
    type: DataTypes.ENUM('full', 'patch'),
    defaultValue: 'full'
  },
  bytesDownloaded: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  totalBytes: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in milliseconds
    allowNull: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'downloads',
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['client', 'created_at'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['session_id'] }
  ]
});

// Define associations
Download.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Instance method to complete download
Download.prototype.complete = async function(bytesDownloaded, duration) {
  this.status = 'completed';
  this.bytesDownloaded = bytesDownloaded;
  this.duration = duration;
  this.completedAt = new Date();
  return await this.save();
};

// Instance method to fail download
Download.prototype.fail = async function(error) {
  this.status = 'failed';
  this.error = error;
  this.completedAt = new Date();
  return await this.save();
};

// Static method to get download stats
Download.getStats = async function(clientId = null, days = 30) {
  const whereClause = {};
  if (clientId) {
    whereClause.client = clientId;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  whereClause.createdAt = { [Op.gte]: startDate };

  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'client',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('bytes_downloaded')), 'totalBytes'],
      [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration']
    ],
    group: ['client', 'status'],
    raw: true
  });

  // Group by client
  const groupedStats = {};
  stats.forEach(stat => {
    if (!groupedStats[stat.client]) {
      groupedStats[stat.client] = [];
    }
    groupedStats[stat.client].push({
      status: stat.status,
      count: parseInt(stat.count),
      totalBytes: parseInt(stat.totalBytes) || 0,
      avgDuration: parseFloat(stat.avgDuration) || 0
    });
  });

  return Object.keys(groupedStats).map(client => ({
    _id: client,
    stats: groupedStats[client]
  }));
};

// Static method to get user download history
Download.getUserHistory = async function(userId, limit = 50) {
  return await this.findAll({
    where: { userId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['username']
    }],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

module.exports = Download;
