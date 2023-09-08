import React, { useEffect, useRef, useState } from 'react';
import { usePointerDrag } from 'react-use-pointer-drag';

import styles from './VideoCrop.module.scss';
import { clamp } from '../helpers';
import { mainStore } from '../stores/main';

interface VideoCropProps {
  onChange: (area: number[]) => void;
  area: number[];
  video: HTMLVideoElement;
}

function ensureRatio(
  video: HTMLVideoElement,
  ratioH: number,
  ratioV: number,
  area: number[],
  direction: string,
) {
  const oldW = area[2] - area[0];
  const oldH = area[3] - area[1];
  const w = oldW * video.videoWidth;
  const h = oldH * video.videoHeight;

  const endH = direction.includes('e');
  const endV = direction.includes('s');
  let halfH = false;
  let halfV = false;

  const maxWidth = (endH ? 1 - area[0] : area[2]) * video.videoWidth;
  const maxHeight = (endV ? 1 - area[1] : area[3]) * video.videoHeight;

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

  let newWidth = maxWidth;
  let newHeight = maxHeight;

  if (ratioH > ratioV) {
    newWidth = Math.min(maxDimension * ratioH, maxWidth);
    newHeight = (newWidth / ratioH) * ratioV;

    if (newHeight > maxHeight) {
      newWidth = (maxHeight / ratioV) * ratioH;
      newHeight = maxHeight;
    }
  } else {
    newHeight = Math.min(maxDimension * ratioV, maxHeight);
    newWidth = (newHeight / ratioV) * ratioH;

    if (newWidth > maxWidth) {
      newHeight = (maxWidth / ratioH) * ratioV;
      newWidth = maxWidth;
    }
  }

  const rW = newWidth / video.videoWidth;
  const rH = newHeight / video.videoHeight;

  const newArea = [...area];
  if (halfH) {
    newArea[0] = newArea[0] - (rW - oldW) / 2;
    newArea[2] = newArea[0] + rW;
  } else if (endH) {
    newArea[2] = newArea[0] + rW;
  } else {
    newArea[0] = newArea[2] - rW;
  }

  if (halfV) {
    newArea[1] = newArea[1] - (rH - oldH) / 2;
    newArea[3] = newArea[1] + rH;
  } else if (endV) {
    newArea[3] = newArea[1] + rH;
  } else {
    newArea[1] = newArea[3] - rH;
  }

  return newArea;
}

export const VideoCrop: React.FC<VideoCropProps> = ({
  area,
  onChange,
  video,
}) => {
  const [ratioName, setRatioName] = useState('free');
  const [ratio, setRatio] = useState<[number, number]>();
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef(area);

  useEffect(() => {
    areaRef.current = area;
  }, [area]);

  const { dragProps } = usePointerDrag<{
    direction: string;
    area?: number[];
  }>({
    onMove: ({ x, y, deltaX, deltaY, state }) => {
      const rect = canvasPreviewRef.current!.getBoundingClientRect();

      let newArea = [...area];

      if (state.direction === 'm') {
        const relativeX = clamp(
          deltaX / rect.width,
          -1 * state.area![0],
          1 - state.area![2],
        );
        const relativeY = clamp(
          deltaY / rect.height,
          -1 * state.area![1],
          1 - state.area![3],
        );
        newArea[0] = state.area![0] + relativeX;
        newArea[2] = state.area![2] + relativeX;
        newArea[1] = state.area![1] + relativeY;
        newArea[3] = state.area![3] + relativeY;
      } else {
        const relativeX = clamp((x - rect.left) / rect.width, 0, 1);
        const relativeY = clamp((y - rect.top) / rect.height, 0, 1);

        if (state.direction.includes('n')) {
          newArea[1] = Math.min(relativeY, Math.max(newArea[3] - 0.1, 0));
        } else if (state.direction.includes('s')) {
          newArea[3] = Math.max(relativeY, Math.min(newArea[1] + 0.1, 1));
        }

        if (state.direction.includes('e')) {
          newArea[2] = Math.max(relativeX, Math.min(newArea[0] + 0.1, 1));
        } else if (state.direction.includes('w')) {
          newArea[0] = Math.min(relativeX, Math.max(newArea[2] - 0.1, 0));
        }

        if (ratio) {
          newArea = ensureRatio(
            video,
            ratio[0],
            ratio[1],
            newArea,
            state.direction,
          );
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
        if (mainStore.flipH) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        if (mainStore.flipV) {
          context.translate(0, canvas.height);
          context.scale(1, -1);
        }

        context.filter = 'blur(5px) brightness(0.25)';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const area = areaRef.current;
        const rX = mainStore.flipH ? 1 - area[2] : area[0];
        const rY = mainStore.flipV ? 1 - area[3] : area[1];

        const x = rX * canvas.width;
        const y = rY * canvas.height;
        const w = (area[2] - area[0]) * canvas.width;
        const h = (area[3] - area[1]) * canvas.height;

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
  }, [video]);

  const cropWidth = Math.floor((area[2] - area[0]) * video.videoWidth);
  const cropHeight = Math.floor((area[3] - area[1]) * video.videoHeight);

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
                const newRatio = [+split[0], +split[1]] as [number, number];
                setRatio(newRatio);
                onChange(
                  ensureRatio(video, newRatio[0], newRatio[1], area, 'se'),
                );
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
            left: `${area[0] * 100}%`,
            top: `${area[1] * 100}%`,
            right: `${100 - area[2] * 100}%`,
            bottom: `${100 - area[3] * 100}%`,
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
            <div
              className={styles.handleNW}
              {...dragProps({ direction: 'nw' })}
            />
            <div
              className={styles.handleN}
              {...dragProps({ direction: 'n' })}
            />
            <div
              className={styles.handleNE}
              {...dragProps({ direction: 'ne' })}
            />
            <div
              className={styles.handleE}
              {...dragProps({ direction: 'e' })}
            />
            <div
              className={styles.handleSE}
              {...dragProps({ direction: 'se' })}
            />
            <div
              className={styles.handleS}
              {...dragProps({ direction: 's' })}
            />
            <div
              className={styles.handleSW}
              {...dragProps({ direction: 'sw' })}
            />
            <div
              className={styles.handleW}
              {...dragProps({ direction: 'w' })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
