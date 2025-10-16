import { memo } from 'react';
import styles from './styles.module.css';

type CascadeLoaderProps = { className?: string };

/**
 *  https://github.com/jh3y/whirl/blob/dist/css/cascade.css
 */
export const CascadeLoader = memo<CascadeLoaderProps>(({ className = '' }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={styles.cascadeLoader}>
                <div className={styles.cascadeBar} style={{ animationDelay: '0.15s' }} />
                <div className={styles.cascadeBar} style={{ animationDelay: '0.3s' }} />
                <div className={styles.cascadeBar} style={{ animationDelay: '0.45s' }} />
                <div className={styles.cascadeBar} style={{ animationDelay: '0.6s' }} />
                <div className={styles.cascadeBar} style={{ animationDelay: '0.75s' }} />
            </div>
        </div>
    );
});

CascadeLoader.displayName = 'CascadeLoader';
