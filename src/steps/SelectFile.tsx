import React from 'react';
import { BsGithub } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import styles from './SelectFile.module.scss';
import { mainStore } from '../stores/main';
import { PrepareProgress } from '../components/PrepareProgress';

export const SelectFile: React.FC = observer(() => {
  return (
    <div className={styles.step}>
      {mainStore.fileLoading ? (
        <PrepareProgress />
      ) : (
        <label>
          <input
            type="file"
            accept="video/*,.mkv,.mov,.mp4,.m4v,.mk3d,.wmv,.asf,.mxf,.ts,.m2ts,.3gp,.3g2,.flv,.webm,.ogv,.rmvb,.avi"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                mainStore.loadVideo(file);
              }
              e.target.value = '';
            }}
          />
          <span>Select a video file</span>
        </label>
      )}
      <div className={styles.credits}>
        <ul>
          <li>✔️ Free and open source</li>
          <li>✔️ Crop, trim, mirror or mute your video easily</li>
          <li>✔️ No watermarks</li>
          <li>✔️ Your video files stay on your computer</li>
        </ul>
        <div>
          💜 Thanks to the{' '}
          <a
            href="https://github.com/ffmpegwasm/ffmpeg.wasm"
            rel="noopener noreferrer"
            target="_blank"
          >
            ffmpeg.wasm
          </a>{' '}
          project for making this possible.
        </div>
        <div>
          <a
            href="https://github.com/mat-sz/crop"
            rel="noopener noreferrer"
            target="_blank"
          >
            <BsGithub />
          </a>
        </div>
      </div>
    </div>
  );
});
