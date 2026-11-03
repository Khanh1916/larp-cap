const fs = require('fs');
const html = fs.readFileSync('f:/larp-fap/index.html', 'utf8');

// Find all elements with id or class in wrapper
const contentDivs = html.match(/<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>[\s\S]*?<\/div>/gi) || [];
console.log('Content divs count:', contentDivs.length);

// Let's inspect the main content body
const mainBodyMatch = html.match(/<div class="content-page">([\s\S]*?)<footer/i);
if (mainBodyMatch) {
  console.log('=== MAIN BODY PREVIEW (first 2000 chars) ===\n', mainBodyMatch[1].slice(0, 2000));
}

// Check scripts that make API calls
const jsFiles = fs.readdirSync('f:/larp-fap/js', { recursive: true });
console.log('=== JS FILES ===\n', jsFiles);

for (const f of jsFiles) {
  if (typeof f === 'string' && f.endsWith('.js')) {
    const content = fs.readFileSync('f:/larp-fap/js/' + f, 'utf8');
    const apiMatches = content.match(/(?:\/api\/[a-zA-Z0-9_\-\/]+|\/[A-Z][a-zA-Z0-9_]+\/[A-Z][a-zA-Z0-9_]+)/g);
    if (apiMatches) {
      console.log(`API endpoints in js/${f}:`, Array.from(new Set(apiMatches)));
    }
  }
}
