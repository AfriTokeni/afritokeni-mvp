#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlersDir = path.join(__dirname, 'src/services/ussd/handlers');
const files = glob.sync(`${handlersDir}/*.ts`);

console.log(`Removing back_or_menu from numeric input prompts\n`);

let totalFixed = 0;

files.forEach(file => {
  const filename = path.basename(file);
  let content = fs.readFileSync(file, 'utf8');
  let fixed = 0;
  
  // Pattern 1: Remove back_or_menu from PIN prompts
  const pinPattern = /(Enter your 4-digit PIN[^`]*?)\\n\\n\$\{TranslationService\.translate\('back_or_menu', lang\)\}/g;
  const pinMatches = content.match(pinPattern);
  if (pinMatches) {
    content = content.replace(pinPattern, '$1');
    fixed += pinMatches.length;
  }
  
  // Pattern 2: Remove back_or_menu from amount entry prompts
  const amountPattern = /(Enter.*amount[^`]*?)\\n\\n\$\{TranslationService\.translate\('back_or_menu', lang\)\}/g;
  const amountMatches = content.match(amountPattern);
  if (amountMatches) {
    content = content.replace(amountPattern, '$1');
    fixed += amountMatches.length;
  }
  
  // Pattern 3: Remove from "Invalid PIN" messages
  const invalidPinPattern = /(Invalid PIN[^`]*?)\\n\\n\$\{TranslationService\.translate\('back_or_menu', lang\)\}/g;
  const invalidPinMatches = content.match(invalidPinPattern);
  if (invalidPinMatches) {
    content = content.replace(invalidPinPattern, '$1');
    fixed += invalidPinMatches.length;
  }
  
  // Pattern 4: Remove from "Incorrect PIN" messages  
  const incorrectPinPattern = /(Incorrect PIN[^`]*?)\\n\\n\$\{TranslationService\.translate\('back_or_menu', lang\)\}/g;
  const incorrectPinMatches = content.match(incorrectPinPattern);
  if (incorrectPinMatches) {
    content = content.replace(incorrectPinPattern, '$1');
    fixed += incorrectPinMatches.length;
  }
  
  // Pattern 5: Remove from "Invalid amount" messages
  const invalidAmountPattern = /(Invalid amount[^`]*?)\\n\\n\$\{TranslationService\.translate\('back_or_menu', lang\)\}/g;
  const invalidAmountMatches = content.match(invalidAmountPattern);
  if (invalidAmountMatches) {
    content = content.replace(invalidAmountPattern, '$1');
    fixed += invalidAmountMatches.length;
  }
  
  if (fixed > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`${filename}: Removed ${fixed} back_or_menu from numeric prompts`);
    totalFixed += fixed;
  }
});

console.log(`\n✅ Total: ${totalFixed} numeric prompts fixed`);
console.log('\nℹ️  Numeric inputs (PINs, amounts) should NOT show navigation');
console.log('   because 0-9 are valid data, not commands!');
