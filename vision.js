#!/usr/bin/env node

const path = require('path');
const { analyzeImageWithAI } = require('./js-scripts/analyzer');
const { log } = require('./js-scripts/utils');

function validateArgs() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    log.error('Usage: node vision.js <path_to_image>');
    process.exit(1);
  }
  const imagePath = path.resolve(args[0]);
  const fs = require('fs');
  if (!fs.existsSync(imagePath)) {
    log.error(`File not found: ${imagePath}`);
    process.exit(1);
  }
  return imagePath;
}

async function main() {
  const imagePath = validateArgs();
  
  try {
    await analyzeImageWithAI(imagePath);
  } catch (err) {
    log.error(`Analysis failed: ${err.message}`);
    process.exit(1);
  }
}

main();
