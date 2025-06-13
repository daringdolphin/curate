/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "localhost" }]
  },
  
  // Enable WebAssembly support
  experimental: {
    esmExternals: 'loose',
  },
  
  webpack: (config, { isServer, dev }) => {
    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    }

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    // Fix for tiktoken in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Optimize tiktoken for client-side
    config.resolve.alias = {
      ...config.resolve.alias,
      'tiktoken/encoders/cl100k_base.js': 'tiktoken/dist/cl100k_base.js',
    }

    return config
  },
}

export default nextConfig
