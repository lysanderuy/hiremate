import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/recruiter/candidates",
        destination: "/dashboard/recruiter/applicants",
        permanent: true,
      },
      {
        source: "/dashboard/recruiter/candidates/:id",
        destination: "/dashboard/recruiter/applicants/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
