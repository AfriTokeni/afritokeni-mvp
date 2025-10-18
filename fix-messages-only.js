#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlersDir = path.join(__dirname, 'src/services/ussd/handlers');
const files = glob.sync(`${handlersDir}/*.ts`);

console.log(`Fixing ALL continueSession calls in ${files.length} files\n`);

let totalFixed = 0;

files.forEach(file => {
  const filename = path.basename(file);
  console.log(`Processing: ${filename}`);
  
  let content = fs.readFileSync(file, 'utf8');
  let fixed = 0;
  
  // Pattern 1: continueSession with single-quoted strings
  const singleQuotePattern = /continueSession\('([^']+)'\)/g;
  
  content = content.replace(singleQuotePattern, (match, message) => {
    if (message.includes('back_or_menu')) return match;
    if (message.includes('__SHOW_')) return match;
    if (message.match(/\d+\.\s+\w/)) return match;
    if (message.length < 10) return match;
    
    fixed++;
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  // Pattern 2: continueSession with template literals
  const templatePattern = /continueSession\(`([^`]+)`\)/g;
  
  content = content.replace(templatePattern, (match, message) => {
    if (message.includes('back_or_menu')) return match;
    if (message.includes('__SHOW_')) return match;
    if (message.match(/\d+\.\s+\w/)) return match;
    if (message.trim().endsWith(')')) return match;
    if (message.replace(/\$\{[^}]+\}/g, '').length < 10) return match;
    
    fixed++;
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  if (fixed > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Fixed ${fixed} prompts\n`);
    totalFixed += fixed;
  } else {
    console.log(`  ⏭️  No changes\n`);
  }
});

console.log(`\n🎉 Total: ${totalFixed} prompts fixed`);
console.log('\n⚠️  Now you need to add "const lang = session.language || \'en\';" to functions that need it');
console.log('Run: npm run build to see which functions need it\n');
