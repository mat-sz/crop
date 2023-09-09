import React, { useRef } from 'react';
import { IPointerDragData, usePointerDrag } from 'react-use-pointer-drag';

import styles from './Slider.module.scss';
import { clamp } from '../helpers';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange?(value: number): void;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleEvent = ({ x }: IPointerDragData<unknown>) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const value = clamp(
      ((x - rect.left) / rect.width) * (max - min) + min,
      min,
      max,
    );
    onChange?.(value);
  };

  const { dragProps } = usePointerDrag({
    preventDefault: true,
    stopPropagation: true,
    onClick: handleEvent,
    onMove: handleEvent,
  });
  return (
    <div className={styles.slider}>
      <div className={styles.track} ref={trackRef} {...dragProps()}>
        <div
          className={styles.thumb}
          style={{
            left: `${((value - min) / (max - min)) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};
