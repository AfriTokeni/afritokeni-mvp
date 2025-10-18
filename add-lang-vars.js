#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlersDir = path.join(__dirname, 'src/services/ussd/handlers');
const files = glob.sync(`${handlersDir}/*.ts`);

console.log(`Adding lang variables to functions that need them\n`);

let totalAdded = 0;

files.forEach(file => {
  const filename = path.basename(file);
  let content = fs.readFileSync(file, 'utf8');
  let added = 0;
  
  // Find all async function declarations
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    
    // Check if this is an async function declaration
    if (line.match(/^async function \w+\([^)]*\): Promise<string> \{$/)) {
      // Check the next 50 lines to see if they use lang but don't define it
      let usesLang = false;
      let hasLangDef = false;
      
      for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
        if (lines[j].includes("translate('back_or_menu', lang)")) {
          usesLang = true;
        }
        if (lines[j].includes('const lang =')) {
          hasLangDef = true;
          break;
        }
        // Stop at next function
        if (lines[j].match(/^(async )?function /)) {
          break;
        }
      }
      
      if (usesLang && !hasLangDef) {
        // Add lang definition after the opening brace
        newLines.push("  const lang = session.language || 'en';");
        added++;
      }
    }
  }
  
  if (added > 0) {
    fs.writeFileSync(file, newLines.join('\n'), 'utf8');
    console.log(`${filename}: Added ${added} lang variables`);
    totalAdded += added;
  }
});

console.log(`\n✅ Total: ${totalAdded} lang variables added`);
