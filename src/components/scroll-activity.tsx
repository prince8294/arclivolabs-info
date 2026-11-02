"use client";

import { useEffect } from "react";

const hideDelay = 900;

/**
 * Shows a slim scrollbar only while the user is actively scrolling, then fades it out.
 * The scrollbar styling lives in globals.css and keys off the `is-scrolling` class.
 */
export function ScrollActivity() {
  useEffect(() => {
    const root = document.documentElement;
    let timer: number | undefined;
    let frame = 0;

    const scheduleHide = () => {
      root.classList.add("is-scrolling");
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
        timer = undefined;
      }, hideDelay);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scheduleHide();
      });
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      if (frame) window.cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
      root.classList.remove("is-scrolling");
    };
  }, []);

  return null;
}
