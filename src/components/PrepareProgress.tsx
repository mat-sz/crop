import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import styles from './PrepareProgress.module.scss';
import { mainStore } from '../stores/main';

export const PrepareProgress: React.FC = observer(() => {
  const { ffmpeg, fileLoading } = mainStore;

  if (!fileLoading) {
    return null;
  }

  if (!ffmpeg.loaded) {
    return (
      <div className={styles.progress}>
        <div className={styles.actions}>
          <button
            onClick={() => {
              runInAction(() => {
                ffmpeg.onLoadCallback = undefined;
                mainStore.fileLoading = false;
              });
            }}
          >
            <span>Cancel</span>
          </button>
        </div>
        <div className={styles.info}>
          <span>Preparing video preview - loading FFMpeg</span>
          <progress value={ffmpeg.loadProgress} max={1} />
        </div>
      </div>
    );
  }

  if (ffmpeg.running) {
    return (
      <div className={styles.progress}>
        <div className={styles.actions}>
          <button
            onClick={() => {
              runInAction(() => {
                ffmpeg.cancel();
                mainStore.fileLoading = false;
              });
            }}
          >
            <span>Cancel</span>
          </button>
        </div>
        <div className={styles.info}>
          <span>Preparing video preview - remuxing</span>
          <progress value={ffmpeg.execProgress} max={1} />
          <pre>{ffmpeg.output}</pre>
        </div>
      </div>
    );
  }

  return <div className={styles.loading}>Loading...</div>;
});
