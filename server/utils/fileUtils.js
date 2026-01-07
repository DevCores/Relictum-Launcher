const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Calculate SHA256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA256 hash
 */
const calculateFileHash = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    throw new Error(`Failed to calculate hash for ${filePath}: ${error.message}`);
  }
};

/**
 * Calculate SHA256 hash of multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<Object>} Object with file paths as keys and hashes as values
 */
const calculateFilesHash = async (filePaths) => {
  const results = {};

  for (const filePath of filePaths) {
    try {
      results[filePath] = await calculateFileHash(filePath);
    } catch (error) {
      console.error(`Error calculating hash for ${filePath}:`, error.message);
      results[filePath] = null;
    }
  }

  return results;
};

/**
 * Get file size
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} File size in bytes
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get size for ${filePath}: ${error.message}`);
  }
};

/**
 * Check if file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file exists
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get all files in directory recursively
 * @param {string} dirPath - Directory path
 * @param {string[]} excludePatterns - Patterns to exclude
 * @returns {Promise<string[]>} Array of file paths
 */
const getAllFiles = async (dirPath, excludePatterns = []) => {
  const files = [];

  const walk = async (currentPath) => {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = await fs.stat(fullPath);

      // Check exclude patterns
      const shouldExclude = excludePatterns.some(pattern =>
        fullPath.includes(pattern)
      );

      if (shouldExclude) continue;

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  };

  await walk(dirPath);
  return files;
};

/**
 * Generate manifest for client
 * @param {string} clientPath - Path to client directory
 * @param {Object} options - Options for manifest generation
 * @returns {Promise<Object>} Manifest object
 */
const generateManifest = async (clientPath, options = {}) => {
  const {
    excludePatterns = ['.git', 'node_modules', 'temp', 'cache'],
    basePath = clientPath
  } = options;

  console.log(`Generating manifest for ${clientPath}`);

  const files = await getAllFiles(clientPath, excludePatterns);
  console.log(`Found ${files.length} files`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    files: []
  };

  let totalSize = 0;

  for (const filePath of files) {
    try {
      const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');
      const size = await getFileSize(filePath);
      const hash = await calculateFileHash(filePath);

      manifest.files.push({
        path: relativePath,
        size,
        sha256: hash,
        isRequired: true // All files are required by default
      });

      totalSize += size;
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }

  manifest.totalSize = totalSize;
  console.log(`Manifest generated. Total size: ${totalSize} bytes`);

  return manifest;
};

/**
 * Verify file against manifest
 * @param {string} filePath - Path to file
 * @param {string} expectedHash - Expected SHA256 hash
 * @returns {Promise<boolean>} True if file is valid
 */
const verifyFileIntegrity = async (filePath, expectedHash) => {
  try {
    if (!(await fileExists(filePath))) {
      return false;
    }

    const actualHash = await calculateFileHash(filePath);
    return actualHash === expectedHash;
  } catch (error) {
    console.error(`Error verifying ${filePath}:`, error.message);
    return false;
  }
};

module.exports = {
  calculateFileHash,
  calculateFilesHash,
  getFileSize,
  fileExists,
  getAllFiles,
  generateManifest,
  verifyFileIntegrity
};
