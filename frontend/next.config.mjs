/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    // Siempre definida => se inlinea y el bundle de producción descarta api/mock.js (y las credenciales demo).
    NEXT_PUBLIC_API_MOCK: process.env.NEXT_PUBLIC_API_MOCK ?? 'false',
  },
};

export default nextConfig;
