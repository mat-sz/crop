import React from 'react';
import { BsGithub } from 'react-icons/bs';

import styles from './SelectFile.module.scss';
import { mainStore } from '../stores/main';

export const SelectFile: React.FC = () => {
  return (
    <div className={styles.step}>
      <label>
        <input
          type="file"
          accept="video/*"
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
};
