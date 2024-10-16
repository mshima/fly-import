#!/usr/bin/env node
// Executable file that runs jhipster sources in JIT mode.
// This file should be used for development purposes and should not be distributed in the npm package.
// Executable should be written in commonjs https://github.com/nodejs/modules/issues/152.
const path = require('node:path');

(async () => {
  const { default: esbuildx } = await import('@node-loaders/esbuildx');
  await esbuildx(path.join(__dirname, './sample.js'));
})();
