import React from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import {
  BsCheck,
  BsVolumeMute,
  BsSymmetryVertical,
  BsSymmetryHorizontal,
  BsVolumeUp,
  BsArrowCounterclockwise,
} from 'react-icons/bs';

import styles from './Crop.module.scss';
import { mainStore } from '../stores/main';
import { VideoCrop } from '../components/VideoCrop';
import { VideoTrim } from '../components/VideoTrim';

export const Crop: React.FC = observer(() => {
  const video = mainStore.video;
  if (!video) {
    return (
      <div>
        <span>No video selected.</span>
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <div className={styles.controls}>
        <div>
          <button
            title={mainStore.mute ? 'Unmute' : 'Mute'}
            onClick={() => {
              runInAction(() => {
                const mute = !mainStore.mute;
                mainStore.mute = mute;
                video.muted = mute;
              });
            }}
          >
            {mainStore.mute ? <BsVolumeMute /> : <BsVolumeUp />}
          </button>
          <button
            title="Flip horizontally"
            onClick={() => {
              runInAction(() => {
                mainStore.flipH = !mainStore.flipH;
                mainStore.area = [
                  1 - mainStore.area[2],
                  mainStore.area[1],
                  1 - mainStore.area[0],
                  mainStore.area[3],
                ];
              });
            }}
          >
            <BsSymmetryVertical />
          </button>
          <button
            title="Flip vertically"
            onClick={() => {
              runInAction(() => {
                mainStore.flipV = !mainStore.flipV;
                mainStore.area = [
                  mainStore.area[0],
                  1 - mainStore.area[3],
                  mainStore.area[2],
                  1 - mainStore.area[1],
                ];
              });
            }}
          >
            <BsSymmetryHorizontal />
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              mainStore.reset();
            }}
            title="Reset"
          >
            <BsArrowCounterclockwise />
          </button>
          <button
            onClick={() => {
              runInAction(() => {
                video.pause();
                mainStore.step = 2;
              });
            }}
            title="Confirm"
          >
            <BsCheck />
          </button>
        </div>
      </div>
      <VideoTrim
        time={mainStore.time}
        video={video}
        onChange={time =>
          runInAction(() => {
            mainStore.time = time;
          })
        }
      />
      <VideoCrop
        area={mainStore.area}
        video={video}
        onChange={area =>
          runInAction(() => {
            mainStore.area = area;
          })
        }
      />
    </div>
  );
});
