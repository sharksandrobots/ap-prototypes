#!/usr/bin/env node

/**
 * Convert AP News tokens.json (Figma Tokens Studio format) to CSS custom properties
 * Usage: node convert-tokens.js <input.json> <output.css>
 * Example: node convert-tokens.js ap_news-design-tokens.json styles/tokens.css
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'ap_news-design-tokens.json';
const outputFile = process.argv[3] || 'styles/tokens.css';

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Read the tokens JSON
const tokensData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// Extract all tokens
const allTokens = [];
const tokensByCategory = {};

if (Array.isArray(tokensData)) {
  tokensData.forEach(group => {
    if (group.values && Array.isArray(group.values)) {
      group.values.forEach(valueGroup => {
        // Process colors
        if (valueGroup.color && Array.isArray(valueGroup.color)) {
          valueGroup.color.forEach(token => {
            allTokens.push({
              name: token.name,
              value: token.value,
              type: 'color'
            });
            categorizeToken(token.name, 'color', tokensByCategory);
          });
        }
        // Process numbers (sizing, spacing, border-radius, etc.)
        if (valueGroup.number && Array.isArray(valueGroup.number)) {
          valueGroup.number.forEach(token => {
            allTokens.push({
              name: token.name,
              value: token.value,
              type: 'number'
            });
            categorizeToken(token.name, 'number', tokensByCategory);
          });
        }
        // Process strings (if any)
        if (valueGroup.string && Array.isArray(valueGroup.string)) {
          valueGroup.string.forEach(token => {
            allTokens.push({
              name: token.name,
              value: token.value,
              type: 'string'
            });
            categorizeToken(token.name, 'string', tokensByCategory);
          });
        }
      });
    }
  });
}

function categorizeToken(name, type, map) {
  const parts = name.split('/');
  const category = parts[0];
  if (!map[category]) {
    map[category] = [];
  }
  map[category].push(name);
}

// Generate CSS
let css = '/* AP News Design Tokens */\n';
css += `/* Generated from ${path.basename(inputFile)} */\n`;
css += `/* ${new Date().toISOString()} */\n\n`;
css += ':root {\n';

// Group tokens by category
const categories = Object.keys(tokensByCategory).sort();

categories.forEach((category, categoryIndex) => {
  css += `\n  /* ${category.charAt(0).toUpperCase() + category.slice(1)} */\n`;
  
  tokensByCategory[category].forEach(tokenName => {
    const token = allTokens.find(t => t.name === tokenName);
    if (token) {
      const cssVarName = `--${tokenName.replace(/\//g, '-')}`;
      css += `  ${cssVarName}: ${token.value};\n`;
    }
  });
});

css += '\n}\n';

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write CSS file
fs.writeFileSync(outputFile, css);

console.log(`✓ Converted ${allTokens.length} tokens`);
console.log(`✓ Output: ${path.resolve(outputFile)}`);
console.log(`\nCategories: ${categories.join(', ')}`);
