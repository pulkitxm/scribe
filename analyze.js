#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { analyzeImageWithAI } = require('./js-scripts/analyzer');
const { log } = require('./js-scripts/utils');

// Load .env file from project root
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
let concurrency = 1;
let scribeFolder = process.env.SCRIBE_FOLDER;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concurrency' && i + 1 < args.length) {
    concurrency = parseInt(args[i + 1], 10);
    if (isNaN(concurrency) || concurrency < 1) {
      log.error('Invalid concurrency value. Using default: 1');
      concurrency = 1;
    }
    i++;
  } else if (args[i] === '--folder' && i + 1 < args.length) {
    scribeFolder = args[i + 1];
    i++;
  }
}

if (!scribeFolder) {
  const homeDir = require('os').homedir();
  scribeFolder = path.join(homeDir, 'screenshots', 'scribe');
}

if (!fs.existsSync(scribeFolder)) {
  log.error(`SCRIBE_FOLDER not found: ${scribeFolder}`);
  log.info('Set SCRIBE_FOLDER environment variable or use --folder flag');
  process.exit(1);
}

function isIncompleteJSON(jsonPath) {
  try {
    const content = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(content);
    // Check if AI analysis fields are missing
    return !json.detailed_analysis || !json.overall_activity_score || !json.category;
  } catch (e) {
    return false; // If JSON is invalid, skip it
  }
}

function findIncompleteScreenshots(dir) {
  const incomplete = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.webp')) {
        const jsonPath = fullPath.replace(/\.webp$/, '.json');
        
        if (fs.existsSync(jsonPath) && isIncompleteJSON(jsonPath)) {
          incomplete.push({
            imagePath: fullPath,
            jsonPath: jsonPath
          });
        }
      }
    }
  }
  
  scan(dir);
  return incomplete;
}

/**
 * Process items with true concurrent async execution
 * Maintains N concurrent API requests at all times for maximum throughput
 */
async function processWithConcurrency(items, concurrency) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  let processed = 0;
  let currentIndex = 0;
  const total = items.length;
  
  // Process a single item
  async function processItem(item) {
    try {
      const existingMetadata = JSON.parse(fs.readFileSync(item.jsonPath, 'utf8'));
      await analyzeImageWithAI(item.imagePath, existingMetadata);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ path: item.imagePath, error: err.message });
      log.error(`Failed: ${path.basename(item.imagePath)}: ${err.message}`);
    }
    processed++;
    process.stdout.write(`\r[INFO] Progress: ${processed}/${total} (${results.success} success, ${results.failed} failed)    `);
  }
  
  // Worker function that continuously picks up work
  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      if (index < items.length) {
        await processItem(items[index]);
      }
    }
  }
  
  // Start N concurrent workers
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  
  await Promise.all(workers);
  console.log(''); // New line after progress
  
  return results;
}

function askConfirmation(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  log.info(`Scanning for incomplete screenshots in: ${scribeFolder}`);
  
  const incomplete = findIncompleteScreenshots(scribeFolder);
  
  if (incomplete.length === 0) {
    log.success('No incomplete screenshots found. All done!');
    return;
  }
  
  const effectiveConcurrency = Math.min(concurrency, incomplete.length);
  
  console.log('\n' + '='.repeat(50));
  log.info(`Found ${incomplete.length} image(s) needing AI analysis`);
  log.info(`Concurrent requests: ${effectiveConcurrency}`);
  console.log('='.repeat(50) + '\n');
  
  const answer = await askConfirmation(`Proceed with analyzing ${incomplete.length} image(s)? [y/N] `);
  
  if (answer !== 'y' && answer !== 'yes') {
    log.info('Aborted.');
    return;
  }
  
  console.log('');
  log.info(`Starting batch processing with ${effectiveConcurrency} concurrent request(s)...`);
  
  const startTime = Date.now();
  const results = await processWithConcurrency(incomplete, effectiveConcurrency);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  log.success(`Batch processing complete in ${duration}s`);
  log.info(`Total: ${incomplete.length} | Success: ${results.success} | Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\nFailed files:');
    results.errors.forEach(err => {
      console.log(`  - ${path.basename(err.path)}: ${err.error}`);
    });
  }
  
  console.log('='.repeat(50));
}

main().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
