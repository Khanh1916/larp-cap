// Unit tests for the grading rules (no server needed).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const g = require('../grading');

const comp = (weight, value, name = 'X') => ({ component_name: name, weight, value });

test('subject score is the weighted sum rounded to 1 decimal', () => {
  // PRF192: 0.1*10 + 0.2*8.5 + 0.3*8 + 0.4*8.8 = 8.62
  const r = g.subjectScore([comp(0.1, 10), comp(0.2, 8.5), comp(0.3, 8), comp(0.4, 8.8)]);
  assert.deepEqual({ score: r.score, complete: r.complete }, { score: 8.6, complete: true });
});

test('stored "Average" rows are ignored', () => {
  const r = g.subjectScore([comp(0.5, 6), comp(0.5, 8), comp(1.0, 1.23, 'Average')]);
  assert.equal(r.score, 7);
});

test('missing component or weights not summing to 100% means in progress', () => {
  assert.equal(g.subjectScore([comp(0.6, 8), comp(0.4, null)]).complete, false);
  assert.equal(g.subjectScore([comp(0.6, 8), comp(0.3, 7)]).complete, false);
  assert.equal(g.subjectScore([]).score, null);
});

test('letter grade boundaries', () => {
  const cases = [
    [10, 'A', 4], [8.5, 'A', 4], [8.4, 'B+', 3.5], [8.0, 'B+', 3.5], [7.9, 'B', 3],
    [7.0, 'B', 3], [6.9, 'C+', 2.5], [6.5, 'C+', 2.5], [6.4, 'C', 2], [5.5, 'C', 2],
    [5.4, 'D+', 1.5], [5.0, 'D+', 1.5], [4.9, 'D', 1], [4.0, 'D', 1], [3.9, 'F', 0], [0, 'F', 0]
  ];
  for (const [score, letter, points] of cases) {
    assert.deepEqual(g.letterGrade(score), { letter, points }, String(score));
  }
  assert.equal(g.letterGrade(null), null);
});

test('academic standing from 4-point GPA', () => {
  const cases = [[4, 'Xuất sắc'], [3.6, 'Xuất sắc'], [3.59, 'Giỏi'], [3.2, 'Giỏi'], [3.19, 'Khá'],
    [2.5, 'Khá'], [2.49, 'Trung bình'], [2.0, 'Trung bình'], [1.99, 'Yếu'], [1.0, 'Yếu'], [0.99, 'Kém']];
  for (const [gpa, rank] of cases) assert.equal(g.rankFor(gpa), rank, String(gpa));
  assert.equal(g.rankFor(3.7, 'en'), 'Excellent');
});

const row = (sem, start, code, credits, weight, value, department = 'CNTT') =>
  ({ semester_code: sem, semester_start: start, subject_code: code, credits, department, component_name: 'Final', weight, value });

test('attempt status: passed, failed, in progress; P/F subjects get no letter', () => {
  const attempts = g.groupAttempts([
    row('S1', '2025-01-01', 'AAA', 3, 1, 8),
    row('S1', '2025-01-01', 'BBB', 3, 1, 4.9),
    row('S1', '2025-01-01', 'CCC', 3, 1, null),
    row('S1', '2025-01-01', 'VOV', 2, 1, 7, 'Giáo dục thể chất')
  ]);
  assert.deepEqual(attempts.map(a => a.status), ['Passed', 'Failed', 'InProgress', 'Passed']);
  assert.equal(attempts[1].letter, 'D');
  assert.equal(attempts[3].letter, null);
  assert.equal(attempts[3].countsTowardGpa, false);
});

test('GPA uses credits, the best attempt, and skips P/F and in-progress subjects', () => {
  const attempts = g.groupAttempts([
    row('S1', '2025-01-01', 'AAA', 3, 1, 9.0),   // A 4.0
    row('S1', '2025-01-01', 'BBB', 4, 1, 3.0),   // F, retaken below
    row('S1', '2025-01-01', 'VOV', 2, 1, 2.0, 'Giáo dục thể chất'),
    row('S2', '2025-05-01', 'BBB', 4, 1, 7.0),   // B 3.0 (best attempt)
    row('S2', '2025-05-01', 'CCC', 3, 1, null)   // in progress
  ]);
  const s = g.summarize(attempts);
  // (9*3 + 7*4) / 7 = 7.857 ; (4*3 + 3*4) / 7 = 3.428
  assert.equal(s.gpa10, 7.86);
  assert.equal(s.gpa4, 3.43);
  assert.equal(s.gpaCredits, 7);
  assert.equal(s.earnedCredits, 7);
  assert.equal(s.rankVi, 'Giỏi');
  assert.equal(s.inProgress, 1);
});

test('a never-passed subject still counts in GPA but earns no credits', () => {
  const s = g.summarize(g.groupAttempts([row('S1', '2025-01-01', 'AAA', 3, 1, 8.5), row('S1', '2025-01-01', 'BBB', 3, 1, 3.0)]));
  assert.equal(s.gpa4, 2);
  assert.equal(s.earnedCredits, 3);
});

test('no completed subjects gives an empty summary', () => {
  const s = g.summarize([]);
  assert.equal(s.gpa10, null);
  assert.equal(s.rankVi, null);
});
