/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            // Nginx preserves the public Host header, including Cloudflare quick-tunnel hosts.
            // An explicit "*" is not a valid safe origin policy here; same-origin requests are
            // accepted automatically by Next.js.
            allowedOrigins: ['localhost:8080', '127.0.0.1:8080', '*.trycloudflare.com'],
        },
    },
};

export default nextConfig;
