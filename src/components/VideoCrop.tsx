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

function ensureRatio(
  video: HTMLVideoElement,
  ratioH: number,
  ratioV: number,
  area: Area,
  direction: string,
): Area | undefined {
  const w = area[2];
  const h = area[3];

  const endH = direction.includes('e');
  const endV = direction.includes('s');
  let halfH = false;
  let halfV = false;

  let maxDimension = Math.max(w / ratioH, h / ratioV);

  const horizontal = direction.includes('e') || direction.includes('w');
  const vertical = direction.includes('n') || direction.includes('s');

  if (horizontal && !vertical) {
    maxDimension = w / ratioH;
    halfV = true;
  } else if (vertical && !horizontal) {
    maxDimension = h / ratioV;
    halfH = true;
  }

  let newWidth = area[2];
  let newHeight = area[3];

  if (ratioH > ratioV) {
    newWidth = maxDimension * ratioH;
    newHeight = (newWidth / ratioH) * ratioV;
  } else {
    newHeight = maxDimension * ratioV;
    newWidth = (newHeight / ratioV) * ratioH;
  }

  const rW = newWidth - w;
  const rH = newHeight - h;

  const newArea: Area = [...area];
  if (halfH) {
    newArea[0] -= rW / 2;
    newArea[2] += rW;
  } else if (endH) {
    newArea[2] += rW;
  } else {
    newArea[0] -= rW;
  }

  if (halfV) {
    newArea[1] -= rH / 2;
    newArea[3] += rH;
  } else if (endV) {
    newArea[3] += rH;
  } else {
    newArea[1] -= rH;
  }

  if (
    newArea[0] < 0 ||
    newArea[1] < 0 ||
    newArea[0] + newArea[2] >= video.videoWidth ||
    newArea[1] + newArea[3] >= video.videoHeight
  ) {
    // TODO: Fix this so the user can drag the area towards the edges.
    return undefined;
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
    direction: string;
    area?: number[];
  }>({
    preventDefault: true,
    stopPropagation: true,
    onMove: ({ x, y, deltaX, deltaY, state }) => {
      const rect = canvasPreviewRef.current!.getBoundingClientRect();

      const newArea: Area = [...area];

      if (state.direction === 'm') {
        newArea[0] = clamp(
          state.area![0] + (deltaX / rect.width) * video.videoWidth,
          0,
          video.videoWidth,
        );
        newArea[1] = clamp(
          state.area![1] + (deltaY / rect.height) * video.videoHeight,
          0,
          video.videoHeight,
        );
        onChange(newArea);
      } else {
        const relativeX = clamp(
          ((x - rect.left) / rect.width) * video.videoWidth,
          0,
          video.videoWidth,
        );
        const relativeY = clamp(
          ((y - rect.top) / rect.height) * video.videoHeight,
          0,
          video.videoHeight,
        );

        if (state.direction.includes('n')) {
          newArea[1] = Math.min(
            relativeY,
            Math.max(area[1] + area[3] - MIN_CROP_SIZE, 0),
          );
          newArea[3] += area[1] - newArea[1];
        } else if (state.direction.includes('s')) {
          newArea[3] = Math.max(
            relativeY - newArea[1],
            Math.min(MIN_CROP_SIZE, video.videoHeight),
          );
        }

        if (state.direction.includes('e')) {
          newArea[2] = Math.max(
            relativeX - newArea[0],
            Math.min(MIN_CROP_SIZE, video.videoWidth),
          );
        } else if (state.direction.includes('w')) {
          newArea[0] = Math.min(
            relativeX,
            Math.max(area[0] + area[2] - MIN_CROP_SIZE, 0),
          );
          newArea[2] += area[0] - newArea[0];
        }

        if (ratio) {
          const ensuredArea = ensureRatio(
            video,
            ratio[0],
            ratio[1],
            newArea,
            state.direction,
          );

          if (ensuredArea) {
            onChange(ensuredArea);
          }
        } else {
          onChange(newArea);
        }
      }
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
                const newRatio: Ratio = [+split[0], +split[1]];
                setRatio(newRatio);

                const ensuredArea = ensureRatio(
                  video,
                  newRatio[0],
                  newRatio[1],
                  area,
                  'se',
                );
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
            {...dragProps({ direction: 'm', area })}
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
                {...dragProps({ direction })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
