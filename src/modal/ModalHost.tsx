import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import type React from "react";

type ModalControls<T> = {
  resolve: (value: T) => void;
  cancel: () => void;
};

type OpenRender<T> = (controls: ModalControls<T>) => ReactNode;

type OpenFunction = <T>(render: OpenRender<T>) => Promise<T | null>;

const ModalContext = createContext<OpenFunction | null>(null);

let externalOpenRef: OpenFunction | null = null;

export function setExternalOpen(fn: OpenFunction | null) {
  externalOpenRef = fn;
}

export function openWithRender<T>(render: OpenRender<T>): Promise<T | null> {
  if (!externalOpenRef) {
    return Promise.reject(new Error("ModalProvider is not mounted"));
  }
  return externalOpenRef(render);
}

export function useOpenModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useOpenModal must be used within ModalProvider");
  return ctx;
}

type PendingRequest = {
  render: OpenRender<any>;
  resolvePromise: (value: any) => void;
};

export function ModalProvider({ children }: PropsWithChildren) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const isOpen = !!pending;
  const [isMounted, setIsMounted] = useState(false);
  const [visualState, setVisualState] = useState<
    "open" | "closed" | "unmounted"
  >("unmounted");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const restoreFocusOnCloseRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const open = useCallback(<T,>(render: OpenRender<T>): Promise<T | null> => {
    return new Promise<T | null>((resolve) => {
      previousActiveElementRef.current =
        (document.activeElement as HTMLElement) || null;
      setPending({
        render: render as OpenRender<any>,
        resolvePromise: resolve as (value: any) => void,
      });
      setIsMounted(true);
      setVisualState("open");
    });
  }, []);

  useEffect(() => {
    setExternalOpen(open);
    return () => setExternalOpen(null);
  }, [open]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      prefersReducedMotionRef.current = mql.matches;
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  function handleKeydown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      cancel();
      return;
    }

    if (e.key === "Tab") {
      const container = dialogRef.current;
      if (!container) return;

      const tabbables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (el) =>
          !el.hasAttribute("aria-hidden") && el.tabIndex !== -1 && !el.hidden
      );

      if (tabbables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === container)) {
        e.preventDefault();
        last.focus();
      }
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) cancel();
  }

  function stopPropagation(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
  }

  const resolve = useCallback(
    (value: unknown) => {
      if (!pending) return;
      pending.resolvePromise(value as unknown);
      restoreFocusOnCloseRef.current = true;
      setVisualState("closed");
      if (prefersReducedMotionRef.current) {
        // 애니메이션이 꺼진 경우 즉시 언마운트 처리
        setIsMounted(false);
        setVisualState("unmounted");
        setPending(null);
        if (restoreFocusOnCloseRef.current) {
          queueMicrotask(() => {
            previousActiveElementRef.current?.focus?.();
            restoreFocusOnCloseRef.current = false;
          });
        }
      }
    },
    [pending]
  );

  const cancel = useCallback(() => {
    if (!pending) return;
    pending.resolvePromise(null);
    restoreFocusOnCloseRef.current = true;
    setVisualState("closed");
    if (prefersReducedMotionRef.current) {
      setIsMounted(false);
      setVisualState("unmounted");
      setPending(null);
      if (restoreFocusOnCloseRef.current) {
        queueMicrotask(() => {
          previousActiveElementRef.current?.focus?.();
          restoreFocusOnCloseRef.current = false;
        });
      }
    }
  }, [pending]);

  const controls = useMemo<ModalControls<any>>(
    () => ({ resolve, cancel }),
    [resolve, cancel]
  );

  const scrollContentRef = useRef<HTMLDivElement | null>(null);

  function isInsideDialog(node: EventTarget | null) {
    return node instanceof Node && !!dialogRef.current?.contains(node);
  }

  function isInsideScrollContent(node: EventTarget | null) {
    return node instanceof Node && !!scrollContentRef.current?.contains(node);
  }

  function handleWheelCapture(e: React.WheelEvent<HTMLDivElement>) {
    if (!isInsideDialog(e.target) || !isInsideScrollContent(e.target)) {
      e.preventDefault();
    }
  }

  function handleTouchMoveCapture(e: React.TouchEvent<HTMLDivElement>) {
    if (!isInsideDialog(e.target) || !isInsideScrollContent(e.target)) {
      e.preventDefault();
    }
  }

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setVisualState("open");
      return () => {
        // No body style manipulation needed
      };
    }
  }, [isOpen]);

  function handleOverlayAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (visualState === "closed") {
      setIsMounted(false);
      setVisualState("unmounted");
      setPending(null);
      if (restoreFocusOnCloseRef.current) {
        queueMicrotask(() => {
          previousActiveElementRef.current?.focus?.();
          restoreFocusOnCloseRef.current = false;
        });
      }
    }
  }

  const shouldRenderLayer = isMounted;

  return (
    <ModalContext.Provider value={open}>
      <div
        className={
          shouldRenderLayer ? "h-dvh max-h-dvh overflow-hidden" : undefined
        }
      >
        {children}
      </div>
      {shouldRenderLayer ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
          data-part="overlay"
          data-state={visualState === "open" ? "open" : "closed"}
          onClick={handleOverlayClick}
          onKeyDown={handleKeydown}
          tabIndex={-1}
          onWheelCapture={handleWheelCapture}
          onTouchMoveCapture={handleTouchMoveCapture}
          onAnimationEnd={handleOverlayAnimationEnd}
        >
          {/* 각 모달 컴포넌트(FormModal)에서 role/aria-*를 설정합니다. */}
          <div
            className="w-[min(560px,92vw)] max-h-[80dvh] rounded-xl bg-white p-5 shadow-xl outline-none dark:bg-zinc-900"
            data-part="content"
            data-state={visualState === "open" ? "open" : "closed"}
            onClick={stopPropagation}
            onKeyDown={handleKeydown}
            ref={dialogRef}
          >
            <div
              ref={scrollContentRef}
              className="max-h-[70dvh] overflow-auto overscroll-contain"
            >
              {pending?.render(controls as ModalControls<any>)}
            </div>
          </div>
        </div>
      ) : null}
    </ModalContext.Provider>
  );
}
