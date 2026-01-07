const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const Download = require('../models/Download');
const { authenticate, requireAdmin } = require('../middleware/auth');

// @desc    Get user download history
// @route   GET /api/users/downloads
// @access  Private
router.get('/downloads', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows: downloads, count: total } = await Download.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        downloads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['bio', 'avatar', 'favoriteClients', 'totalDownloads', 'lastLogin']
    });

    const downloadStats = await Download.findAll({
      where: { userId: req.user.id },
      attributes: [
        'status',
        [Download.sequelize.fn('COUNT', Download.sequelize.col('id')), 'count'],
        [Download.sequelize.fn('SUM', Download.sequelize.col('bytesDownloaded')), 'totalBytes']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        user: {
          profile: {
            bio: user.bio,
            avatar: user.avatar,
            favoriteClients: user.favoriteClients,
            totalDownloads: user.totalDownloads,
            lastLogin: user.lastLogin
          }
        },
        downloads: downloadStats.map(stat => ({
          _id: stat.status,
          count: parseInt(stat.count),
          totalBytes: parseInt(stat.totalBytes) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin routes
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { rows: users, count: total } = await User.findAndCountAll({
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires']
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
