import React, { useEffect, useRef, useState } from 'react';
import { BsPlay, BsPause } from 'react-icons/bs';

import styles from './VideoTrim.module.scss';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { clamp, humanTime } from '../helpers';
import clsx from 'clsx';

interface VideoTrimProps {
  onChange: (time: number[]) => void;
  time: number[];
  video: HTMLVideoElement;
}

export const VideoTrim: React.FC<VideoTrimProps> = ({
  onChange,
  time,
  video,
}) => {
  const [currentTime, setCurrentTime] = useState(video.currentTime);
  const [playing, setPlaying] = useState(!video.paused);
  const ignoreTimeUpdatesRef = useRef(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const { startDragging, dragState } = usePointerDrag<{
    direction: string;
    x?: number;
    time?: number[];
    currentTime?: number;
    paused: boolean;
  }>(
    (x, _, state) => {
      ignoreTimeUpdatesRef.current = true;
      const rect = timelineRef.current!.getBoundingClientRect();

      let relativeX = clamp((x - rect.left) / rect.width, 0, 1);

      const newTime = [...time];

      switch (state.direction) {
        case 'move':
          relativeX = clamp(
            (x - state.x!) / rect.width,
            -1 * state.time![0],
            1 - state.time![1],
          );
          newTime[0] = state.time![0] + relativeX;
          newTime[1] = state.time![1] + relativeX;

          video.currentTime = clamp(
            currentTime,
            newTime[0] * video.duration,
            newTime[1] * video.duration,
          );
          break;
        case 'left':
          newTime[0] = Math.min(relativeX, Math.max(newTime[1] - 0.1, 0));
          video.currentTime = newTime[0] * video.duration + 0.01;
          break;
        case 'right':
          newTime[1] = Math.max(relativeX, Math.min(newTime[0] + 0.1, 1));
          video.currentTime = newTime[1] * video.duration;
          break;
        case 'seek':
          {
            const currentTime =
              clamp(relativeX, state.time![0], state.time![1]) * video.duration;
            setCurrentTime(currentTime);
            video.currentTime = currentTime;
          }
          break;
      }

      onChange(newTime);
    },
    {
      onUp: state => {
        ignoreTimeUpdatesRef.current = false;
        if (typeof state.currentTime !== 'undefined') {
          video.currentTime = state.currentTime;
        }

        if (!state.paused) {
          video.play();
        }
      },
    },
  );

  useEffect(() => {
    const update = () => {
      setPlaying(!video.paused);

      if (!ignoreTimeUpdatesRef.current) {
        setCurrentTime(video.currentTime);
      }
    };

    video.addEventListener('pause', update);
    video.addEventListener('playing', update);
    video.addEventListener('play', update);
    video.addEventListener('timeupdate', update);

    return () => {
      video.removeEventListener('pause', update);
      video.removeEventListener('playing', update);
      video.removeEventListener('play', update);
      video.removeEventListener('timeupdate', update);
    };
  }, [video, setPlaying]);

  return (
    <>
      <div className={styles.controls}>
        <button
          onClick={() => {
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
          }}
        >
          {playing ? <BsPause /> : <BsPlay />}
        </button>
        <div className={styles.timeline} ref={timelineRef}>
          <div
            className={styles.range}
            style={{
              left: `${time[0] * 100}%`,
              right: `${100 - time[1] * 100}%`,
            }}
            onPointerDown={e => {
              e.stopPropagation();
              startDragging({
                direction: 'move',
                x: e.clientX,
                time,
                paused: video.paused,
              });
              video.pause();
            }}
          >
            <div
              className={clsx(styles.handleLeft, {
                [styles.active]: dragState?.direction === 'left',
              })}
              data-time={humanTime(time[0] * video.duration)}
              onPointerDown={e => {
                e.stopPropagation();
                startDragging({
                  direction: 'left',
                  currentTime,
                  paused: video.paused,
                });
                video.pause();
              }}
            />
            <div
              className={clsx(styles.handleRight, {
                [styles.active]: dragState?.direction === 'right',
              })}
              data-time={humanTime(time[1] * video.duration)}
              onPointerDown={e => {
                e.stopPropagation();
                startDragging({
                  direction: 'right',
                  currentTime,
                  paused: video.paused,
                });
                video.pause();
              }}
            />
          </div>
          <div
            className={clsx(styles.current, {
              [styles.active]: dragState?.direction === 'seek',
            })}
            style={{
              left: `${(currentTime / video.duration) * 100}%`,
            }}
            onPointerDown={e => {
              e.stopPropagation();
              startDragging({
                direction: 'seek',
                x: e.clientX,
                time,
                paused: video.paused,
              });
              video.pause();
            }}
            data-time={humanTime(currentTime)}
          ></div>
        </div>
      </div>
    </>
  );
};
