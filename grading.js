// Grading rules for CAP (credit system, based on Quy chế đào tạo 08/2021/TT-BGDĐT).
//
// - A subject's score is the weighted sum of its components, rounded to 1 decimal.
//   It only exists once every component has a value (otherwise "in progress").
// - Pass mark is 5.0 on the 10-point scale (school policy).
// - The 10-point score maps to a letter grade and 4-point value (table below).
// - Cumulative GPA uses each subject's best completed attempt, weighted by credits.
// - Physical education (Vovinam) is pass/fail: not counted in GPA or credits.

const PASS_MARK = 5.0;

// [minimum 10-point score, letter, 4-point value]
const LETTER_SCALE = [
  [8.5, 'A', 4.0],
  [8.0, 'B+', 3.5],
  [7.0, 'B', 3.0],
  [6.5, 'C+', 2.5],
  [5.5, 'C', 2.0],
  [5.0, 'D+', 1.5],
  [4.0, 'D', 1.0],
  [0, 'F', 0.0]
];

// [minimum 4-point GPA, Vietnamese label, English label]
const RANKS = [
  [3.6, 'Xuất sắc', 'Excellent'],
  [3.2, 'Giỏi', 'Very good'],
  [2.5, 'Khá', 'Good'],
  [2.0, 'Trung bình', 'Average'],
  [1.0, 'Yếu', 'Weak'],
  [0, 'Kém', 'Poor']
];

const NON_GPA_DEPARTMENTS = new Set(['Giáo dục thể chất']);

const round1 = n => Math.round(n * 10 + Number.EPSILON) / 10;
const round2 = n => Math.round(n * 100 + Number.EPSILON) / 100;

function isAverageRow(component) {
  return component.component_name === 'Average';
}

// components: [{ weight, value }] (stored "Average" rows are ignored)
// -> { score: number|null, complete: boolean, weightTotal }
function subjectScore(components) {
  const parts = components.filter(c => !isAverageRow(c));
  if (parts.length === 0) return { score: null, complete: false, weightTotal: 0 };
  const weightTotal = parts.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  const complete = parts.every(c => c.value !== null && c.value !== undefined) && Math.abs(weightTotal - 1) < 1e-6;
  if (!complete) return { score: null, complete: false, weightTotal };
  const raw = parts.reduce((sum, c) => sum + Number(c.weight) * Number(c.value), 0);
  return { score: round1(raw), complete: true, weightTotal };
}

function letterGrade(score) {
  if (score === null || score === undefined) return null;
  const [, letter, points] = LETTER_SCALE.find(([min]) => score >= min);
  return { letter, points };
}

function rankFor(gpa4, lang = 'vi') {
  const [, vi, en] = RANKS.find(([min]) => gpa4 >= min);
  return lang === 'en' ? en : vi;
}

function countsTowardGpa(department) {
  return !NON_GPA_DEPARTMENTS.has(department);
}

// rows: grade component rows with subject_code, subject_name, credits, department,
// semester_code, semester_name, semester_start, component_name, weight, value.
// Returns one entry per (semester, subject) attempt, in input order.
function groupAttempts(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.semester_code}|${r.subject_code}`;
    if (!map.has(key)) {
      map.set(key, {
        semester_code: r.semester_code,
        semester_name: r.semester_name || r.semester_code,
        semester_start: r.semester_start || '',
        subject_code: r.subject_code,
        subject_name: r.subject_name || r.subject_code,
        credits: Number(r.credits) || 0,
        department: r.department || '',
        components: []
      });
    }
    map.get(key).components.push(r);
  }
  return [...map.values()].map(a => {
    const { score, complete } = subjectScore(a.components);
    const grade = letterGrade(score);
    const gpaSubject = countsTowardGpa(a.department);
    let status = 'InProgress';
    if (complete) status = score >= PASS_MARK ? 'Passed' : 'Failed';
    return {
      ...a,
      components: a.components.filter(c => !isAverageRow(c)),
      score,
      letter: gpaSubject && grade ? grade.letter : null,
      points: gpaSubject && grade ? grade.points : null,
      countsTowardGpa: gpaSubject,
      status
    };
  });
}

// Summary over a list of attempts (one semester, or the whole transcript).
// Uses the best completed attempt of each subject.
function summarize(attempts) {
  const best = new Map();
  for (const a of attempts) {
    if (a.status === 'InProgress') continue;
    const prev = best.get(a.subject_code);
    if (!prev || a.score > prev.score) best.set(a.subject_code, a);
  }
  let gpaCredits = 0;
  let sum10 = 0;
  let sum4 = 0;
  let earnedCredits = 0;
  for (const a of best.values()) {
    if (!a.countsTowardGpa) continue;
    gpaCredits += a.credits;
    sum10 += a.score * a.credits;
    sum4 += a.points * a.credits;
    if (a.status === 'Passed') earnedCredits += a.credits;
  }
  const gpa10 = gpaCredits ? round2(sum10 / gpaCredits) : null;
  const gpa4 = gpaCredits ? round2(sum4 / gpaCredits) : null;
  return {
    gpa10,
    gpa4,
    gpaCredits,
    earnedCredits,
    rankVi: gpa4 === null ? null : rankFor(gpa4, 'vi'),
    rankEn: gpa4 === null ? null : rankFor(gpa4, 'en'),
    inProgress: attempts.filter(a => a.status === 'InProgress').length
  };
}

module.exports = {
  PASS_MARK,
  LETTER_SCALE,
  RANKS,
  subjectScore,
  letterGrade,
  rankFor,
  countsTowardGpa,
  groupAttempts,
  summarize
};
