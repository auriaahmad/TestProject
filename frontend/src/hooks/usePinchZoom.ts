import { useRef, useEffect, useState, useCallback } from 'react';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

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
          4,
          Math.max(1, gestureState.current.initialScale * (dist / gestureState.current.initialDistance)),
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

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, transform.scale]);

  return { transform, reset };
}
