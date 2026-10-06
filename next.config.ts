import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/catalog',
        destination: '/dashboard/catalog',
        permanent: false,
      },
      {
        source: '/catalog/:path*',
        destination: '/dashboard/catalog/:path*',
        permanent: false,
      },
      {
        source: '/inventory',
        destination: '/dashboard/inventory',
        permanent: false,
      },
      {
        source: '/inventory/:path*',
        destination: '/dashboard/inventory/:path*',
        permanent: false,
      },
      {
        source: '/patrons',
        destination: '/dashboard/patrons',
        permanent: false,
      },
      {
        source: '/patrons/:path*',
        destination: '/dashboard/patrons/:path*',
        permanent: false,
      },
      {
        source: '/circulations',
        destination: '/dashboard/circulations',
        permanent: false,
      },
      {
        source: '/circulations/:path*',
        destination: '/dashboard/circulations/:path*',
        permanent: false,
      },
      {
        source: '/attendance',
        destination: '/dashboard/attendance',
        permanent: false,
      },
      {
        source: '/attendance/:path*',
        destination: '/dashboard/attendance/:path*',
        permanent: false,
      },
      {
        source: '/summaries',
        destination: '/dashboard/summaries',
        permanent: false,
      },
      {
        source: '/summaries/:path*',
        destination: '/dashboard/summaries/:path*',
        permanent: false,
      },
      {
        source: '/leaderboard',
        destination: '/dashboard/leaderboard',
        permanent: false,
      },
      {
        source: '/leaderboard/:path*',
        destination: '/dashboard/leaderboard/:path*',
        permanent: false,
      },
      {
        source: '/cohorts',
        destination: '/dashboard/cohorts',
        permanent: false,
      },
      {
        source: '/cohorts/:path*',
        destination: '/dashboard/cohorts/:path*',
        permanent: false,
      },
      {
        source: '/competitions',
        destination: '/dashboard/competitions/reading',
        permanent: false,
      },
      {
        source: '/competitions/reading',
        destination: '/dashboard/competitions/reading',
        permanent: false,
      },
      {
        source: '/certificates',
        destination: '/dashboard/certificates',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/dashboard/admin',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/admin/:path*',
        permanent: false,
      },
      {
        source: '/transcomm/manage',
        destination: '/dashboard/transcomm',
        permanent: false,
      },
      {
        source: '/transcomm/manage/:path*',
        destination: '/dashboard/transcomm/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
