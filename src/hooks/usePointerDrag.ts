import { useState, useEffect, useCallback } from 'react';

/**
 * Event object to be applied on the target element.
 * <div {...events} />
 */
export interface IPointerDragEvents {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

export interface IPointerDragState<T> {
  /**
   * Function to be called when dragging begins.
   */
  startDragging: (state: T) => void;

  /**
   * Current drag state. Undefined if not moving.
   */
  dragState?: T;
}

export interface IPointerDragOptions<T> {
  /**
   * If set to true, stopPropagation will be called.
   * Default: true.
   */
  stopPropagation?: boolean;

  /**
   * If set to true, preventDefault will be called.
   * Default: true.
   */
  preventDefault?: boolean;

  onUp?: (state: T) => void;
}

/**
 * Common mouse/touch hold and move actions.
 * @param updatePosition Function to be called with clientX and clientY when mouse/touch is down and dragged.
 * @returns IPointerDragState
 */
export function usePointerDrag<T>(
  updatePosition: (x: number, y: number, dragState: T) => void,
  options: IPointerDragOptions<T> = {},
): IPointerDragState<T> {
  const [dragState, setDragState] = useState<T | undefined>(undefined);

  const { stopPropagation = true, preventDefault = true, onUp } = options;

  useEffect(() => {
    if (typeof dragState === 'undefined') {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();

      updatePosition(e.clientX, e.clientY, dragState);
    };

    const handleUp = () => {
      onUp?.(dragState);
      setDragState(undefined);
    };

    document.addEventListener('pointermove', handleMouseMove);
    document.addEventListener('pointerup', handleUp);

    return () => {
      document.removeEventListener('pointermove', handleMouseMove);
      document.removeEventListener('pointerup', handleUp);
    };
  });

  const startDragging = useCallback(
    (state: T) => setDragState(state),
    [setDragState],
  );

  return {
    startDragging,
    dragState,
  };
}
