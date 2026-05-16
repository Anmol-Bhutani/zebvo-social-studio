/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    /* On Vercel Services, `/api/*` is routed to Express — proxying here would hit localhost inside the CDN and break auth. */
    if (process.env.VERCEL) return [];
    const dest =
      process.env.API_PROXY_TARGET?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "http://localhost:5050";
    return [{ source: "/api/:path*", destination: `${dest}/api/:path*` }];
  },
};

export default nextConfig;
