import { useRef, useEffect, useState, useCallback } from 'react';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.5;

export function usePinchZoom(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const gestureState = useRef({
    initialDistance: 0,
    initialScale: 1,
    isPinching: false,
    isPanning: false,
    lastX: 0,
    lastY: 0,
  });

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => {
      const newScale = Math.max(MIN_SCALE, prev.scale - ZOOM_STEP);
      // Reset pan when zooming back to 1
      if (newScale <= 1) return { scale: 1, x: 0, y: 0 };
      return { ...prev, scale: newScale };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function getDistance(t1: Touch, t2: Touch) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        gestureState.current.isPinching = true;
        gestureState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
        gestureState.current.initialScale = transform.scale;
      } else if (e.touches.length === 1 && transform.scale > 1) {
        gestureState.current.isPanning = true;
        gestureState.current.lastX = e.touches[0].clientX;
        gestureState.current.lastY = e.touches[0].clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (gestureState.current.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, gestureState.current.initialScale * (dist / gestureState.current.initialDistance)),
        );
        setTransform((prev) => ({ ...prev, scale: newScale }));
      } else if (gestureState.current.isPanning && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - gestureState.current.lastX;
        const dy = e.touches[0].clientY - gestureState.current.lastY;
        gestureState.current.lastX = e.touches[0].clientX;
        gestureState.current.lastY = e.touches[0].clientY;
        setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      }
    }

    function onTouchEnd() {
      gestureState.current.isPinching = false;
      gestureState.current.isPanning = false;
    }

    // Mouse wheel zoom
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
      setTransform((prev) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta));
        if (newScale <= 1) return { scale: 1, x: 0, y: 0 };
        return { ...prev, scale: newScale };
      });
    }

    // Mouse drag to pan when zoomed
    let isDragging = false;
    let dragLastX = 0;
    let dragLastY = 0;

    function onMouseDown(e: MouseEvent) {
      if (transform.scale > 1 && e.button === 0) {
        isDragging = true;
        dragLastX = e.clientX;
        dragLastY = e.clientY;
        el!.style.cursor = 'grabbing';
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;
      const dx = e.clientX - dragLastX;
      const dy = e.clientY - dragLastY;
      dragLastX = e.clientX;
      dragLastY = e.clientY;
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }

    function onMouseUp() {
      isDragging = false;
      if (el) el.style.cursor = '';
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [containerRef, transform.scale]);

  return { transform, reset, zoomIn, zoomOut };
}
