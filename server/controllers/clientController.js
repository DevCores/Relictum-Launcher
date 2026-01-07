const { Op } = require('sequelize');
const Client = require('../models/Client');
const Download = require('../models/Download');

// @desc    Get all active clients
// @route   GET /api/clients
// @access  Public
const getClients = async (req, res) => {
  try {
    const clients = await Client.getActiveClients();

    // Remove sensitive data for public access
    const publicClients = clients.map(client => ({
      id: client.clientId,
      name: client.name,
      version: client.version,
      description: client.description,
      size: parseInt(client.size),
      downloadUrl: client.downloadUrl,
      systemRequirements: client.systemRequirements,
      stats: {
        totalDownloads: client.totalDownloads
      },
      updatedAt: client.updatedAt
    }));

    res.json({
      success: true,
      data: { clients: publicClients }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Public
const getClient = async (req, res) => {
  try {
    const client = await Client.findByClientId(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Remove sensitive data
    const publicClient = {
      id: client.clientId,
      name: client.name,
      version: client.version,
      description: client.description,
      size: parseInt(client.size),
      downloadUrl: client.downloadUrl,
      mirrorUrls: client.mirrorUrls,
      patchUrl: client.patchUrl,
      systemRequirements: client.systemRequirements,
      changelog: client.changelog,
      stats: {
        totalDownloads: client.totalDownloads,
        activeUsers: client.activeUsers,
        lastUpdated: client.lastUpdated
      },
      updatedAt: client.updatedAt
    };

    res.json({
      success: true,
      data: { client: publicClient }
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get client manifest (for integrity checks)
// @route   GET /api/clients/:id/manifest
// @access  Public
const getClientManifest = async (req, res) => {
  try {
    const client = await Client.findByClientId(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const manifest = {
      id: client.id,
      version: client.version,
      files: client.files.map(file => ({
        path: file.path,
        size: file.size,
        sha256: file.sha256,
        isRequired: file.isRequired
      }))
    };

    res.json({
      success: true,
      data: { manifest }
    });
  } catch (error) {
    console.error('Get manifest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Start download tracking
// @route   POST /api/clients/:id/download
// @access  Private (optional - can be public for anonymous downloads)
const startDownload = async (req, res) => {
  try {
    const { downloadType = 'full' } = req.body;
    const clientId = req.params.id;

    const client = await Client.findByClientId(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create download record
    const download = await Download.create({
      userId: req.user?.id,
      client: clientId,
      version: client.version,
      ipAddress: req.requestInfo?.ip || req.ip,
      userAgent: req.requestInfo?.userAgent || req.get('User-Agent'),
      downloadType,
      totalBytes: parseInt(client.size),
      sessionId: req.body.sessionId
    });

    // Increment client download count
    await client.incrementDownloads();

    // Update user stats if authenticated
    if (req.user) {
      await req.user.updateOne({ $inc: { 'profile.totalDownloads': 1 } });
    }

    res.json({
      success: true,
      message: 'Download started',
      data: {
        downloadId: download._id,
        downloadUrl: client.downloadUrl,
        mirrorUrls: client.mirrorUrls
      }
    });
  } catch (error) {
    console.error('Start download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update download progress
// @route   PUT /api/clients/download/:downloadId/progress
// @access  Private
const updateDownloadProgress = async (req, res) => {
  try {
    const { downloadId } = req.params;
    const { bytesDownloaded, duration } = req.body;

    const download = await Download.findByPk(downloadId);

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found'
      });
    }

    // Check if user owns this download
    if (req.user && download.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await download.update({
      bytesDownloaded: parseInt(bytesDownloaded),
      ...(duration && { duration: parseInt(duration) })
    });

    res.json({
      success: true,
      message: 'Progress updated'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete download
// @route   PUT /api/clients/download/:downloadId/complete
// @access  Private
const completeDownload = async (req, res) => {
  try {
    const { downloadId } = req.params;
    const { duration } = req.body;

    const download = await Download.findByPk(downloadId);

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found'
      });
    }

    // Check if user owns this download
    if (req.user && download.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await download.complete(parseInt(download.totalBytes), parseInt(duration));

    res.json({
      success: true,
      message: 'Download completed'
    });
  } catch (error) {
    console.error('Complete download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify file integrity
// @route   POST /api/clients/:id/verify
// @access  Public
const verifyFile = async (req, res) => {
  try {
    const { filePath, sha256 } = req.body;
    const clientId = req.params.id;

    const client = await Client.findByClientId(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const isValid = client.verifyFile(filePath, sha256);

    res.json({
      success: true,
      data: {
        isValid,
        expectedHash: client.getFile(filePath)?.sha256
      }
    });
  } catch (error) {
    console.error('Verify file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getClients,
  getClient,
  getClientManifest,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  verifyFile
};
