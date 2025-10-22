import type { NextConfig } from "next";
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
};

const config = withPWA({
  dest: 'public',
})(nextConfig);

export default config;
