const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Profile fields
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalDownloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  favoriteClients: {
    type: DataTypes.JSON, // Store as JSON array
    defaultValue: [],
    validate: {
      isValidClients(value) {
        if (!Array.isArray(value)) {
          throw new Error('favoriteClients must be an array');
        }
        const validClients = ['classic', 'tbc', 'wotlk'];
        const invalidClients = value.filter(client => !validClients.includes(client));
        if (invalidClients.length > 0) {
          throw new Error(`Invalid clients: ${invalidClients.join(', ')}`);
        }
      }
    }
  },
  // Security fields
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] }
  ],
  hooks: {
    // Hash password before saving
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Virtual for account lock
User.prototype.getIsLocked = function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment failed login attempts
User.prototype.incLoginAttempts = async function() {
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  } else {
    this.failedLoginAttempts += 1;
  }
  return await this.save();
};

// Instance method to reset failed login attempts
User.prototype.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  return await this.save();
};

// Static method to find user for authentication
User.findForAuth = async function(usernameOrEmail) {
  return await this.findOne({
    where: {
      [sequelize.Op.or]: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    }
  });
};

module.exports = User;
