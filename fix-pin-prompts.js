#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlersDir = path.join(__dirname, 'src/services/ussd/handlers');
const files = glob.sync(`${handlersDir}/*.ts`);

console.log(`Fixing PIN prompts in ${files.length} files\n`);

let totalFixed = 0;

files.forEach(file => {
  const filename = path.basename(file);
  console.log(`Processing: ${filename}`);
  
  let content = fs.readFileSync(file, 'utf8');
  let fixed = 0;
  
  // Fix: 'Enter your 4-digit PIN:' -> with back_or_menu
  const oldPattern1 = /'Enter your 4-digit PIN:'/g;
  const newPattern1 = "`Enter your 4-digit PIN:\\n\\n\\${TranslationService.translate('back_or_menu', lang)}`";
  
  if (content.match(oldPattern1)) {
    content = content.replace(oldPattern1, newPattern1);
    fixed += (content.match(new RegExp(newPattern1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }
  
  // Fix: 'Invalid PIN format.\nEnter your 4-digit PIN:' -> with back_or_menu  
  const oldPattern2 = /'Invalid PIN format\.\\nEnter your 4-digit PIN:'/g;
  const newPattern2 = "`Invalid PIN format.\\nEnter your 4-digit PIN:\\n\\n\\${TranslationService.translate('back_or_menu', lang)}`";
  
  if (content.match(oldPattern2)) {
    content = content.replace(oldPattern2, newPattern2);
    fixed++;
  }
  
  // Fix: 'Incorrect PIN.\nEnter your 4-digit PIN:' -> with back_or_menu
  const oldPattern3 = /'Incorrect PIN\.\\nEnter your 4-digit PIN:'/g;
  const newPattern3 = "`Incorrect PIN.\\nEnter your 4-digit PIN:\\n\\n\\${TranslationService.translate('back_or_menu', lang)}`";
  
  if (content.match(oldPattern3)) {
    content = content.replace(oldPattern3, newPattern3);
    fixed++;
  }
  
  if (fixed > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Fixed ${fixed} PIN prompts\n`);
    totalFixed += fixed;
  } else {
    console.log(`  ⏭️  No PIN prompts to fix\n`);
  }
});

console.log(`\n🎉 Total PIN prompts fixed: ${totalFixed}`);
console.log('\n⚠️  Note: You may need to add "const lang = session.language || \'en\';" to some functions');
