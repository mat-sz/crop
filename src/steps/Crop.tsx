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
            title={mainStore.transform.mute ? 'Unmute' : 'Mute'}
            onClick={() => {
              runInAction(() => {
                const mute = !mainStore.transform.mute;
                mainStore.transform = {
                  ...mainStore.transform,
                  mute,
                };
                video.muted = mute;
              });
            }}
          >
            {mainStore.transform.mute ? <BsVolumeMute /> : <BsVolumeUp />}
          </button>
          <button
            title="Flip horizontally"
            onClick={() => {
              runInAction(() => {
                const { flipH, area } = mainStore.transform;
                mainStore.transform = {
                  ...mainStore.transform,
                  flipH: !flipH,
                  area: area
                    ? [1 - area[2], area[1], 1 - area[0], area[3]]
                    : undefined,
                };
              });
            }}
          >
            <BsSymmetryVertical />
          </button>
          <button
            title="Flip vertically"
            onClick={() => {
              runInAction(() => {
                const { flipV, area } = mainStore.transform;
                mainStore.transform = {
                  ...mainStore.transform,
                  flipV: !flipV,
                  area: area
                    ? [area[0], 1 - area[3], area[2], 1 - area[1]]
                    : undefined,
                };
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
        time={mainStore.transform.time}
        video={video}
        onChange={time => {
          runInAction(() => {
            mainStore.transform = {
              ...mainStore.transform,
              time,
            };
          });
        }}
      />
      <VideoCrop
        transform={mainStore.transform}
        video={video}
        onChange={area =>
          runInAction(() => {
            mainStore.transform = {
              ...mainStore.transform,
              area,
            };
          })
        }
      />
    </div>
  );
});
