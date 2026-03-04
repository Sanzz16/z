/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      // / akan redirect ke /home secara default tidak diperlukan karena 
      // index.tsx handle sendiri di useEffect
    ]
  }
}
module.exports = nextConfig
