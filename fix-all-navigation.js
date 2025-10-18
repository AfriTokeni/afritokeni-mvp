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
  
  // Pattern 1: continueSession with single-quoted strings that don't have back_or_menu
  // Match: continueSession('something') where something doesn't contain back_or_menu or __SHOW_
  const singleQuotePattern = /continueSession\('([^']+)'\)/g;
  
  content = content.replace(singleQuotePattern, (match, message) => {
    // Skip if already has back_or_menu
    if (message.includes('back_or_menu')) return match;
    
    // Skip if it's a marker
    if (message.includes('__SHOW_')) return match;
    
    // Skip if it's a menu (has numbered list like "1. Something")
    if (message.match(/\d+\.\s+\w/)) return match;
    
    // Skip if message is very short (likely just a marker or redirect)
    if (message.length < 10) return match;
    
    fixed++;
    // Convert to template literal and add back_or_menu
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  // Pattern 2: continueSession with template literals that don't have back_or_menu
  // Match: continueSession(`something`) where something doesn't contain back_or_menu
  const templatePattern = /continueSession\(`([^`]+)`\)/g;
  
  content = content.replace(templatePattern, (match, message) => {
    // Skip if already has back_or_menu
    if (message.includes('back_or_menu')) return match;
    
    // Skip if it's a marker
    if (message.includes('__SHOW_')) return match;
    
    // Skip if it's a menu (has numbered list)
    if (message.match(/\d+\.\s+\w/)) return match;
    
    // Skip if already ends with a translation call
    if (message.trim().endsWith(')')) return match;
    
    // Skip if message is very short
    if (message.replace(/\$\{[^}]+\}/g, '').length < 10) return match;
    
    fixed++;
    // Add back_or_menu at the end
    return `continueSession(\`${message}\\n\\n\${TranslationService.translate('back_or_menu', lang)}\`)`;
  });
  
  if (fixed > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Fixed ${fixed} prompts\n`);
    totalFixed += fixed;
  } else {
    console.log(`  ⏭️  Already fixed or no changes needed\n`);
  }
});

console.log(`\n🎉 Total prompts fixed: ${totalFixed}`);
console.log('\n⚠️  Now checking for missing lang variables...\n');

// Second pass: Add lang variable to functions that need it
files.forEach(file => {
  const filename = path.basename(file);
  let content = fs.readFileSync(file, 'utf8');
  let added = 0;
  
  // Find all async functions
  const functionMatches = [...content.matchAll(/async function (\w+)\([^)]*\): Promise<string> \{/g)];
  
  functionMatches.forEach(match => {
    const funcName = match[1];
    const funcStart = match.index;
    
    // Get the function body (next 2000 chars)
    const funcBody = content.substring(funcStart, funcStart + 2000);
    
    // Check if function uses TranslationService but doesn't have lang defined
    if (funcBody.includes("TranslationService.translate('back_or_menu', lang)") && 
        !funcBody.includes('const lang =')) {
      
      // Find where to insert (right after the opening brace)
      const insertPos = funcStart + match[0].length;
      const before = content.substring(0, insertPos);
      const after = content.substring(insertPos);
      
      content = before + '\n  const lang = session.language || \'en\';' + after;
      added++;
    }
  });
  
  if (added > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`${filename}: Added ${added} lang variables`);
  }
});

console.log('\n✅ DONE! All navigation fixed!');
