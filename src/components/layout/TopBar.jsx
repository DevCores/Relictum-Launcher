import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import styles from './TopBar.module.css';

const TopBar = ({ activeGame, onMinimize, onMaximize, onClose }) => {
    return (
        <div className={styles.titleBar}>
            <div className={styles.windowControls}>
                <button onClick={onMinimize} className={styles.controlBtn} title="Minimize">
                    <Minus size={16} strokeWidth={1.5} />
                </button>
                <button onClick={onMaximize} className={styles.controlBtn} title="Maximize">
                    <Square size={12} strokeWidth={1.5} />
                </button>
                <button onClick={onClose} className={`${styles.controlBtn} ${styles.close}`} title="Close">
                    <X size={16} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};

export default TopBar;
