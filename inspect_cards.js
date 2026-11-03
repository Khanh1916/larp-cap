const fs = require('fs');
const html = fs.readFileSync('f:/larp-fap/index.html', 'utf8');

const studentCard = html.match(/<div class="card fap-home-student-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i);
if (studentCard) {
  console.log('=== STUDENT CARD ===\n', studentCard[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

// Check other cards in page
const allCards = html.match(/<div class="card[^"]*">([\s\S]*?)<\/div>/gi) || [];
console.log('=== CARD COUNT ===', allCards.length);
allCards.forEach((c, i) => {
  console.log(`--- Card ${i+1} ---`);
  console.log(c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));
});
