#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildTimestamp, buildSystemMetadata } = require('./metadata');
const { log, cleanObject } = require('./utils');

function validateArgs() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    log.error('Usage: node save-metadata.js <path_to_image>');
    process.exit(1);
  }
  const imagePath = path.resolve(args[0]);
  if (!fs.existsSync(imagePath)) {
    log.error(`File not found: ${imagePath}`);
    process.exit(1);
  }
  return imagePath;
}

function main() {
  const imagePath = validateArgs();
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const finalOutputPath = path.join(path.dirname(imagePath), `${baseName}.json`);

  log.info(`Saving metadata for ${path.basename(imagePath)}...`);

  const metadata = {
    timestamp: buildTimestamp(),
    system_metadata: buildSystemMetadata()
  };

  const cleanedJSON = cleanObject(metadata);

  fs.writeFileSync(finalOutputPath, JSON.stringify(cleanedJSON, null, 2));
  log.success(`Saved: ${finalOutputPath}`);
}

main();
