/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['react-map-gl', 'mapbox-gl'],
    output: 'export',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
