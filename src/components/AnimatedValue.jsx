import { useEffect, useState } from 'react';

export function AnimatedValue({ value }) {
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!numeric || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    let frame;
    const start = performance.now();
    const update = now => {
      const progress = Math.min((now - start) / 650, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value, numeric]);
  return <span aria-label={String(value)}>{numeric ? Number(display).toLocaleString('pt-BR') : value}</span>;
}
