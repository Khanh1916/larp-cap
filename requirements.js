// Eligibility checks for OJT (internship) and the graduation thesis, computed
// from the student's real record instead of fixed text.
const grading = require('./grading');

const OJT_SUBJECT = 'OJT401';
const OJT_PREREQ_LAST_SEMESTER = 5; // curriculum semesters 1..5 must be completed
const PE_SUBJECTS = ['VOV114', 'VOV124', 'VOV134'];
const THESIS_MIN_CREDITS = 120;
const THESIS_MIN_GPA10 = 6.0;

// Program-specific core subjects. Programs not listed fall back to DEFAULT.
const CORE = {
  BIT_IA_19A_AS: { ojt: ['PRF192', 'PRO192', 'CSD201', 'IAE301'], thesis: ['SWP391', 'CRY301', 'PEN301'] },
  BIT_SE_18A_AS: { ojt: ['PRF192', 'PRO192', 'CSD201', 'SWE201'], thesis: ['SWP391', 'SWT301', 'SWD392'] },
  DEFAULT: { ojt: ['PRF192', 'PRO192', 'CSD201'], thesis: ['SWP391'] }
};

// Best status per subject: Passed > InProgress > Failed (absent = NotTaken).
function subjectStatuses(attempts) {
  const order = { Passed: 3, InProgress: 2, Failed: 1 };
  const map = new Map();
  for (const a of attempts) {
    const prev = map.get(a.subject_code);
    if (!prev || order[a.status] > order[prev]) map.set(a.subject_code, a.status);
  }
  return map;
}

function statusOf(map, code) {
  return map.get(code) || 'NotTaken';
}

// Criterion: { key, met: true|false, pending: bool, required: {vi,en}, actual: {vi,en} }
function listCheck(map, codes) {
  const passed = codes.filter(c => statusOf(map, c) === 'Passed');
  const missing = codes.filter(c => statusOf(map, c) !== 'Passed');
  const inProgress = missing.filter(c => statusOf(map, c) === 'InProgress');
  const describe = (vi, en) => ({ vi, en });
  let actual;
  if (missing.length === 0) actual = describe('Đã đạt tất cả', 'All passed');
  else {
    const parts = missing.map(c => {
      const s = statusOf(map, c);
      const label = s === 'InProgress' ? ['đang học', 'in progress'] : s === 'Failed' ? ['chưa đạt', 'failed'] : ['chưa học', 'not taken'];
      return { vi: `${c} (${label[0]})`, en: `${c} (${label[1]})` };
    });
    actual = describe(`Còn thiếu: ${parts.map(p => p.vi).join(', ')}`, `Missing: ${parts.map(p => p.en).join(', ')}`);
  }
  return { met: missing.length === 0, pending: missing.length > 0 && inProgress.length === missing.length, actual, passedCount: passed.length };
}

function ojtStatus({ student, attempts, curriculum, certificates }) {
  const map = subjectStatuses(attempts);
  const core = CORE[student.program_code] || CORE.DEFAULT;
  const ojtState = statusOf(map, OJT_SUBJECT);
  const ojtAttempt = attempts.find(a => a.subject_code === OJT_SUBJECT && a.status === ojtState);

  const earlySubjects = curriculum
    .filter(c => c.semester_no <= OJT_PREREQ_LAST_SEMESTER)
    .map(c => c.subject_code);
  const early = listCheck(map, earlySubjects);
  const english = certificates.find(c => c.cert_type === 'Ngoại ngữ');

  const criteria = [
    {
      key: 'curriculum',
      label: { vi: `Hoàn thành các môn kỳ 1–${OJT_PREREQ_LAST_SEMESTER}`, en: `Complete semesters 1–${OJT_PREREQ_LAST_SEMESTER}` },
      required: { vi: `${earlySubjects.length} môn theo khung chương trình`, en: `${earlySubjects.length} subjects in the curriculum` },
      ...(earlySubjects.length === 0
        ? { met: false, pending: false, actual: { vi: 'Chưa có khung chương trình', en: 'No curriculum on record' } }
        : { ...early, actual: { vi: `${early.passedCount} / ${earlySubjects.length} môn đã đạt. ${early.actual.vi}`, en: `${early.passedCount} / ${earlySubjects.length} passed. ${early.actual.en}` } })
    },
    {
      key: 'english',
      label: { vi: 'Trình độ Tiếng Anh', en: 'English level' },
      required: { vi: 'Có chứng chỉ ngoại ngữ (tối thiểu Level 5 / B2)', en: 'Language certificate (Level 5 / B2 or higher)' },
      met: Boolean(english),
      pending: false,
      actual: english ? { vi: english.grade || english.name, en: english.grade || english.name } : { vi: 'Chưa có chứng chỉ', en: 'No certificate' }
    },
    {
      key: 'pe',
      label: { vi: 'Giáo dục thể chất', en: 'Physical education' },
      required: { vi: `Đạt ${PE_SUBJECTS.join(', ')}`, en: `Pass ${PE_SUBJECTS.join(', ')}` },
      ...listCheck(map, PE_SUBJECTS)
    },
    {
      key: 'core',
      label: { vi: 'Môn cơ sở ngành bắt buộc', en: 'Required core subjects' },
      required: { vi: `Đạt ${core.ojt.join(', ')}`, en: `Pass ${core.ojt.join(', ')}` },
      ...listCheck(map, core.ojt)
    }
  ];

  let state;
  if (ojtState === 'Passed') state = 'completed';
  else if (ojtState === 'InProgress') state = 'in_progress';
  else if (criteria.every(c => c.met)) state = 'eligible';
  else if (criteria.every(c => c.met || c.pending)) state = 'pending';
  else state = 'not_eligible';

  return { state, criteria, ojtSemester: ojtAttempt ? ojtAttempt.semester_name : null };
}

function thesisStatus({ student, attempts }) {
  const map = subjectStatuses(attempts);
  const summary = grading.summarize(attempts);
  const core = CORE[student.program_code] || CORE.DEFAULT;
  const ojt = statusOf(map, OJT_SUBJECT);

  const criteria = [
    {
      key: 'credits',
      label: { vi: 'Tổng số tín chỉ tích lũy', en: 'Credits earned' },
      required: { vi: `Tối thiểu ${THESIS_MIN_CREDITS} tín chỉ`, en: `At least ${THESIS_MIN_CREDITS} credits` },
      met: summary.earnedCredits >= THESIS_MIN_CREDITS,
      pending: false,
      actual: { vi: `${summary.earnedCredits} tín chỉ`, en: `${summary.earnedCredits} credits` }
    },
    {
      key: 'gpa',
      label: { vi: 'Điểm trung bình tích lũy (GPA)', en: 'Cumulative GPA' },
      required: { vi: `Tối thiểu ${THESIS_MIN_GPA10.toFixed(2)} / 10`, en: `At least ${THESIS_MIN_GPA10.toFixed(2)} / 10` },
      met: summary.gpa10 !== null && summary.gpa10 >= THESIS_MIN_GPA10,
      pending: false,
      actual: summary.gpa10 === null
        ? { vi: 'Chưa có điểm', en: 'No grades yet' }
        : { vi: `${summary.gpa10.toFixed(2)} / 10 (${summary.gpa4.toFixed(2)} / 4)`, en: `${summary.gpa10.toFixed(2)} / 10 (${summary.gpa4.toFixed(2)} / 4)` }
    },
    {
      key: 'ojt',
      label: { vi: 'Thực tập doanh nghiệp (OJT)', en: 'Internship (OJT)' },
      required: { vi: `Đạt ${OJT_SUBJECT}`, en: `Pass ${OJT_SUBJECT}` },
      met: ojt === 'Passed',
      pending: ojt === 'InProgress',
      actual: {
        vi: { Passed: 'Đã hoàn thành', InProgress: 'Đang thực tập', Failed: 'Chưa đạt', NotTaken: 'Chưa tham gia' }[ojt],
        en: { Passed: 'Completed', InProgress: 'In progress', Failed: 'Failed', NotTaken: 'Not started' }[ojt]
      }
    },
    {
      key: 'core',
      label: { vi: 'Môn chuyên ngành cốt lõi', en: 'Core major subjects' },
      required: { vi: `Đạt ${core.thesis.join(', ')}`, en: `Pass ${core.thesis.join(', ')}` },
      ...listCheck(map, core.thesis)
    }
  ];

  const state = criteria.every(c => c.met) ? 'eligible' : 'not_eligible';
  return { state, criteria, summary };
}

module.exports = { ojtStatus, thesisStatus, subjectStatuses, THESIS_MIN_CREDITS, THESIS_MIN_GPA10 };
