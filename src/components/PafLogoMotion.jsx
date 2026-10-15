import React, { useEffect, useRef, useState } from 'react';
import './PafLogoMotion.css';

export function PafLogoMotion({ compact = false, phase = 'idle' }) {
  const image = useRef(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth > 0) setReady(true);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return <span
    className={`paf-logo-motion ${compact ? 'pa-login-symbol' : 'pa-login-mark'}`}
    data-ready={ready}
    data-phase={phase}
    data-visible={visible}
    aria-hidden={compact ? true : undefined}
  >
    <span className="paf-logo-motion-stage">
      <img
        ref={image}
        className={compact ? undefined : 'pa-login-art'}
        src={compact ? '/brand/paf-symbol-official.png' : '/brand/paf-logo-official.png'}
        alt={compact ? '' : 'PAF Agricultura Familiar'}
        width={compact ? 44 : 1280}
        height={compact ? 44 : 1280}
        decoding="async"
        onLoad={() => setReady(true)}
      />
    </span>
  </span>;
}
