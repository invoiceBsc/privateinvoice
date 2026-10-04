"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Moves one indicator element under the `[data-active="true"]` child of a container.
 * The first placement is instant so nothing slides in on page load; later changes glide.
 * Writes styles directly to the DOM to avoid re-rendering the control.
 */
export function useSlidingIndicator<C extends HTMLElement>(active: string) {
  const containerRef = useRef<C>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const place = useCallback((animate: boolean) => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const target = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!target) {
      indicator.style.opacity = "0";
      return;
    }
    if (!animate) indicator.style.transition = "none";
    indicator.style.opacity = "1";
    indicator.style.width = target.offsetWidth + "px";
    indicator.style.height = target.offsetHeight + "px";
    indicator.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    if (!animate) {
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
  }, []);
  useLayoutEffect(() => {
    place(placed.current);
    placed.current = true;
  }, [active, place]);
  // Layout changes (resize, font load, label language) snap without animating.
  // The observer's initial callback is skipped so it never cancels a running slide.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let initial = true;
    const observer = new ResizeObserver(() => {
      if (initial) {
        initial = false;
        return;
      }
      place(false);
    });
    observer.observe(container);
    container
      .querySelectorAll("[data-active]")
      .forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [place]);
  return { containerRef, indicatorRef };
}

/**
 * Shows an exact formatted amount, and counts from the previous value when it changes.
 * The first render and the final frame always show the exact string.
 */
export function AnimatedAmount({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  // Layout effect: the counter must take over before paint, or the new value flashes first.
  useLayoutEffect(() => {
    const node = ref.current;
    const from = Number(previous.current.replace(/,/g, ""));
    const to = Number(value.replace(/,/g, ""));
    previous.current = value;
    // Mutate React's own text node instead of replacing it.
    const text = node?.firstChild;
    if (!node || !text || from === to || reducedMotion()) return;
    const decimals = value.split(".")[1]?.length ?? 2;
    const format = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const start = performance.now();
    const duration = 650;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      text.nodeValue =
        t < 1 ? format.format(from + (to - from) * eased) : value;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    text.nodeValue = format.format(from);
    frame = requestAnimationFrame(tick);
    node.classList.remove("value-changed");
    void node.offsetWidth;
    node.classList.add("value-changed");
    return () => {
      cancelAnimationFrame(frame);
      text.nodeValue = value;
    };
  }, [value]);
  return (
    <span ref={ref} className="animated-amount">
      {value}
    </span>
  );
}

/** Adds a one-shot class when `value` changes after the first render. */
export function useChangePulse<T extends HTMLElement>(
  value: string,
  className = "just-changed",
) {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || previous.current === value) return;
    previous.current = value;
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
  }, [value, className]);
  return ref;
}

/** Gentle pointer-follow tilt for a showcase surface. */
export function useTilt<T extends HTMLElement>(max = 5) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion() || !matchMedia("(pointer: fine)").matches)
      return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--tilt-x", (-y * max).toFixed(2) + "deg");
        node.style.setProperty("--tilt-y", (x * max).toFixed(2) + "deg");
        node.style.setProperty("--glare-x", ((x + 0.5) * 100).toFixed(1) + "%");
        node.style.setProperty("--glare-y", ((y + 0.5) * 100).toFixed(1) + "%");
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return ref;
}
