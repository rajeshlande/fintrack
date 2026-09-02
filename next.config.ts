import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // Allow mobile/LAN devices to load dev HMR assets (e.g. phone at 192.168.1.x)
  allowedDevOrigins: ["192.168.1.*", "192.168.56.*"],
};

export default withPWA(nextConfig);
