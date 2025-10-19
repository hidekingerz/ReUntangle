/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Use our custom ESLint configuration
    dirs: ['src'],
  },
}

module.exports = nextConfig
