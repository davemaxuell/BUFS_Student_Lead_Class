/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // transformers.js ships a Node build that imports native onnxruntime-node
    // (.node binaries) and sharp. We only use the (pure-JS) tokenizers in the
    // browser and never run model inference, so alias those Node-only deps to
    // false to keep them out of the bundle. (Standard transformers.js + Next fix.)
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node$": false,
      sharp$: false,
    };
    return config;
  },
};

export default nextConfig;
