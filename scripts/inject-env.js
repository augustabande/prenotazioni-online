#!/usr/bin/env node
/**
 * Replaces __PLACEHOLDER__ tokens in built JS files with env vars.
 * Run after `nx build frontend` on Netlify.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist/frontend/browser');

const replacements = {
  __API_URL__: process.env.API_URL || 'http://localhost:3000/api',
  __SUPABASE_URL__: process.env.SUPABASE_URL || '',
  __SUPABASE_ANON_KEY__: process.env.SUPABASE_ANON_KEY || '',
  __STRIPE_PUBLIC_KEY__: process.env.STRIPE_PUBLIC_KEY || '',
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [token, value] of Object.entries(replacements)) {
    if (content.includes(token)) {
      content = content.replaceAll(token, value);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) replaceInFile(full);
  }
}

console.log('🔄 Injecting env vars into build output...');
walk(distDir);
console.log('✅ Done');
