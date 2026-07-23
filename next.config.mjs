/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Bundle the editable week-unlock email text files (/emails) into the
    // serverless functions so src/lib/weekEmail.ts can read them at runtime on
    // Vercel. Without this, the files would be missing in production.
    outputFileTracingIncludes: {
      "/**": ["./emails/**/*"],
    },
  },
};

export default nextConfig;
