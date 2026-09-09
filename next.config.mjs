/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // optional: ignore all lint errors on build
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // allow all HTTPS hosts
      },
      {
        protocol: "http",
        hostname: "**", // allow all HTTP hosts (optional)
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/about_us',
        destination: '/about-us',
        permanent: true,
      },
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.htm',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
      style-src 'self' 'unsafe-inline' https:;
      img-src 'self' data: https:;
      font-src 'self' data: https:;
      connect-src 'self' https:;
      frame-src 'self' https:;
      child-src 'self' https:;
    `.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(self), geolocation=(self)",
          },
        ],
      },
    ];
  }

};

export default nextConfig;
