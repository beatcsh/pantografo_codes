import React, { useState, useRef, useEffect } from 'react';

/**
 * PageTransitionWrapper: Overlay circular reveal para transiciones de página.
 * Pasa onContentReady a la pantalla hija. El overlay desaparece solo cuando la pantalla hija llama a onContentReady.
 */
const PageTransitionWrapper = ({ children }) => {
  const [revealed, setRevealed] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const overlayRef = useRef();

  // Callback para la pantalla hija
  const handleContentReady = () => setContentReady(true);

  // Cuando el contenido está listo, dispara la animación de reveal
  useEffect(() => {
    if (contentReady) {
      setTimeout(() => setRevealed(true), 1600); // Espera a que termine la animación (1.6s)
    }
  }, [contentReady]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Pasa el callback a la pantalla hija */}
      <div style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.2s 1.2s' }}>
        {React.cloneElement(children, { onContentReady: handleContentReady })}
      </div>

      {/* Overlay circular */}
      {!revealed && (
        <div
          ref={overlayRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none',
            background: '#fff',
            animation: contentReady ? 'circularReveal 1.6s cubic-bezier(.4,2,.3,1) forwards' : 'none',
            clipPath: 'circle(0% at 50% 50%)',
          }}
        />
      )}
      <style>{`
        @keyframes circularReveal {
          0% {
            clip-path: circle(0% at 50% 50%);
            opacity: 1;
          }
          80% {
            clip-path: circle(120vw at 50% 50%);
            opacity: 1;
          }
          100% {
            clip-path: circle(150vw at 50% 50%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PageTransitionWrapper;
