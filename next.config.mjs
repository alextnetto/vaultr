/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["sql.js"],
  },
};

export default nextConfig;
