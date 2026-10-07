/** @type {import('next').NextConfig} */
const nextConfig = {
  // Slim production image: `server.js` + traced deps only.
  output: "standalone",
};
export default nextConfig;
