try { const esbuild = require('esbuild'); console.log('esbuild loaded', esbuild.version); } catch (err) { console.error(err); process.exit(1); }
