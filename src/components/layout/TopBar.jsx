import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import styles from './TopBar.module.css';
import { useLocalization } from '../../i18n/LocalizationContext';

const TopBar = ({ activeGame, onMinimize, onMaximize, onClose }) => {
    const { t } = useLocalization();

    return (
        <div className={styles.titleBar}>
            <div className={styles.windowControls}>
                <button onClick={onMinimize} className={styles.controlBtn} title={t('common.minimize')}>
                    <Minus size={16} strokeWidth={1.5} />
                </button>
                <button onClick={onMaximize} className={styles.controlBtn} title={t('common.maximize')}>
                    <Square size={12} strokeWidth={1.5} />
                </button>
                <button onClick={onClose} className={`${styles.controlBtn} ${styles.close}`} title={t('common.close')}>
                    <X size={16} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};

export default TopBar;
