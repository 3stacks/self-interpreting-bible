const path = require('node:path')

/**
 * A static export. tools/merge-site.mjs copies out/ over the reader in build/,
 * so one folder holds the homepage and the reader.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // The contents section reads ../lib/volumes.mjs and ../lib/annotated.mjs.
  turbopack: { root: path.join(__dirname, '..') },
  outputFileTracingRoot: path.join(__dirname, '..'),
}

module.exports = nextConfig
