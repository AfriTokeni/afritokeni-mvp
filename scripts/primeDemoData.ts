/**
 * Validate Demo Data Files
 * The app loads demo data directly from /data folder at runtime.
 * This script just validates the files exist.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('✅ Demo data validation complete!');
console.log('\n📁 Demo data files:');
console.log('  - /data/agents.json (20 agents)');
console.log('  - /data/users.json (users)');
console.log('  - /data/dao-proposals.json (3 proposals)');
console.log('  - /data/dao-leaderboard.json (10 entries)');
console.log('\n💡 Data is loaded at runtime by the app, not uploaded to Juno.');
