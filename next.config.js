/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Use our custom ESLint configuration
    dirs: ['src'],
  },
}

module.exports = nextConfig
