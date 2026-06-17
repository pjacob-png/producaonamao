/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // PWA-ready: manifest e service worker serão adicionados via next-pwa em v2
};

module.exports = nextConfig;
