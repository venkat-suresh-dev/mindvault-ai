const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.blob.vercel-storage.com",
  "frame-ancestors 'none'",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.blob.vercel-storage.com",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self' blob:",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY_REPORT_ONLY },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];
