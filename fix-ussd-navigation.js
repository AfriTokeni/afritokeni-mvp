#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlersDir = path.join(__dirname, 'src/services/ussd/handlers');

// Find all TypeScript files in handlers directory
const files = glob.sync(`${handlersDir}/*.ts`);

console.log(`Found ${files.length} handler files to fix`);

let totalReplacements = 0;

files.forEach(file => {
  console.log(`\nProcessing: ${path.basename(file)}`);
  let content = fs.readFileSync(file, 'utf8');
  let replacements = 0;
  
  // First, ensure each function that uses lang has it defined
  // Find all function declarations
  const functionPattern = /(async function \w+\([^)]*\): Promise<string> \{)/g;
  content = content.replace(functionPattern, (match) => {
    // Check if the function body already has 'const lang'
    const nextLines = content.substring(content.indexOf(match), content.indexOf(match) + 500);
    if (!nextLines.includes('const lang =') && nextLines.includes('TranslationService')) {
      return `${match}\n  const lang = session.language || 'en';`;
    }
    return match;
  });
  
  // Pattern 1: continueSession with single quotes and no back_or_menu
  // Match: continueSession('...')  but NOT if it contains back_or_menu or __SHOW_
  const pattern1 = /continueSession\('([^']*?)'\)/g;
  content = content.replace(pattern1, (match, message) => {
    // Skip if already has back_or_menu or is a marker
    if (message.includes('back_or_menu') || message.includes('__SHOW_')) {
      return match;
    }
    // Skip if it's a menu display (has numbered options)
    if (message.match(/\d+\.\s+/)) {
      return match;
    }
    replacements++;
    // Convert to template literal and add back_or_menu
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  // Pattern 2: continueSession with template literals but no back_or_menu
  const pattern2 = /continueSession\(`([^`]*?)`\)/g;
  content = content.replace(pattern2, (match, message) => {
    // Skip if already has back_or_menu or is a marker
    if (message.includes('back_or_menu') || message.includes('__SHOW_')) {
      return match;
    }
    // Skip if it's a menu display (has numbered options)
    if (message.match(/\d+\.\s+/)) {
      return match;
    }
    // Skip if it already ends with a translation call
    if (message.trim().endsWith(')')) {
      return match;
    }
    replacements++;
    // Add back_or_menu at the end
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  if (replacements > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Made ${replacements} replacements`);
    totalReplacements += replacements;
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
});

console.log(`\n🎉 Total replacements: ${totalReplacements}`);
console.log('\n⚠️  Please review the changes and run tests!');
