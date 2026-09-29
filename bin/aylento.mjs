#!/usr/bin/env node
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<24||(major===24&&minor<15)){console.error('AYLENTO requires Node.js 24.15.0 or newer.');process.exit(1);}
const args=process.argv.slice(2);
if(args[0]==='configure'){await (await import('../scripts/configure.mjs')).configureMain(args.slice(1));}
else if(args[0]==='--help'){console.log('aylento-client [configure HOST [options]]\nNo arguments starts the stdio MCP server.');}
else if(args.length){console.error('Unknown argument. Use --help.');process.exitCode=1;}
else{await (await import('../scripts/server.mjs')).startAylentoServer();}
