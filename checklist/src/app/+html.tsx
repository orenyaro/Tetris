import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const BASE = '/Tetris';

// Dark page background so there's no white flash before the app mounts.
const backgroundStyle = `
  html, body, #root { background-color: #0E0E11; }
  body { overscroll-behavior-y: none; }
`;

// Register the service worker (enables installability + offline).
const swRegister = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('${BASE}/sw.js').catch(function () {});
    });
  }
`;

/**
 * Custom HTML document for the web build. Adds the PWA manifest, Apple
 * "Add to Home Screen" metadata, the dark theme color, and the service worker
 * so the app installs to the home screen on iOS and Android.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0E0E11" />

        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="הרשימות שלנו" />
        <link rel="apple-touch-icon" href={`${BASE}/apple-touch-icon.png`} />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: backgroundStyle }} />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
