import type { NextConfig } from "next";
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
};

const config = process.env.NODE_ENV === 'production' ? withPWA({
  dest: 'public',
})(nextConfig) : nextConfig;

export default config;
