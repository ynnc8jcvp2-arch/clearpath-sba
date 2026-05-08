/**
 * Cloudflare Turnstile CAPTCHA Component
 *
 * Renders invisible or managed Turnstile widget.
 * Calls onVerify(token) when user passes challenge.
 *
 * Usage:
 *   <Turnstile onVerify={setToken} />
 *   then submit `token` to backend for server-side verification.
 */

import { useEffect, useRef, useCallback } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function Turnstile({ onVerify, onError, action = 'submit', theme = 'light', size = 'normal' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;

    // Remove existing widget
    if (widgetIdRef.current !== null) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      action,
      theme,
      size,
      callback: (token) => onVerify?.(token),
      'error-callback': (err) => {
        console.error('[Turnstile] Error:', err);
        onError?.(err);
      },
      'expired-callback': () => {
        onVerify?.(null);
      },
    });
  }, [onVerify, onError, action, theme, size]);

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn('VITE_TURNSTILE_SITE_KEY not set — skipping Turnstile');
      return;
    }

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      // Script tag exists but not loaded yet — wait
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(check);
    }

    return () => {
      if (widgetIdRef.current !== null) {
        try { window.turnstile?.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="flex justify-center my-3" />;
}

/**
 * Verify Turnstile token server-side
 */
export async function verifyTurnstileToken(token) {
  if (!token) return false;

  try {
    const res = await fetch('/api/v1/auth/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export default Turnstile;
