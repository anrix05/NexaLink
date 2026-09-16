const fs = require('fs');
const content = fs.readFileSync('d:/NexaLink/src/pages/messaging/MessagingPage.tsx', 'utf8');
let depth = 0;
let inString = false;
let strChar = '';
let inComment = false;
let inMultiComment = false;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let l = lines[i];
  for(let j = 0; j < l.length; j++) {
    if (inString) {
      if (l[j] === strChar && l[j-1] !== '\\') inString = false;
      continue;
    }
    if (inComment) { break; }
    if (inMultiComment) {
      if (l[j] === '*' && l[j+1] === '/') { inMultiComment = false; j++; }
      continue;
    }
    if (l[j] === '/' && l[j+1] === '/') { inComment = true; break; }
    if (l[j] === '/' && l[j+1] === '*') { inMultiComment = true; j++; continue; }
    if (l[j] === '"' || l[j] === "'" || l[j] === '`') { inString = true; strChar = l[j]; continue; }
    
    if(l[j] === '{') depth++;
    else if(l[j] === '}') {
      depth--;
      if(depth < 0) { console.log('Depth negative at line ' + (i+1)); }
    }
  }
  inComment = false;
}
console.log('Final depth:', depth);
