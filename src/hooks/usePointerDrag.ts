import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Event object to be applied on the target element.
 * <div {...events} />
 */
export interface IPointerDragEvents {
  onPointerDown: (e: React.PointerEvent) => void;
}

export interface IPointerDragReturnBase {
  isDragging: boolean;
}

export interface IPointerDragReturnWithState<T> extends IPointerDragReturnBase {
  /**
   * Function to be manually called when dragging begins.
   */
  startDragging(state: T): void;

  dragProps(state: T): IPointerDragEvents;

  /**
   * Current drag state. Undefined if not moving.
   */
  dragState?: T;
}

export interface IPointerDragReturnWithoutState extends IPointerDragReturnBase {
  /**
   * Function to be manually called when dragging begins.
   */
  startDragging(): void;

  dragProps(): IPointerDragEvents;

  dragState?: undefined;
}

export interface IPointerDragData<T> {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  startX: number;
  startY: number;
  distance: number;
  isDragging: boolean;
  state: T;
  setState: React.Dispatch<React.SetStateAction<T | undefined>>;
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

  onClick?: (state: IPointerDragData<T>) => void;
  onStart?: (state: IPointerDragData<T>) => void;
  onMove?: (state: IPointerDragData<T>) => void;
  onEnd?: (state: IPointerDragData<T>) => void;

  minTime?: number;
  minDistance?: number;
}

/**
 * Common mouse/touch hold and move actions.
 * @param updatePosition Function to be called with clientX and clientY when mouse/touch is down and dragged.
 * @returns IPointerDragState
 */

export function usePointerDrag<T>(
  options: IPointerDragOptions<T>,
): unknown extends T
  ? IPointerDragReturnWithoutState
  : IPointerDragReturnWithState<T>;
export function usePointerDrag<T>(
  options: IPointerDragOptions<T>,
): IPointerDragReturnWithoutState | IPointerDragReturnWithState<T> {
  const [dragState, setDragState] = useState<T | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const infoRef = useRef<{
    x: number;
    y: number;
    startedAt: number;
    dragging: boolean;
  }>({ x: 0, y: 0, startedAt: 0, dragging: false });
  const optionsRef = useRef(options);
  const dragStateRef = useRef(dragState);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!isStarted) {
      return;
    }

    const {
      stopPropagation = true,
      preventDefault = true,
      onClick,
      onStart,
      onMove,
      onEnd,
      minTime,
      minDistance,
    } = optionsRef.current;

    const getData = (
      e: PointerEvent | React.PointerEvent,
    ): IPointerDragData<T> => {
      return {
        x: e.clientX,
        y: e.clientY,
        state: dragStateRef.current!,
        setState: setDragState,
        deltaX: e.clientX - infoRef.current.x,
        deltaY: e.clientY - infoRef.current.y,
        startX: infoRef.current.x,
        startY: infoRef.current.y,
        distance: Math.sqrt(
          Math.pow(e.clientX - infoRef.current.x, 2) +
            Math.pow(e.clientY - infoRef.current.y, 2),
        ),
        isDragging: infoRef.current.dragging,
      };
    };

    const handleEvent = (e: PointerEvent) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
    };

    const handleMove = (e: PointerEvent) => {
      const data = getData(e);

      if (!infoRef.current.dragging) {
        if (
          (!minTime || Date.now() > infoRef.current.startedAt + minTime) &&
          (!minDistance || data.distance > minDistance)
        ) {
          handleEvent(e);
          infoRef.current.dragging = true;
          onStart?.(data);
        }
      } else {
        handleEvent(e);
        onMove?.(data);
      }
    };

    const handleUp = (e: PointerEvent) => {
      const data = getData(e);
      if (!infoRef.current.dragging) {
        onClick?.(data);
      } else {
        handleEvent(e);
      }

      onEnd?.(data);
      setDragState(undefined);
      setIsDragging(false);
      setIsStarted(false);
      infoRef.current.dragging = false;
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, [isStarted]);

  const startDragging = useCallback(
    (state?: T) => {
      setDragState(state);
      setIsStarted(true);
      setIsDragging(true);
      infoRef.current.dragging = true;
    },
    [setDragState, setIsStarted, setIsDragging],
  );

  const dragProps = useCallback(
    (state?: T) => {
      return {
        onPointerDown: (e: React.PointerEvent) => {
          if (e.pointerType === 'mouse' && e.button !== 0) {
            // Ignore right click.
            return;
          }

          const { stopPropagation = true, preventDefault = true } =
            optionsRef.current;

          if (preventDefault) e.preventDefault();
          if (stopPropagation) e.stopPropagation();

          setDragState(state);
          setIsStarted(true);
          infoRef.current = {
            x: e.clientX,
            y: e.clientY,
            startedAt: Date.now(),
            dragging: false,
          };
        },
      };
    },
    [setDragState, setIsStarted],
  );

  return {
    startDragging,
    dragState,
    isDragging,
    dragProps,
  } as IPointerDragReturnWithState<T> | IPointerDragReturnWithoutState;
}
