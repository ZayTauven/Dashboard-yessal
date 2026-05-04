import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverActions: {
    bodySizeLimit: '10mb',
  },
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"images.pexels.com",
      }
    ]
  }
};

export default nextConfig;
