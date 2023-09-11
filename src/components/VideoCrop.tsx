import React, { useEffect, useRef, useState } from 'react';
import { usePointerDrag } from 'react-use-pointer-drag';

import styles from './VideoCrop.module.scss';
import { clamp } from '../helpers';
import { Area, Ratio, VideoTransform } from '../types';

const MIN_CROP_SIZE = 100;

interface VideoCropProps {
  onChange: (area: Area) => void;
  transform: VideoTransform;
  video: HTMLVideoElement;
}

function ensureRatio(ratio: Ratio, area: Area): Area {
  const newArea: Area = [...area];

  if (ratio > 1) {
    newArea[3] = newArea[2] / ratio;
  } else {
    newArea[2] = newArea[3] * ratio;
  }

  return newArea;
}

const handleDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const VideoCrop: React.FC<VideoCropProps> = ({
  transform,
  onChange,
  video,
}) => {
  const { area = [0, 0, video.videoWidth, video.videoHeight] } = transform;
  const [ratioName, setRatioName] = useState('free');
  const [ratio, setRatio] = useState<Ratio>();
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef(area);

  useEffect(() => {
    areaRef.current = area;
  }, [area]);

  const { dragProps } = usePointerDrag<{
    dirX: number;
    dirY: number;
    area: Area;
  }>({
    preventDefault: true,
    stopPropagation: true,
    onMove: ({ x, y, deltaX, deltaY, state: { dirX, dirY, area } }) => {
      const rect = canvasPreviewRef.current!.getBoundingClientRect();

      const newArea: Area = [...area];

      if (dirX === 0 && dirY === 0) {
        newArea[0] = clamp(
          area[0] + deltaX / (rect.width / video.videoWidth),
          0,
          video.videoWidth - area[2],
        );
        newArea[1] = clamp(
          area[1] + deltaY / (rect.height / video.videoHeight),
          0,
          video.videoHeight - area[3],
        );
      } else {
        const relativeX = clamp(
          (x - rect.left) / (rect.width / video.videoWidth),
          0,
          video.videoWidth,
        );
        const relativeY = clamp(
          (y - rect.top) / (rect.height / video.videoHeight),
          0,
          video.videoHeight,
        );

        const endX = area[0] + area[2];
        const endY = area[1] + area[3];

        if (ratio) {
          const dX = dirX === -1 ? area[0] - relativeX : relativeX - endX;
          const dY = dirY === -1 ? area[1] - relativeY : relativeY - endY;

          const cX = endX - area[2] / 2;
          const cY = endY - area[3] / 2;

          const newMaxWidth = area[2] + dX;
          const newMaxHeight = area[3] + dY;

          let newWidth = MIN_CROP_SIZE;

          if (dirX === 0) {
            newWidth = Math.min(
              cX * 2,
              (video.videoWidth - cX) * 2,
              newMaxHeight * ratio,
            );
          } else if (dirY === 0) {
            newWidth = Math.min(
              cY * 2 * ratio,
              (video.videoHeight - cY) * 2 * ratio,
              newMaxWidth,
            );
          } else {
            const maxWidth = dirX === -1 ? endX : video.videoWidth - area[0];
            const maxHeight = dirY === -1 ? endY : video.videoHeight - area[1];

            newWidth = Math.max(
              Math.min(maxWidth, newMaxHeight * ratio),
              Math.min(newMaxWidth, maxHeight * ratio),
            );
          }

          newWidth = Math.max(
            MIN_CROP_SIZE / (dirY === 0 ? 1 : ratio),
            newWidth,
          );
          const newHeight = newWidth / ratio;

          newArea[0] -= (area[2] - newWidth) * (0.5 * dirX - 0.5);
          newArea[1] -= (area[3] - newHeight) * (0.5 * dirY - 0.5);
          newArea[2] = newWidth;
          newArea[3] = newHeight;
        } else {
          if (dirY === -1) {
            newArea[1] = Math.min(relativeY, Math.max(endY - MIN_CROP_SIZE, 0));
            newArea[3] = endY - newArea[1];
          } else if (dirY === 1) {
            newArea[3] = Math.max(
              relativeY - newArea[1],
              Math.min(MIN_CROP_SIZE, video.videoHeight),
            );
          }

          if (dirX === -1) {
            newArea[0] = Math.min(relativeX, Math.max(endX - MIN_CROP_SIZE, 0));
            newArea[2] = endX - newArea[0];
          } else if (dirX === 1) {
            newArea[2] = Math.max(
              relativeX - newArea[0],
              Math.min(MIN_CROP_SIZE, video.videoWidth),
            );
          }
        }
      }

      onChange(newArea);
    },
  });

  useEffect(() => {
    let updating = true;

    const canvas = canvasPreviewRef.current;
    const context = canvas?.getContext('2d');

    const update = () => {
      if (canvas && context) {
        context.filter = 'none';
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.save();
        if (transform.flipH) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        if (transform.flipV) {
          context.translate(0, canvas.height);
          context.scale(1, -1);
        }

        context.filter = 'blur(5px) brightness(0.25)';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const area = areaRef.current;

        const x =
          (transform.flipH ? video.videoWidth - area[2] - area[0] : area[0]) *
          (video.videoWidth / canvas.width);
        const y =
          (transform.flipV ? video.videoHeight - area[3] - area[1] : area[1]) *
          (video.videoHeight / canvas.height);
        const w = area[2] * (video.videoWidth / canvas.width);
        const h = area[3] * (video.videoHeight / canvas.height);

        context.filter = 'none';
        context.drawImage(video, x, y, w, h, x, y, w, h);
        context.restore();
      }

      if (updating) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);

    return () => {
      updating = false;
    };
  }, [video, transform]);

  const cropWidth = Math.trunc(area[2] / 2) * 2;
  const cropHeight = Math.trunc(area[3] / 2) * 2;

  return (
    <div>
      <div className={styles.options}>
        <div className="select">
          <select
            value={ratioName}
            onChange={e => {
              const name = e.target.value;
              setRatioName(name);

              if (name !== 'free') {
                const split = name.split(':');
                const newRatio = +split[0] / +split[1];
                setRatio(newRatio);

                const ensuredArea = ensureRatio(newRatio, area);
                if (ensuredArea) {
                  onChange(ensuredArea);
                }
              } else {
                setRatio(undefined);
              }
            }}
          >
            <option value="free">Free</option>
            <option value="1:1">1:1</option>
            <option value="2:3">2:3</option>
            <option value="3:2">3:2</option>
            <option value="3:4">3:4</option>
            <option value="4:3">4:3</option>
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
          </select>
        </div>
      </div>
      <div className={styles.crop}>
        <canvas
          width={video.videoWidth}
          height={video.videoHeight}
          className={styles.videoPreview}
          ref={canvasPreviewRef}
        />
        <div
          className={styles.box}
          style={{
            left: `${(area[0] / video.videoWidth) * 100}%`,
            top: `${(area[1] / video.videoHeight) * 100}%`,
            width: `${(area[2] / video.videoWidth) * 100}%`,
            height: `${(area[3] / video.videoHeight) * 100}%`,
          }}
        >
          <div className={styles.dimensions}>
            {cropWidth}px x {cropHeight}px
          </div>
          <svg
            viewBox="0 0 90 90"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            {...dragProps({ dirX: 0, dirY: 0, area })}
          >
            <line
              x1="30"
              y1="0"
              x2="30"
              y2="90"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="60"
              y1="0"
              x2="60"
              y2="90"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="30"
              x2="90"
              y2="30"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="60"
              x2="90"
              y2="60"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className={styles.handles}>
            {handleDirections.map(direction => (
              <div
                key={direction}
                className={styles[`handle-${direction}`]}
                style={{ cursor: `${direction}-resize` }}
                {...dragProps({
                  dirX: direction.includes('e')
                    ? 1
                    : direction.includes('w')
                    ? -1
                    : 0,
                  dirY: direction.includes('s')
                    ? 1
                    : direction.includes('n')
                    ? -1
                    : 0,
                  area,
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
