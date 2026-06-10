import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  {
    // Report-Only on purpose: observe violations in the browser console
    // before enforcing. Promote to Content-Security-Policy in a follow-up.
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      // Next.js inline runtime + styled JSX need unsafe-inline until nonces are wired
      "script-src 'self' 'unsafe-inline' https://apis.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      // Firebase Auth + Firestore + Identity Toolkit + FCM
      "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com",
      "frame-src 'self' https://*.firebaseapp.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Standalone mode copies only the files needed to run in production,
  // skipping the full node_modules — cuts Docker image size significantly.
  output: "standalone",
  // Keep firebase-admin (and its transitive jwks-rsa → jose ESM-only chain) out
  // of the bundle so it is loaded from node_modules at runtime as real Node
  // modules. firebase-admin 14 → jwks-rsa 4 → jose 6 is pure ESM and must be
  // require()-d by a Node runtime that supports require(ESM) (Node ≥ 22.12, see
  // engines.node), not rewritten by the bundler.
  serverExternalPackages: ['firebase-admin'],
  allowedDevOrigins: ['192.168.1.114'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
