const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const Client = require('../models/Client');
const Download = require('../models/Download');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

// @desc    Get general stats
// @route   GET /api/stats/general
// @access  Public
router.get('/general', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDownloads,
      activeClients,
      recentDownloads
    ] = await Promise.all([
      User.count(),
      Download.count({ where: { status: 'completed' } }),
      Client.count({ where: { isActive: true } }),
      Download.findAll({
        where: { status: 'completed' },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }],
        attributes: ['client', 'version', 'createdAt']
      })
    ]);

    // Get download stats by client
    const clientStats = await Download.findAll({
      where: { status: 'completed' },
      attributes: [
        'client',
        [fn('COUNT', col('id')), 'downloads'],
        [fn('SUM', col('bytesDownloaded')), 'totalBytes']
      ],
      group: ['client'],
      order: [[literal('downloads'), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDownloads,
        activeClients,
        clientStats: clientStats.map(stat => ({
          _id: stat.client,
          downloads: parseInt(stat.downloads),
          totalBytes: parseInt(stat.totalBytes) || 0
        })),
        recentDownloads: recentDownloads.map(download => ({
          client: download.client,
          version: download.version,
          createdAt: download.createdAt,
          user: download.user ? { username: download.user.username } : null
        }))
      }
    });
  } catch (error) {
    console.error('Get general stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get client-specific stats
// @route   GET /api/stats/clients/:clientId
// @access  Public
router.get('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const stats = await Download.getStats(clientId, days);

    const client = await Client.findByClientId(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          version: client.version
        },
        stats,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get download analytics (Admin only)
// @route   GET /api/stats/analytics
// @access  Admin
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const period = req.query.period || '30d'; // 1d, 7d, 30d, 90d

    let days;
    switch (period) {
      case '1d': days = 1; break;
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily download stats
    const dailyStats = await Download.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          downloads: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Top clients
    const topClients = await Download.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: '$client',
          downloads: { $sum: 1 },
          totalBytes: { $sum: '$bytesDownloaded' }
        }
      },
      { $sort: { downloads: -1 } },
      { $limit: 10 }
    ]);

    // User engagement
    const userEngagement = await Download.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: '$user',
          downloads: { $sum: 1 },
          lastDownload: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalActiveUsers: { $sum: 1 },
          avgDownloadsPerUser: { $avg: '$downloads' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dailyStats,
        topClients,
        userEngagement: userEngagement[0] || {
          totalActiveUsers: 0,
          avgDownloadsPerUser: 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
