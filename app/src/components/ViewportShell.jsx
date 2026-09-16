import { useEffect, useRef } from "react";

// Safari's keyboard changes the visual viewport without changing 100vh.
export function ViewportShell({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      ref.current?.style.setProperty("--visible-height", `${viewport?.height || window.innerHeight}px`);
      ref.current?.style.setProperty("--visible-top", `${viewport?.offsetTop || 0}px`);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return <div ref={ref} className="solvik-app-shell">{children}</div>;
}
