/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:8080', '127.0.0.1:8080', '*'],
        },
    },
};

export default nextConfig;
