import { useEffect, useRef, useCallback } from 'react';

const DEFAULT_IGNORE =
  '[draggable="true"], button, a, input, select, textarea, [data-no-drag-scroll]';

export function useDragScroll({ ignoreSelector = DEFAULT_IGNORE } = {}) {
  const ref = useRef(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: null,
    moved: false,
  });

  const shouldIgnore = useCallback(
    (target) => {
      if (!target?.closest) return true;
      return Boolean(target.closest(ignoreSelector));
    },
    [ignoreSelector]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const stopDrag = () => {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      element.classList.remove('is-drag-scrolling');
      if (dragState.current.pointerId != null) {
        try {
          element.releasePointerCapture(dragState.current.pointerId);
        } catch {
          // Pointer may already be released.
        }
      }
      dragState.current.pointerId = null;
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      if (shouldIgnore(event.target)) return;
      if (element.scrollWidth <= element.clientWidth) return;

      dragState.current = {
        active: true,
        startX: event.clientX,
        scrollLeft: element.scrollLeft,
        pointerId: event.pointerId,
        moved: false,
      };

      element.setPointerCapture(event.pointerId);
      element.classList.add('is-drag-scrolling');
    };

    const onPointerMove = (event) => {
      if (!dragState.current.active) return;

      const deltaX = event.clientX - dragState.current.startX;
      if (Math.abs(deltaX) > 3) {
        dragState.current.moved = true;
      }

      element.scrollLeft = dragState.current.scrollLeft - deltaX;
    };

    const onPointerUp = () => stopDrag();
    const onPointerCancel = () => stopDrag();

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerCancel);
    element.addEventListener('dragstart', (event) => {
      if (dragState.current.active) event.preventDefault();
    });

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [shouldIgnore]);

  return ref;
}
