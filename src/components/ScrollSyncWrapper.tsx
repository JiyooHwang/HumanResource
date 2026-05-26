"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function ScrollSyncWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const topBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = useState(0);
  const syncing = useRef(false);

  const measure = useCallback(() => {
    if (contentRef.current) {
      setInnerWidth(contentRef.current.scrollWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [measure]);

  function onTopScroll() {
    if (syncing.current) return;
    syncing.current = true;
    if (topBarRef.current && contentRef.current) {
      contentRef.current.scrollLeft = topBarRef.current.scrollLeft;
    }
    syncing.current = false;
  }

  function onContentScroll() {
    if (syncing.current) return;
    syncing.current = true;
    if (topBarRef.current && contentRef.current) {
      topBarRef.current.scrollLeft = contentRef.current.scrollLeft;
    }
    syncing.current = false;
  }

  return (
    <>
      <div
        ref={topBarRef}
        onScroll={onTopScroll}
        className="overflow-x-auto sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-lg"
        style={{ height: 16 }}
      >
        <div style={{ width: innerWidth, height: 1 }} />
      </div>
      <div
        ref={contentRef}
        onScroll={onContentScroll}
        className="overflow-x-auto"
      >
        {children}
      </div>
    </>
  );
}
