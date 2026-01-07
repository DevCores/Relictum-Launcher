const express = require('express');
const router = express.Router();
const {
  getClients,
  getClient,
  getClientManifest,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  verifyFile
} = require('../controllers/clientController');

const { authenticate, optionalAuth, logRequest } = require('../middleware/auth');

// All client routes log requests for analytics
router.use(logRequest);

// Public routes
router.get('/', getClients);
router.get('/:id', getClient);
router.get('/:id/manifest', getClientManifest);
router.post('/:id/verify', verifyFile);

// Protected routes (optional auth for anonymous downloads)
router.post('/:id/download', optionalAuth, startDownload);
router.put('/download/:downloadId/progress', optionalAuth, updateDownloadProgress);
router.put('/download/:downloadId/complete', optionalAuth, completeDownload);

module.exports = router;
