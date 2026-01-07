import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './Downloads.module.css';
import ipcRenderer from '../../utils/ipc';
import { useLocalization } from '../../i18n/LocalizationContext';

const Downloads = ({ onClientInstalled, onClientDownloaded }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState({}); // { clientId: { progress, status, downloading } }
  const { t } = useLocalization();
  const scrollRef = useRef(null);
  const lastScrollTop = useRef(0);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const saveScrollPosition = () => {
    if (scrollRef.current) {
      lastScrollTop.current = scrollRef.current.scrollTop;
    }
  };

  useEffect(() => {
    loadAvailableClients();

    // Listen for download progress events
    const handleDownloadProgress = (event, data) => {
      console.log('Download progress event data:', data);
      const { clientId, ...progress } = data;
      console.log('Extracted clientId:', clientId, 'progress:', progress);
      saveScrollPosition();
      setDownloads(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          progress,
          downloading: true
        }
      }));
    };

    const handleDownloadStatus = (event, data) => {
      const { clientId, status } = data;
      console.log('Download status for', clientId, status);
      saveScrollPosition();
      setDownloads(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          status,
          downloading: true
        }
      }));
    };

    const handleDownloadComplete = (event, data) => {
      console.log(`Download completed for ${data.clientId}`);
      saveScrollPosition();
      setDownloads(prev => {
        const newDownloads = { ...prev };
        delete newDownloads[data.clientId];
        return newDownloads;
      });

      // Add client to installed list
      if (onClientDownloaded) {
        onClientDownloaded(data.clientId);
      }
      if (onClientInstalled) {
        onClientInstalled();
      }
    };

    ipcRenderer.on('download-progress', handleDownloadProgress);
    ipcRenderer.on('download-status', handleDownloadStatus);
    ipcRenderer.on('download-complete', handleDownloadComplete);

    return () => {
      ipcRenderer.removeListener('download-progress', handleDownloadProgress);
      ipcRenderer.removeListener('download-status', handleDownloadStatus);
      ipcRenderer.removeListener('download-complete', handleDownloadComplete);
    };
  }, []); // Remove problematic dependencies

  // Restore scroll position after state updates
  useLayoutEffect(() => {
    if (scrollRef.current && lastScrollTop.current > 0) {
      scrollRef.current.scrollTop = lastScrollTop.current;
    }
  }, [downloads]);

  const loadAvailableClients = async () => {
    try {
      setLoading(true);
      // Add minimum delay to ensure loading state is visible
      const [clients] = await Promise.all([
        ipcRenderer.invoke('get-available-clients'),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading time
      ]);
      setClients(clients);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (clientId) => {
    try {
      saveScrollPosition(); // Save scroll before state changes
      setDownloads(prev => ({
        ...prev,
        [clientId]: {
          downloading: true,
          progress: null,
          status: ''
        }
      }));
      const result = await ipcRenderer.invoke('download-client', { clientId, downloadType: 'full' });

      if (!result.success) {
        alert(`Download failed: ${result.message}`);
        setDownloads(prev => {
          const newDownloads = { ...prev };
          delete newDownloads[clientId];
          return newDownloads;
        });
        setDownloadProgress(null);
        setDownloadStatus('');
      }
      // Success is handled by the IPC event listeners
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
      setDownloading(null);
      setDownloadProgress(null);
      setDownloadStatus('');
    }
  };

  if (loading) {
    return (
      <div className={styles.downloadsView}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading available clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.downloadsView} ref={scrollRef}>
      <div className={styles.header}>
        <h1>{t('downloads.title')}</h1>
        <p>{t('downloads.subtitle')}</p>
      </div>

      <div className={styles.warningBanner}>
        <AlertTriangle size={20} />
        <div>
          <h4>{t('downloads.notice')}</h4>
          <p>{t('downloads.noticeText')}</p>
        </div>
      </div>

      <div className={styles.clientsGrid}>
        {clients.map(client => (
          <div key={client.id} className={styles.clientCard}>
            <div className={styles.clientHeader}>
              <div className={styles.clientIcon}>
                <FileText size={32} />
              </div>
              <div className={styles.clientInfo}>
                <h3>{client.name}</h3>
                <div className={styles.clientMeta}>
                  <span className={styles.version}>{t('downloads.version')} {client.version}</span>
                  <span className={styles.size}>{t('downloads.size')}: {client.size}</span>
                </div>
              </div>
            </div>

            <p className={styles.description}>{client.description}</p>

            <button
              className={`${styles.downloadBtn} ${downloads[client.id]?.downloading ? styles.downloading : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.currentTarget.blur(); // Remove focus to prevent scroll jumping
                handleDownload(client.id);
              }}
              disabled={downloads[client.id]?.downloading}
            >
              {downloads[client.id]?.downloading ? (
                <>
                  <div className={styles.miniSpinner}></div>
                  {t('downloads.downloading')}
                </>
              ) : (
                <>
                  <Download size={16} />
                  {t('downloads.downloadAndInstall')}
                </>
              )}
            </button>

            {downloads[client.id]?.downloading && (
              <div className={styles.downloadProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: downloads[client.id]?.progress
                        ? `${downloads[client.id].progress.progress * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {downloads[client.id]?.status || (downloads[client.id]?.progress
                    ? `Downloading... ${(downloads[client.id].progress.progress * 100).toFixed(1)}%`
                    : 'Preparing download...')}
                </div>
                {downloads[client.id]?.progress && (
                  <div className={styles.progressStats}>
                    {formatBytes(downloads[client.id].progress.downloaded)} / {formatBytes(downloads[client.id].progress.total)}
                    {downloads[client.id].progress.speed && ` • ${formatBytes(downloads[client.id].progress.speed)}/s`}
                  </div>
                )}
              </div>
            )}

            <div className={styles.clientFooter}>
              <div className={styles.checksum}>
                <CheckCircle size={14} />
                <span>SHA256: {client.checksum ? client.checksum.substring(0, 16) + '...' : 'Not available'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Downloads;
