/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/collections/play", destination: "/collections/discover", permanent: true },
      { source: "/collections/audio", destination: "/collections/utilities", permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
