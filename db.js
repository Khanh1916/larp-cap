const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { hashPassword, isHashed } = require('./security');

// The database file is created and seeded automatically on first start.
// CAP_DB_PATH lets tests (or a persistent disk on the host) point it elsewhere.
const dbPath = process.env.CAP_DB_PATH || path.join(__dirname, 'cap.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campuses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      is_main INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      roll_number TEXT,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      roll_number TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      personal_email TEXT DEFAULT 'caothanhlam2005@gmail.com',
      campus_id TEXT NOT NULL REFERENCES campuses(id),
      status TEXT DEFAULT 'HD',
      program_code TEXT NOT NULL,
      major_name TEXT NOT NULL,
      cohort INTEGER NOT NULL,
      balance REAL DEFAULT 0,
      gender TEXT DEFAULT 'Nam',
      dob TEXT DEFAULT '2005-08-15',
      id_card TEXT DEFAULT '001205012345',
      phone TEXT DEFAULT '0987654321',
      address TEXT DEFAULT 'Hà Nội, Việt Nam'
    );

    CREATE TABLE IF NOT EXISTS semesters (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subjects (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      department TEXT DEFAULT 'CNTT'
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_code TEXT NOT NULL,
      subject_code TEXT NOT NULL REFERENCES subjects(code),
      semester_code TEXT NOT NULL REFERENCES semesters(code),
      lecturer_name TEXT NOT NULL,
      room TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL REFERENCES classes(id),
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      semester_code TEXT NOT NULL REFERENCES semesters(code),
      study_date TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      slot INTEGER NOT NULL,
      room TEXT NOT NULL,
      lecturer TEXT NOT NULL,
      status TEXT DEFAULT 'Not yet'
    );

    CREATE TABLE IF NOT EXISTS exam_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      subject_code TEXT NOT NULL REFERENCES subjects(code),
      semester_code TEXT NOT NULL REFERENCES semesters(code),
      exam_date TEXT NOT NULL,
      exam_time TEXT NOT NULL,
      slot INTEGER NOT NULL,
      room TEXT NOT NULL,
      exam_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      subject_code TEXT NOT NULL REFERENCES subjects(code),
      semester_code TEXT NOT NULL REFERENCES semesters(code),
      component_name TEXT NOT NULL,
      weight REAL NOT NULL,
      value REAL,
      status TEXT DEFAULT 'Passed'
    );

    CREATE TABLE IF NOT EXISTS attendance_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      subject_code TEXT NOT NULL REFERENCES subjects(code),
      semester_code TEXT NOT NULL REFERENCES semesters(code),
      total_slots INTEGER NOT NULL,
      absent_slots INTEGER DEFAULT 0,
      absent_percentage REAL DEFAULT 0,
      status TEXT DEFAULT 'Passed'
    );

    CREATE TABLE IF NOT EXISTS news_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES news_categories(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'Phòng Đào Tạo',
      published_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      app_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Đang xử lý',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS curriculum (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      major_code TEXT NOT NULL,
      semester_no INTEGER NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      prerequisites TEXT DEFAULT 'None'
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      name TEXT NOT NULL,
      cert_type TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      issuer TEXT NOT NULL,
      grade TEXT,
      cert_no TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      trans_code TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      trans_type TEXT NOT NULL,
      description TEXT NOT NULL,
      payment_method TEXT DEFAULT 'VNPay',
      status TEXT DEFAULT 'Thành công',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shopping_cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      fee_title TEXT NOT NULL,
      semester_code TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'Chưa thanh toán'
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      subject_code TEXT NOT NULL,
      semester_code TEXT NOT NULL,
      desired_slot TEXT NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'Chờ xếp lớp',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fye_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      event_name TEXT NOT NULL,
      location TEXT NOT NULL,
      checkin_time TEXT NOT NULL,
      points INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS mentor_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      mentor_name TEXT NOT NULL,
      semester_code TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      file_size TEXT NOT NULL,
      file_type TEXT NOT NULL,
      download_url TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cross_class_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      subject_code TEXT NOT NULL,
      from_class TEXT NOT NULL,
      to_class TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'Chờ duyệt',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS startup_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_roll TEXT NOT NULL REFERENCES students(roll_number),
      project_name TEXT NOT NULL,
      field TEXT NOT NULL,
      member_count INTEGER NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Chờ xét duyệt',
      created_at TEXT NOT NULL
    );
  `);

  seedAll();
  migratePlaintextPasswords();
}

// Hash any password still stored in plaintext (seed data or databases created before hashing).
function migratePlaintextPasswords() {
  const rows = db.prepare('SELECT id, password FROM users').all();
  const update = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  for (const row of rows) {
    if (!isHashed(row.password)) update.run(hashPassword(row.password), row.id);
  }
}

function seedAll() {
  const check = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (check.count > 0) return;

  console.log('Seeding complete multi-semester & multi-account database into cap.db...');

  // 1. Campuses
  const insertCampus = db.prepare('INSERT INTO campuses (id, name, code, is_main) VALUES (?, ?, ?, ?)');
  insertCampus.run('HN', 'Cơ sở Hà Nội (HN)', 'HN', 1);
  insertCampus.run('HCM', 'Cơ sở TP. Hồ Chí Minh (HCM)', 'HCM', 0);
  insertCampus.run('DN', 'Cơ sở Đà Nẵng (DN)', 'DN', 0);
  insertCampus.run('CT', 'Cơ sở Cần Thơ (CT)', 'CT', 0);
  insertCampus.run('QN', 'Cơ sở Quy Nhơn (QN)', 'QN', 0);

  // 2. Users (Authentication & Multi-Account)
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, roll_number, full_name, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('CT193667', 'lamctct193667@ctl.edu.vn', '123456', 'CT193667', 'Cao Thanh Lâm', 'student', 'CTL');
  insertUser.run('SE180123', 'longthse180123@ctl.edu.vn', '123456', 'SE180123', 'Trần Hoàng Long', 'student', 'HL');
  insertUser.run('GV001', 'khanhhq@ctl.edu.vn', '123456', null, 'ThS. Hoàng Quốc Khánh', 'lecturer', 'HK');

  // 3. Students
  const insertStudent = db.prepare(`
    INSERT INTO students (roll_number, full_name, email, personal_email, campus_id, status, program_code, major_name, cohort, balance, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Student 1: Cao Thanh Lâm (K19 - Information Assurance)
  insertStudent.run(
    'CT193667',
    'Cao Thanh Lâm',
    'lamctct193667@ctl.edu.vn',
    'caothanhlam2005@gmail.com',
    'HN',
    'HD',
    'BIT_IA_19A_AS',
    'An toàn thông tin (Information Assurance)',
    19,
    1500000,
    '0912345678',
    'Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội'
  );
  // Student 2: Trần Hoàng Long (K18 - Software Engineering)
  insertStudent.run(
    'SE180123',
    'Trần Hoàng Long',
    'longthse180123@ctl.edu.vn',
    'tranhoanglong2004@gmail.com',
    'HN',
    'HD',
    'BIT_SE_18A_AS',
    'Kỹ thuật phần mềm (Software Engineering)',
    18,
    3200000,
    '0988776655',
    'Cầu Giấy, Hà Nội'
  );

  // 4. Semesters (Complete list)
  const insertSemester = db.prepare('INSERT INTO semesters (code, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)');
  insertSemester.run('Spring2025', 'Học kỳ Spring 2025', '2025-01-01', '2025-04-30', 0);
  insertSemester.run('Summer2025', 'Học kỳ Summer 2025', '2025-05-01', '2025-08-31', 0);
  insertSemester.run('Fall2025', 'Học kỳ Fall 2025', '2025-09-01', '2025-12-31', 0);
  insertSemester.run('Spring2026', 'Học kỳ Spring 2026', '2026-01-01', '2026-04-30', 0);
  insertSemester.run('Summer2026', 'Học kỳ Summer 2026', '2026-05-01', '2026-08-31', 0);
  insertSemester.run('Fall2026', 'Học kỳ Fall 2026', '2026-09-01', '2026-12-31', 1);
  insertSemester.run('Spring2027', 'Học kỳ Spring 2027', '2027-01-01', '2027-04-30', 0);

  // 5. Subjects
  const insertSubject = db.prepare('INSERT INTO subjects (code, name, credits, department) VALUES (?, ?, ?, ?)');
  const subjectsData = [
    // Kỳ 1
    ['PRF192', 'Programming Fundamentals', 3, 'Kỹ thuật phần mềm'],
    ['MAE101', 'Mathematics for Engineering', 3, 'Khoa học cơ bản'],
    ['CSI104', 'Introduction to Computer Science', 3, 'Khoa học máy tính'],
    ['VOV114', 'Vovinam 1', 2, 'Giáo dục thể chất'],
    // Kỳ 2
    ['PRO192', 'Object-Oriented Programming', 3, 'Kỹ thuật phần mềm'],
    ['MAD101', 'Discrete Mathematics', 3, 'Khoa học cơ bản'],
    ['OSG202', 'Operating Systems', 3, 'Khoa học máy tính'],
    ['VOV124', 'Vovinam 2', 2, 'Giáo dục thể chất'],
    // Kỳ 3
    ['CSD201', 'Data Structures and Algorithms', 3, 'Kỹ thuật phần mềm'],
    ['DBI202', 'Introduction to Databases', 3, 'Hệ thống thông tin'],
    ['NWC203', 'Computer Networking', 3, 'Mạng máy tính'],
    ['VOV134', 'Vovinam 3', 2, 'Giáo dục thể chất'],
    // Kỳ 4
    ['PRN211', 'Basic Cross-Platform Programming with .NET', 3, 'Kỹ thuật phần mềm'],
    ['MAS291', 'Statistics and Probability', 3, 'Khoa học cơ bản'],
    ['SWE201', 'Introduction to Software Engineering', 3, 'Kỹ thuật phần mềm'],
    ['IAE301', 'Information Assurance Engineering', 3, 'An toàn thông tin'],
    // Kỳ 5 (Fall 2026)
    ['SWP391', 'Software Development Project', 3, 'Kỹ thuật phần mềm'],
    ['KRG301', 'Korean General 3', 3, 'Ngoại ngữ'],
    ['KOR411', 'Korean for Communication 4', 3, 'Ngoại ngữ'],
    ['ITE302', 'Ethics in IT', 3, 'Kỹ năng'],
    // Kỳ 6+
    ['OJT401', 'On-the-Job Training (OJT)', 10, 'Doanh nghiệp'],
    ['CRY301', 'Cryptography and Network Security', 3, 'An toàn thông tin'],
    ['FOR301', 'Digital Forensics', 3, 'An toàn thông tin'],
    ['PEN301', 'Penetration Testing and Ethical Hacking', 3, 'An toàn thông tin'],
    ['MAL301', 'Malware Analysis and Reverse Engineering', 3, 'An toàn thông tin'],
    ['MLN131', 'Chủ nghĩa xã hội khoa học', 2, 'Lý luận chính trị'],
    ['SEP490', 'Graduation Thesis / Capstone Project', 10, 'KLTN']
  ];
  subjectsData.forEach(s => insertSubject.run(...s));

  // 6. Classes for multiple semesters
  const insertClass = db.prepare('INSERT INTO classes (class_code, subject_code, semester_code, lecturer_name, room) VALUES (?, ?, ?, ?, ?)');
  // Spring 2025
  insertClass.run('IA1901_PRF', 'PRF192', 'Spring2025', 'TS. Nguyễn Văn Toàn', 'BE-101');
  insertClass.run('IA1901_MAE', 'MAE101', 'Spring2025', 'ThS. Trần Thị Mai', 'BE-102');
  insertClass.run('IA1901_CSI', 'CSI104', 'Spring2025', 'TS. Vũ Đình Tuấn', 'AL-201');
  insertClass.run('IA1901_VOV1', 'VOV114', 'Spring2025', 'Võ Sư Nguyễn Văn Nam', 'Sân Vovinam 1');
  // Summer 2025
  insertClass.run('IA1901_PRO', 'PRO192', 'Summer2025', 'TS. Lê Thanh Hương', 'BE-201');
  insertClass.run('IA1901_MAD', 'MAD101', 'Summer2025', 'ThS. Phạm Quốc Bảo', 'BE-202');
  insertClass.run('IA1901_OSG', 'OSG202', 'Summer2025', 'TS. Nguyễn Mạnh Hùng', 'AL-301');
  insertClass.run('IA1901_VOV2', 'VOV124', 'Summer2025', 'Võ Sư Lê Văn Hưng', 'Sân Vovinam 2');
  // Fall 2025
  insertClass.run('IA1901_CSD', 'CSD201', 'Fall2025', 'TS. Đỗ Trọng Tuấn', 'BE-301');
  insertClass.run('IA1901_DBI', 'DBI202', 'Fall2025', 'ThS. Nguyễn Thị Lan', 'BE-302');
  insertClass.run('IA1901_NWC', 'NWC203', 'Fall2025', 'TS. Trần Tuấn Anh', 'AL-401');
  insertClass.run('IA1901_VOV3', 'VOV134', 'Fall2025', 'Võ Sư Nguyễn Văn Nam', 'Sân Vovinam 1');
  // Spring 2026
  insertClass.run('IA1901_PRN', 'PRN211', 'Spring2026', 'ThS. Hoàng Quốc Khánh', 'DE-201');
  insertClass.run('IA1901_MAS', 'MAS291', 'Spring2026', 'ThS. Trần Thị Mai', 'DE-202');
  insertClass.run('IA1901_SWE', 'SWE201', 'Spring2026', 'TS. Nguyễn Thị Thu Hà', 'AL-402');
  insertClass.run('IA1901_IAE_K4', 'IAE301', 'Spring2026', 'TS. Trần Tuấn Anh', 'AL-405');
  // Fall 2026 (Current)
  insertClass.run('IA1901_KRG', 'KRG301', 'Fall2026', 'Park Sun Young', 'BE-302');
  insertClass.run('IA1901_KOR', 'KOR411', 'Fall2026', 'Lee Min Ho', 'BE-304');
  insertClass.run('IA1901_VOV_F26', 'VOV114', 'Fall2026', 'Võ Sư Nguyễn Văn Nam', 'Sân Vovinam 2');
  insertClass.run('IA1901_IAE', 'IAE301', 'Fall2026', 'TS. Trần Tuấn Anh', 'AL-405');
  insertClass.run('IA1901_SWP', 'SWP391', 'Fall2026', 'ThS. Hoàng Quốc Khánh', 'DE-201');

  // Classes for SE180123 (Software Engineering)
  insertClass.run('SE1801_PRN', 'PRN211', 'Fall2025', 'ThS. Hoàng Quốc Khánh', 'DE-201');
  insertClass.run('SE1801_SWE', 'SWE201', 'Fall2025', 'TS. Nguyễn Thị Thu Hà', 'AL-402');
  insertClass.run('SE1801_SWP', 'SWP391', 'Spring2026', 'ThS. Hoàng Quốc Khánh', 'DE-201');
  insertClass.run('SE1801_ITE', 'ITE302', 'Spring2026', 'ThS. Nguyễn Thị Thu', 'BE-105');
  insertClass.run('SE1801_OJT', 'OJT401', 'Fall2026', 'Mentor CTL Software', 'CTL Hi-Tech Campus');

  // 7. Schedules for ALL semesters
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (class_id, student_roll, semester_code, study_date, day_of_week, slot, room, lecturer, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // CT193667 - Spring 2025
  insertSchedule.run(1, 'CT193667', 'Spring2025', '2025-01-13', 1, 1, 'BE-101', 'TS. Nguyễn Văn Toàn', 'Attended');
  insertSchedule.run(2, 'CT193667', 'Spring2025', '2025-01-13', 1, 2, 'BE-102', 'ThS. Trần Thị Mai', 'Attended');
  insertSchedule.run(3, 'CT193667', 'Spring2025', '2025-01-14', 2, 3, 'AL-201', 'TS. Vũ Đình Tuấn', 'Attended');
  insertSchedule.run(4, 'CT193667', 'Spring2025', '2025-01-14', 2, 1, 'Sân Vovinam 1', 'Võ Sư Nguyễn Văn Nam', 'Attended');
  insertSchedule.run(1, 'CT193667', 'Spring2025', '2025-01-15', 3, 2, 'BE-101', 'TS. Nguyễn Văn Toàn', 'Attended');
  insertSchedule.run(2, 'CT193667', 'Spring2025', '2025-01-16', 4, 1, 'BE-102', 'ThS. Trần Thị Mai', 'Attended');

  // CT193667 - Summer 2025
  insertSchedule.run(5, 'CT193667', 'Summer2025', '2025-05-12', 1, 2, 'BE-201', 'TS. Lê Thanh Hương', 'Attended');
  insertSchedule.run(6, 'CT193667', 'Summer2025', '2025-05-13', 2, 1, 'BE-202', 'ThS. Phạm Quốc Bảo', 'Attended');
  insertSchedule.run(7, 'CT193667', 'Summer2025', '2025-05-14', 3, 3, 'AL-301', 'TS. Nguyễn Mạnh Hùng', 'Attended');
  insertSchedule.run(8, 'CT193667', 'Summer2025', '2025-05-15', 4, 1, 'Sân Vovinam 2', 'Võ Sư Lê Văn Hưng', 'Attended');
  insertSchedule.run(5, 'CT193667', 'Summer2025', '2025-05-16', 5, 2, 'BE-201', 'TS. Lê Thanh Hương', 'Attended');

  // CT193667 - Fall 2025
  insertSchedule.run(9, 'CT193667', 'Fall2025', '2025-09-08', 1, 1, 'BE-301', 'TS. Đỗ Trọng Tuấn', 'Attended');
  insertSchedule.run(10, 'CT193667', 'Fall2025', '2025-09-09', 2, 2, 'BE-302', 'ThS. Nguyễn Thị Lan', 'Attended');
  insertSchedule.run(11, 'CT193667', 'Fall2025', '2025-09-10', 3, 3, 'AL-401', 'TS. Trần Tuấn Anh', 'Attended');
  insertSchedule.run(12, 'CT193667', 'Fall2025', '2025-09-11', 4, 1, 'Sân Vovinam 1', 'Võ Sư Nguyễn Văn Nam', 'Attended');
  insertSchedule.run(9, 'CT193667', 'Fall2025', '2025-09-12', 5, 2, 'BE-301', 'TS. Đỗ Trọng Tuấn', 'Attended');

  // CT193667 - Spring 2026
  insertSchedule.run(13, 'CT193667', 'Spring2026', '2026-03-02', 1, 1, 'DE-201', 'ThS. Hoàng Quốc Khánh', 'Attended');
  insertSchedule.run(14, 'CT193667', 'Spring2026', '2026-03-02', 1, 3, 'DE-202', 'ThS. Trần Thị Mai', 'Attended');
  insertSchedule.run(15, 'CT193667', 'Spring2026', '2026-03-04', 3, 2, 'AL-402', 'TS. Nguyễn Thị Thu Hà', 'Attended');
  insertSchedule.run(16, 'CT193667', 'Spring2026', '2026-03-05', 4, 4, 'AL-405', 'TS. Trần Tuấn Anh', 'Attended');

  // CT193667 - Fall 2026 current week (Nov 02 - Nov 08, 2026)
  insertSchedule.run(17, 'CT193667', 'Fall2026', '2026-11-02', 1, 1, 'BE-302', 'Park Sun Young', 'Attended');
  insertSchedule.run(20, 'CT193667', 'Fall2026', '2026-11-02', 1, 2, 'AL-405', 'TS. Trần Tuấn Anh', 'Attended');
  insertSchedule.run(19, 'CT193667', 'Fall2026', '2026-11-03', 2, 3, 'Sân Vovinam 2', 'Võ Sư Nguyễn Văn Nam', 'Attended');
  insertSchedule.run(21, 'CT193667', 'Fall2026', '2026-11-03', 2, 4, 'DE-201', 'ThS. Hoàng Quốc Khánh', 'Attended');
  insertSchedule.run(18, 'CT193667', 'Fall2026', '2026-11-04', 3, 1, 'BE-304', 'Lee Min Ho', 'Not yet');
  insertSchedule.run(20, 'CT193667', 'Fall2026', '2026-11-04', 3, 2, 'AL-405', 'TS. Trần Tuấn Anh', 'Not yet');
  insertSchedule.run(17, 'CT193667', 'Fall2026', '2026-11-05', 4, 2, 'BE-302', 'Park Sun Young', 'Not yet');
  insertSchedule.run(21, 'CT193667', 'Fall2026', '2026-11-05', 4, 3, 'DE-201', 'ThS. Hoàng Quốc Khánh', 'Not yet');
  insertSchedule.run(19, 'CT193667', 'Fall2026', '2026-11-06', 5, 1, 'Sân Vovinam 2', 'Võ Sư Nguyễn Văn Nam', 'Not yet');
  insertSchedule.run(18, 'CT193667', 'Fall2026', '2026-11-06', 5, 4, 'BE-304', 'Lee Min Ho', 'Not yet');

  // SE180123 Schedules
  insertSchedule.run(26, 'SE180123', 'Fall2026', '2026-11-02', 1, 1, 'CTL Hi-Tech Campus', 'Mentor CTL Software', 'Attended');
  insertSchedule.run(26, 'SE180123', 'Fall2026', '2026-11-03', 2, 2, 'CTL Hi-Tech Campus', 'Mentor CTL Software', 'Attended');
  insertSchedule.run(26, 'SE180123', 'Fall2026', '2026-11-04', 3, 1, 'CTL Hi-Tech Campus', 'Mentor CTL Software', 'Not yet');
  insertSchedule.run(26, 'SE180123', 'Fall2026', '2026-11-05', 4, 2, 'CTL Hi-Tech Campus', 'Mentor CTL Software', 'Not yet');
  insertSchedule.run(26, 'SE180123', 'Fall2026', '2026-11-06', 5, 1, 'CTL Hi-Tech Campus', 'Mentor CTL Software', 'Not yet');
  insertSchedule.run(24, 'SE180123', 'Spring2026', '2026-03-02', 1, 2, 'DE-201', 'ThS. Hoàng Quốc Khánh', 'Attended');
  insertSchedule.run(25, 'SE180123', 'Spring2026', '2026-03-04', 3, 1, 'BE-105', 'ThS. Nguyễn Thị Thu', 'Attended');

  // 8. Exam Schedules for ALL semesters
  const insertExam = db.prepare(`
    INSERT INTO exam_schedules (student_roll, subject_code, semester_code, exam_date, exam_time, slot, room, exam_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Spring 2025
  insertExam.run('CT193667', 'PRF192', 'Spring2025', '2025-04-15', '07:30 - 09:00', 1, 'BE-101', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'MAE101', 'Spring2025', '2025-04-18', '09:15 - 10:45', 2, 'BE-102', 'FE lần 1');
  insertExam.run('CT193667', 'CSI104', 'Spring2025', '2025-04-20', '13:00 - 14:30', 4, 'AL-201', 'FE lần 1');
  // Summer 2025
  insertExam.run('CT193667', 'PRO192', 'Summer2025', '2025-08-10', '07:30 - 09:00', 1, 'BE-201', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'MAD101', 'Summer2025', '2025-08-14', '09:15 - 10:45', 2, 'BE-202', 'FE lần 1');
  insertExam.run('CT193667', 'OSG202', 'Summer2025', '2025-08-18', '14:30 - 16:00', 5, 'AL-301', 'FE lần 1');
  // Fall 2025
  insertExam.run('CT193667', 'CSD201', 'Fall2025', '2025-12-10', '07:30 - 09:00', 1, 'BE-301', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'DBI202', 'Fall2025', '2025-12-14', '11:00 - 12:30', 3, 'BE-302', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'NWC203', 'Fall2025', '2025-12-18', '09:15 - 10:45', 2, 'AL-401', 'FE lần 1');
  // Spring 2026
  insertExam.run('CT193667', 'PRN211', 'Spring2026', '2026-04-12', '07:30 - 09:00', 1, 'DE-201', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'MAS291', 'Spring2026', '2026-04-15', '09:15 - 10:45', 2, 'DE-202', 'FE lần 1');
  insertExam.run('CT193667', 'SWE201', 'Spring2026', '2026-04-18', '13:00 - 14:30', 4, 'AL-402', 'FE lần 1');
  insertExam.run('CT193667', 'IAE301', 'Spring2026', '2026-04-22', '14:30 - 16:00', 5, 'AL-405', 'PE (Practical Exam)');
  // Fall 2026 (Current)
  insertExam.run('CT193667', 'VOV114', 'Fall2026', '2026-11-04', '09:15 - 10:45', 2, 'Sân Vovinam 1', 'FE lần 2');
  insertExam.run('CT193667', 'KRG301', 'Fall2026', '2026-11-15', '07:30 - 09:00', 1, 'BE-201', 'FE lần 1');
  insertExam.run('CT193667', 'KOR411', 'Fall2026', '2026-11-18', '11:00 - 12:30', 3, 'BE-205', 'FE lần 1');
  insertExam.run('CT193667', 'MLN131', 'Fall2026', '2026-11-22', '09:10 - 10:40', 2, 'BE-221', 'FE');
  insertExam.run('CT193667', 'IAE301', 'Fall2026', '2026-11-25', '14:30 - 16:00', 5, 'AL-402', 'PE (Practical Exam)');
  insertExam.run('CT193667', 'MLN131', 'Fall2026', '2026-11-29', '10:50 - 12:20', 3, '-', '2NDFE');
  insertExam.run('CT193667', 'SWP391', 'Fall2026', '2026-12-05', '08:00 - 11:30', 1, 'DE-Bảo vệ KLTN', 'Bảo vệ Project');

  // SE180123 Exams
  insertExam.run('SE180123', 'PRN211', 'Fall2025', '2025-12-12', '07:30 - 09:00', 1, 'DE-201', 'PE (Practical Exam)');
  insertExam.run('SE180123', 'SWE201', 'Fall2025', '2025-12-16', '09:15 - 10:45', 2, 'AL-402', 'FE lần 1');
  insertExam.run('SE180123', 'SWP391', 'Spring2026', '2026-04-20', '08:00 - 11:30', 1, 'DE-201', 'Bảo vệ Project');
  insertExam.run('SE180123', 'ITE302', 'Spring2026', '2026-04-22', '13:00 - 14:30', 4, 'BE-105', 'FE lần 1');
  insertExam.run('SE180123', 'OJT401', 'Fall2026', '2026-12-15', '08:30 - 11:00', 1, 'F-Ville 2', 'Báo cáo OJT Doanh nghiệp');

  // 9. Grades for ALL semesters
  const insertGrade = db.prepare(`
    INSERT INTO grades (student_roll, subject_code, semester_code, component_name, weight, value, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Spring 2025
  insertGrade.run('CT193667', 'PRF192', 'Spring2025', 'Attendance', 0.1, 10.0, 'Passed');
  insertGrade.run('CT193667', 'PRF192', 'Spring2025', 'Lab 1-5', 0.2, 8.5, 'Passed');
  insertGrade.run('CT193667', 'PRF192', 'Spring2025', 'Practical Exam', 0.3, 8.0, 'Passed');
  insertGrade.run('CT193667', 'PRF192', 'Spring2025', 'Final Exam', 0.4, 8.8, 'Passed');
  insertGrade.run('CT193667', 'PRF192', 'Spring2025', 'Average', 1.0, 8.52, 'Passed');

  insertGrade.run('CT193667', 'MAE101', 'Spring2025', 'Assignment', 0.2, 8.0, 'Passed');
  insertGrade.run('CT193667', 'MAE101', 'Spring2025', 'Midterm Exam', 0.3, 7.5, 'Passed');
  insertGrade.run('CT193667', 'MAE101', 'Spring2025', 'Final Exam', 0.5, 8.2, 'Passed');
  insertGrade.run('CT193667', 'MAE101', 'Spring2025', 'Average', 1.0, 7.95, 'Passed');

  // Summer 2025
  insertGrade.run('CT193667', 'PRO192', 'Summer2025', 'Attendance', 0.1, 10.0, 'Passed');
  insertGrade.run('CT193667', 'PRO192', 'Summer2025', 'Practical Exam', 0.4, 9.0, 'Passed');
  insertGrade.run('CT193667', 'PRO192', 'Summer2025', 'Final Exam', 0.5, 9.2, 'Passed');
  insertGrade.run('CT193667', 'PRO192', 'Summer2025', 'Average', 1.0, 9.20, 'Passed');

  insertGrade.run('CT193667', 'MAD101', 'Summer2025', 'Midterm Exam', 0.4, 8.0, 'Passed');
  insertGrade.run('CT193667', 'MAD101', 'Summer2025', 'Final Exam', 0.6, 8.3, 'Passed');
  insertGrade.run('CT193667', 'MAD101', 'Summer2025', 'Average', 1.0, 8.18, 'Passed');

  // Fall 2025
  insertGrade.run('CT193667', 'CSD201', 'Fall2025', 'Assignment', 0.3, 9.0, 'Passed');
  insertGrade.run('CT193667', 'CSD201', 'Fall2025', 'Practical Exam', 0.3, 8.5, 'Passed');
  insertGrade.run('CT193667', 'CSD201', 'Fall2025', 'Final Exam', 0.4, 8.8, 'Passed');
  insertGrade.run('CT193667', 'CSD201', 'Fall2025', 'Average', 1.0, 8.77, 'Passed');

  insertGrade.run('CT193667', 'DBI202', 'Fall2025', 'Lab 1-6', 0.3, 9.0, 'Passed');
  insertGrade.run('CT193667', 'DBI202', 'Fall2025', 'Practical Exam', 0.3, 8.8, 'Passed');
  insertGrade.run('CT193667', 'DBI202', 'Fall2025', 'Final Exam', 0.4, 8.6, 'Passed');
  insertGrade.run('CT193667', 'DBI202', 'Fall2025', 'Average', 1.0, 8.78, 'Passed');

  // Spring 2026
  insertGrade.run('CT193667', 'PRN211', 'Spring2026', 'Assignment', 0.3, 9.0, 'Passed');
  insertGrade.run('CT193667', 'PRN211', 'Spring2026', 'Practical Exam', 0.3, 8.5, 'Passed');
  insertGrade.run('CT193667', 'PRN211', 'Spring2026', 'Final Exam', 0.4, 8.5, 'Passed');
  insertGrade.run('CT193667', 'PRN211', 'Spring2026', 'Average', 1.0, 8.65, 'Passed');

  insertGrade.run('CT193667', 'SWE201', 'Spring2026', 'Project Assignment', 0.4, 8.8, 'Passed');
  insertGrade.run('CT193667', 'SWE201', 'Spring2026', 'Final Exam', 0.6, 8.2, 'Passed');
  insertGrade.run('CT193667', 'SWE201', 'Spring2026', 'Average', 1.0, 8.44, 'Passed');

  // Fall 2026 (Current)
  insertGrade.run('CT193667', 'KRG301', 'Fall2026', 'Attendance', 0.1, 10.0, 'Passed');
  insertGrade.run('CT193667', 'KRG301', 'Fall2026', 'Midterm Exam', 0.3, 8.5, 'Passed');
  insertGrade.run('CT193667', 'KRG301', 'Fall2026', 'Assignment', 0.2, 9.0, 'Passed');
  insertGrade.run('CT193667', 'KRG301', 'Fall2026', 'Final Exam', 0.4, 8.0, 'Passed');
  insertGrade.run('CT193667', 'KRG301', 'Fall2026', 'Average', 1.0, 8.45, 'Passed');

  insertGrade.run('CT193667', 'IAE301', 'Fall2026', 'Lab 1-5', 0.2, 9.5, 'Passed');
  insertGrade.run('CT193667', 'IAE301', 'Fall2026', 'Midterm Exam', 0.3, 8.0, 'Passed');
  insertGrade.run('CT193667', 'IAE301', 'Fall2026', 'Final Practical', 0.5, 8.5, 'Passed');
  insertGrade.run('CT193667', 'IAE301', 'Fall2026', 'Average', 1.0, 8.55, 'Passed');

  insertGrade.run('CT193667', 'SWP391', 'Fall2026', 'Iteration 1', 0.2, 8.5, 'Passed');
  insertGrade.run('CT193667', 'SWP391', 'Fall2026', 'Iteration 2', 0.2, 9.0, 'Passed');
  insertGrade.run('CT193667', 'SWP391', 'Fall2026', 'Iteration 3', 0.2, 8.5, 'Passed');
  insertGrade.run('CT193667', 'SWP391', 'Fall2026', 'Final Defense', 0.4, 9.0, 'Passed');
  insertGrade.run('CT193667', 'SWP391', 'Fall2026', 'Average', 1.0, 8.8, 'Passed');

  // SE180123 Grades
  insertGrade.run('SE180123', 'PRN211', 'Fall2025', 'Assignment', 0.3, 9.0, 'Passed');
  insertGrade.run('SE180123', 'PRN211', 'Fall2025', 'Practical Exam', 0.3, 8.5, 'Passed');
  insertGrade.run('SE180123', 'PRN211', 'Fall2025', 'Final Exam', 0.4, 8.8, 'Passed');
  insertGrade.run('SE180123', 'PRN211', 'Fall2025', 'Average', 1.0, 8.77, 'Passed');

  insertGrade.run('SE180123', 'SWE201', 'Fall2025', 'Assignment', 0.4, 9.0, 'Passed');
  insertGrade.run('SE180123', 'SWE201', 'Fall2025', 'Final Exam', 0.6, 9.2, 'Passed');
  insertGrade.run('SE180123', 'SWE201', 'Fall2025', 'Average', 1.0, 9.12, 'Passed');

  insertGrade.run('SE180123', 'SWP391', 'Spring2026', 'Defense', 1.0, 9.3, 'Passed');
  insertGrade.run('SE180123', 'SWP391', 'Spring2026', 'Average', 1.0, 9.3, 'Passed');

  insertGrade.run('SE180123', 'ITE302', 'Spring2026', 'Final Exam', 1.0, 8.6, 'Passed');
  insertGrade.run('SE180123', 'ITE302', 'Spring2026', 'Average', 1.0, 8.6, 'Passed');

  insertGrade.run('SE180123', 'OJT401', 'Fall2026', 'Evaluation', 1.0, 9.5, 'Passed');
  insertGrade.run('SE180123', 'OJT401', 'Fall2026', 'Average', 1.0, 9.5, 'Passed');

  // 10. Attendance Summary for ALL semesters
  const insertAtt = db.prepare(`
    INSERT INTO attendance_summary (student_roll, subject_code, semester_code, total_slots, absent_slots, absent_percentage, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Spring 2025
  insertAtt.run('CT193667', 'PRF192', 'Spring2025', 30, 0, 0.0, 'Passed');
  insertAtt.run('CT193667', 'MAE101', 'Spring2025', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'CSI104', 'Spring2025', 30, 0, 0.0, 'Passed');
  // Summer 2025
  insertAtt.run('CT193667', 'PRO192', 'Summer2025', 30, 0, 0.0, 'Passed');
  insertAtt.run('CT193667', 'MAD101', 'Summer2025', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'OSG202', 'Summer2025', 30, 2, 6.67, 'Passed');
  // Fall 2025
  insertAtt.run('CT193667', 'CSD201', 'Fall2025', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'DBI202', 'Fall2025', 30, 0, 0.0, 'Passed');
  insertAtt.run('CT193667', 'NWC203', 'Fall2025', 30, 1, 3.33, 'Passed');
  // Spring 2026
  insertAtt.run('CT193667', 'PRN211', 'Spring2026', 30, 0, 0.0, 'Passed');
  insertAtt.run('CT193667', 'MAS291', 'Spring2026', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'SWE201', 'Spring2026', 30, 0, 0.0, 'Passed');
  // Fall 2026 (Current)
  insertAtt.run('CT193667', 'KRG301', 'Fall2026', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'KOR411', 'Fall2026', 30, 2, 6.67, 'Passed');
  insertAtt.run('CT193667', 'VOV114', 'Fall2026', 20, 0, 0.0, 'Passed');
  insertAtt.run('CT193667', 'IAE301', 'Fall2026', 30, 1, 3.33, 'Passed');
  insertAtt.run('CT193667', 'SWP391', 'Fall2026', 30, 0, 0.0, 'Passed');

  // SE180123 Attendance
  insertAtt.run('SE180123', 'PRN211', 'Fall2025', 30, 0, 0.0, 'Passed');
  insertAtt.run('SE180123', 'SWE201', 'Fall2025', 30, 1, 3.33, 'Passed');
  insertAtt.run('SE180123', 'SWP391', 'Spring2026', 30, 0, 0.0, 'Passed');
  insertAtt.run('SE180123', 'ITE302', 'Spring2026', 30, 0, 0.0, 'Passed');
  insertAtt.run('SE180123', 'OJT401', 'Fall2026', 60, 0, 0.0, 'Passed');

  // 11. News Categories & News
  const insertNewsCat = db.prepare('INSERT INTO news_categories (id, name) VALUES (?, ?)');
  insertNewsCat.run('01a07a13-8e0b-7002-a6a9-7ce20a40ab08', 'Thông báo tài chính');
  insertNewsCat.run('01a07a13-8e0b-7000-ad8b-5ba620c6e91e', 'Thông tin chung');
  insertNewsCat.run('01a0eb6b-e6cb-74c4-828a-706f371cbbc2', 'Thông tin Đào tạo');
  insertNewsCat.run('01a0d1a7-5d2c-7c89-91e7-3bf096c4e782', 'Thông tin Khảo Thí');

  const insertNews = db.prepare(`
    INSERT INTO news (id, category_id, title, content, author, published_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNews.run('01a19d16-7dae-7b7e-adbb-3a86d4b7b3bf', '01a0d1a7-5d2c-7c89-91e7-3bf096c4e782', 'Thông báo lịch thi kết thúc học phần lần 1, lần 2 các môn học Block 1-4 học kỳ Fall 2026', 'Phòng Khảo Thí thông báo lịch thi kết thúc học phần cho các lớp Block 1-4 kỳ Fall 2026. Sinh viên có mặt trước giờ thi 15 phút, mang theo thẻ sinh viên hoặc CCCD.', 'Phòng Khảo Thí', '02/11/2026 23:27');
  insertNews.run('01a19b13-939d-7dd8-9414-bca262bc4bc2', '01a0d1a7-5d2c-7c89-91e7-3bf096c4e782', 'Thông báo danh sách thi kết thúc học phần lần 2 võ 1 VOV114 half 1 ngày 04/11/2026', 'Danh sách sinh viên thi lại võ VOV114 ngày 04/11/2026 tại Sân Vovinam 1. Trang phục: Võ phục Vovinam chuẩn quy định.', 'Phòng Khảo Thí', '02/11/2026 14:05');
  insertNews.run('01a19b11-3f80-7091-9edb-b982747018a5', '01a0d1a7-5d2c-7c89-91e7-3bf096c4e782', 'Thông báo điểm thi giữa kỳ môn KRG301 học kỳ Fall 2026', 'Đã cập nhật điểm thi giữa kỳ môn KRG301 trên hệ thống CAP. Sinh viên kiểm tra báo cáo điểm. Hạn phúc khảo đến hết ngày 07/11/2026.', 'Phòng Khảo Thí', '02/11/2026 14:02');
  insertNews.run('01a180c3-98b3-71d2-9728-a410a970a343', '01a0eb6b-e6cb-74c4-828a-706f371cbbc2', 'V/v: Cập nhật mã môn các mức tiếng anh chuẩn bị từ Half 2 – Học kỳ Fall 2026', 'Phòng Đào tạo thông báo cập nhật lộ trình và mã môn học tiếng Anh chuẩn bị dành cho sinh viên khóa 19 và 20 kể từ Half 2.', 'Phòng Đào tạo', '28/10/2026 11:27');

  // 12. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, body, link_url, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run('CT193667', 'Lịch thi mới', 'Bạn có lịch thi môn VOV114 vào ngày 04/11/2026 lúc 09:15.', '/ExamSchedule', 0, '2026-11-03 10:00:00');
  insertNotif.run('CT193667', 'Điểm số cập nhật', 'Điểm thi giữa kỳ môn KRG301 đã được công bố: 8.5 điểm.', '/Report/Grade', 0, '2026-11-02 15:30:00');
  insertNotif.run('CT193667', 'Nhắc nhở học tập', 'Ngày mai bạn có 2 ca học lúc Slot 1 và Slot 2.', '/WeeklyTimetable', 1, '2026-11-01 18:00:00');

  // SE180123 Notifications
  insertNotif.run('SE180123', 'Thông báo tiếp nhận OJT', 'Bạn đã được CTL Software duyệt tiếp nhận thực tập vị trí Fullstack Web Developer.', '/Report/OjtConditions', 0, '2026-11-01 09:00:00');
  insertNotif.run('SE180123', 'Học phí OJT', 'Đã hoàn tất quyết toán kinh phí thực tập doanh nghiệp kỳ Fall 2026.', '/Transaction', 1, '2026-10-28 14:00:00');

  // 13. Applications
  const insertApp = db.prepare(`
    INSERT INTO applications (student_roll, app_type, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertApp.run('CT193667', 'Đơn xin nghỉ học có phép', 'Lý do: Đi khám bệnh tại bệnh viện', 'Đã duyệt', '2026-10-15 08:30:00');

  // 14. Curriculum
  const insertCurriculum = db.prepare(`
    INSERT INTO curriculum (major_code, semester_no, subject_code, subject_name, credits, prerequisites)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const currData = [
    ['BIT_IA_19A_AS', 1, 'PRF192', 'Programming Fundamentals', 3, 'None'],
    ['BIT_IA_19A_AS', 1, 'MAE101', 'Mathematics for Engineering', 3, 'None'],
    ['BIT_IA_19A_AS', 1, 'CSI104', 'Introduction to Computer Science', 3, 'None'],
    ['BIT_IA_19A_AS', 1, 'VOV114', 'Vovinam 1', 2, 'None'],
    ['BIT_IA_19A_AS', 2, 'PRO192', 'Object-Oriented Programming', 3, 'PRF192'],
    ['BIT_IA_19A_AS', 2, 'MAD101', 'Discrete Mathematics', 3, 'MAE101'],
    ['BIT_IA_19A_AS', 2, 'OSG202', 'Operating Systems', 3, 'CSI104'],
    ['BIT_IA_19A_AS', 2, 'VOV124', 'Vovinam 2', 2, 'VOV114'],
    ['BIT_IA_19A_AS', 3, 'CSD201', 'Data Structures and Algorithms', 3, 'PRO192'],
    ['BIT_IA_19A_AS', 3, 'DBI202', 'Introduction to Databases', 3, 'None'],
    ['BIT_IA_19A_AS', 3, 'NWC203', 'Computer Networking', 3, 'None'],
    ['BIT_IA_19A_AS', 3, 'VOV134', 'Vovinam 3', 2, 'VOV124'],
    ['BIT_IA_19A_AS', 4, 'PRN211', 'Basic Cross-Platform Programming with .NET', 3, 'PRO192'],
    ['BIT_IA_19A_AS', 4, 'MAS291', 'Statistics and Probability', 3, 'MAE101'],
    ['BIT_IA_19A_AS', 4, 'SWE201', 'Introduction to Software Engineering', 3, 'PRO192'],
    ['BIT_IA_19A_AS', 4, 'IAE301', 'Information Assurance Engineering', 3, 'NWC203'],
    ['BIT_IA_19A_AS', 5, 'SWP391', 'Software Development Project', 3, 'SWE201, PRN211'],
    ['BIT_IA_19A_AS', 5, 'KRG301', 'Korean General 3', 3, 'None'],
    ['BIT_IA_19A_AS', 5, 'KOR411', 'Korean for Communication 4', 3, 'KRG301'],
    ['BIT_IA_19A_AS', 5, 'ITE302', 'Ethics in IT', 3, 'None'],
    ['BIT_IA_19A_AS', 6, 'OJT401', 'On-the-Job Training (OJT)', 10, 'Hoàn thành 90 tín chỉ'],
    ['BIT_IA_19A_AS', 7, 'CRY301', 'Cryptography and Network Security', 3, 'IAE301'],
    ['BIT_IA_19A_AS', 7, 'FOR301', 'Digital Forensics', 3, 'IAE301'],
    ['BIT_IA_19A_AS', 8, 'PEN301', 'Penetration Testing and Ethical Hacking', 3, 'CRY301'],
    ['BIT_IA_19A_AS', 8, 'MAL301', 'Malware Analysis and Reverse Engineering', 3, 'IAE301'],
    ['BIT_IA_19A_AS', 9, 'SEP490', 'Graduation Thesis / Capstone Project', 10, 'Hoàn thành OJT & 120 tín chỉ']
  ];
  currData.forEach(row => insertCurriculum.run(...row));

  // 15. Certificates
  const insertCert = db.prepare(`
    INSERT INTO certificates (student_roll, name, cert_type, issue_date, issuer, grade, cert_no)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCert.run('CT193667', 'Chứng chỉ Giáo dục Quốc phòng & An ninh', 'GDQP', '2025-04-10', 'Trung tâm GDQP&AN - ĐHQG Hà Nội', 'Giỏi', 'QPAN-2025-09812');
  insertCert.run('CT193667', 'Chứng chỉ Vovinam - Việt Võ Đạo Lam Đai Nhất', 'Thể chất', '2025-08-20', 'Bộ môn GDTC Đại học CTL', 'Đạt', 'VOV-2025-4421');
  insertCert.run('CT193667', 'Chứng chỉ Tiếng Anh Chuẩn Đầu Vào CTL (Level 5)', 'Ngoại ngữ', '2024-09-05', 'CTL University Language Center', 'Level 5 (B2)', 'ENG-2024-1185');
  insertCert.run('CT193667', 'Coursera: Google Cybersecurity Professional Certificate', 'Chuyên môn', '2026-03-15', 'Coursera / Google', 'Xuất sắc', 'COURSERA-GSEC-7721');

  // 16. Transactions
  const insertTrans = db.prepare(`
    INSERT INTO transactions (student_roll, trans_code, amount, trans_type, description, payment_method, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTrans.run('CT193667', 'TRX-2026-001', 28700000, 'Nộp học phí', 'Học phí kỳ Fall 2026 (Chuyên ngành K19)', 'VNPay QR', 'Thành công', '2026-08-25 14:20:11');
  insertTrans.run('CT193667', 'TRX-2026-002', 1500000, 'Nạp tiền ví', 'Nạp tiền vào tài khoản sinh viên CTL', 'MoMo', 'Thành công', '2026-09-02 09:15:33');
  insertTrans.run('CT193667', 'TRX-2026-003', 250000, 'Lệ phí thi', 'Lệ phí đăng ký thi kết thúc học phần lại', 'Số dư ví CTL', 'Thành công', '2026-10-20 16:45:00');

  // 17. Shopping Cart
  const insertCart = db.prepare(`
    INSERT INTO shopping_cart (student_roll, fee_title, semester_code, amount, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCart.run('CT193667', 'Lệ phí cấp bảng điểm song ngữ bản cứng', 'Fall2026', 100000, '2026-11-20', 'Chưa thanh toán');
  insertCart.run('CT193667', 'Tạm ứng học phí kỳ Spring 2027', 'Spring2027', 28700000, '2026-12-25', 'Chưa thanh toán');

  // 18. Wishlist
  const insertWish = db.prepare(`
    INSERT INTO wishlist (student_roll, subject_code, semester_code, desired_slot, note, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertWish.run('CT193667', 'NWC203', 'Fall2026', 'Slot 4, 5 (Chiều thứ 3, 5)', 'Nguyện vọng học cải thiện điểm', 'Đang chờ lớp mở', '2026-10-10 11:00:00');

  // 19. FYE Check-in Logs
  const insertFye = db.prepare(`
    INSERT INTO fye_logs (student_roll, event_name, location, checkin_time, points)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertFye.run('CT193667', 'CTL Tech Hackathon 2026 - Lễ Khai Mạc', 'Hội trường Trống Đồng', '2026-10-05 08:30:00', 10);
  insertFye.run('CT193667', 'Workshop: An ninh mạng trong kỷ nguyên AI', 'Phòng Hội Thảo Beta', '2026-10-18 14:15:00', 5);
  insertFye.run('CT193667', 'Ngày hội việc làm CTL Career Expo 2026', 'Sân Vườn Sakura', '2026-10-25 09:00:00', 10);

  // 20. Mentor Feedback
  const insertMentor = db.prepare(`
    INSERT INTO mentor_feedback (student_roll, mentor_name, semester_code, rating, comment, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMentor.run('CT193667', 'ThS. Nguyễn Hoàng Long', 'Summer2026', 5, 'Thầy cố vấn rất nhiệt tình, hướng dẫn định hướng chuyên ngành và chọn môn rất chuẩn xác!', '2026-08-10 15:00:00');

  // 21. Documents
  const insertDoc = db.prepare(`
    INSERT INTO documents (title, category, file_size, file_type, download_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDoc.run('Sổ tay sinh viên Đại học CTL 2026 - 2027', 'Quy chế', '4.5 MB', 'PDF', '#', '2026-09-01');
  insertDoc.run('Quy định đào tạo và Khảo thí theo tín chỉ', 'Đào tạo', '2.1 MB', 'PDF', '#', '2026-08-15');
  insertDoc.run('Hướng dẫn quy trình thực tập doanh nghiệp (OJT)', 'OJT', '1.8 MB', 'PDF', '#', '2026-09-10');
  insertDoc.run('Biểu mẫu đơn từ hành chính sinh viên', 'Biểu mẫu', '850 KB', 'DOCX', '#', '2026-08-20');

  // 22. Startup Groups
  const insertStartup = db.prepare(`
    INSERT INTO startup_groups (student_roll, project_name, field, member_count, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertStartup.run('CT193667', 'SafeCampus - Hệ thống nhận diện an ninh học đường bằng AI', 'AI & An toàn thông tin', 4, 'Dự án nghiên cứu giải pháp kiểm soát an ninh tự động tại khuôn viên đại học.', 'Đã được duyệt hỗ trợ', '2026-09-15 10:00:00');

  // 23. Cross Class Change
  const insertCross = db.prepare(`
    INSERT INTO cross_class_requests (student_roll, subject_code, from_class, to_class, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCross.run('CT193667', 'SWP391', 'IA1901_SWP', 'SE1902_SWP', 'Xin đổi sang lớp SE1902 để tiện làm đồ án cùng nhóm bạn chuyên ngành phần mềm', 'Đã duyệt', '2026-09-08 11:20:00');

  console.log('Complete database seeded successfully!');
}

initDatabase();

module.exports = {
  db,
  // User Auth
  findUser: (ident) => {
    return db.prepare(`
      SELECT users.*, students.personal_email
      FROM users
      LEFT JOIN students ON users.roll_number = students.roll_number
      WHERE users.username = ? OR users.email = ? OR users.roll_number = ? OR students.personal_email = ?
    `).get(ident, ident, ident, ident);
  },
  getUserByRoll: (roll) => {
    return db.prepare('SELECT * FROM users WHERE roll_number = ?').get(roll);
  },
  getAllUsers: () => {
    return db.prepare('SELECT id, username, email, roll_number, full_name, role, avatar FROM users').all();
  },
  // Student
  getStudent: (roll) => db.prepare('SELECT * FROM students WHERE roll_number = ?').get(roll),
  updateStudentProfile: (roll, { phone, address, gender, dob }) => {
    return db.prepare('UPDATE students SET phone = ?, address = ?, gender = ?, dob = ? WHERE roll_number = ?')
      .run(phone, address, gender, dob, roll);
  },
  topupBalance: (roll, amount) => {
    return db.prepare('UPDATE students SET balance = balance + ? WHERE roll_number = ?').run(amount, roll);
  },
  getCampuses: () => db.prepare('SELECT * FROM campuses').all(),
  getSemesters: () => db.prepare('SELECT * FROM semesters ORDER BY start_date DESC').all(),
  // Multi-semester queries
  getSchedules: (roll, semester = 'Fall2026') => {
    return db.prepare(`
      SELECT s.*, c.class_code, sub.code as subject_code, sub.name as subject_name
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN subjects sub ON c.subject_code = sub.code
      WHERE s.student_roll = ? AND s.semester_code = ?
      ORDER BY s.study_date ASC, s.slot ASC
    `).all(roll, semester);
  },
  getExamSchedules: (roll, semester = 'Fall2026') => {
    return db.prepare(`
      SELECT e.*, s.name as subject_name, s.credits
      FROM exam_schedules e
      JOIN subjects s ON e.subject_code = s.code
      WHERE e.student_roll = ? AND e.semester_code = ?
      ORDER BY e.exam_date ASC, e.slot ASC
    `).all(roll, semester);
  },
  getAttendanceSummary: (roll, semester = 'Fall2026') => {
    return db.prepare(`
      SELECT a.*, s.name as subject_name, s.credits
      FROM attendance_summary a
      JOIN subjects s ON a.subject_code = s.code
      WHERE a.student_roll = ? AND a.semester_code = ?
    `).all(roll, semester);
  },
  getGrades: (roll, semester = 'Fall2026') => {
    return db.prepare(`
      SELECT g.*, s.name as subject_name, s.credits
      FROM grades g
      JOIN subjects s ON g.subject_code = s.code
      WHERE g.student_roll = ? AND g.semester_code = ?
    `).all(roll, semester);
  },
  getAllGradesForTranscript: (roll) => {
    return db.prepare(`
      SELECT g.semester_code, sem.name as semester_name, g.subject_code, sub.name as subject_name, sub.credits, g.value as final_grade, g.status
      FROM grades g
      JOIN subjects sub ON g.subject_code = sub.code
      JOIN semesters sem ON g.semester_code = sem.code
      WHERE g.student_roll = ? AND g.component_name = 'Average'
      ORDER BY sem.start_date ASC, g.subject_code ASC
    `).all(roll);
  },
  getNews: (categoryId = null) => {
    if (categoryId) {
      return db.prepare(`
        SELECT n.*, c.name as category_name
        FROM news n
        JOIN news_categories c ON n.category_id = c.id
        WHERE n.category_id = ?
        ORDER BY n.published_at DESC
      `).all(categoryId);
    }
    return db.prepare(`
      SELECT n.*, c.name as category_name
      FROM news n
      JOIN news_categories c ON n.category_id = c.id
      ORDER BY n.published_at DESC
    `).all();
  },
  getNewsDetail: (id) => {
    return db.prepare(`
      SELECT n.*, c.name as category_name
      FROM news n
      JOIN news_categories c ON n.category_id = c.id
      WHERE n.id = ?
    `).get(id);
  },
  getNotifications: (roll) => {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC').all(roll);
  },
  getUnreadNotifCount: (roll) => {
    const res = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(roll);
    return res ? res.count : 0;
  },
  markNotifRead: (id, roll) => db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, roll),
  markAllNotifRead: (roll) => db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(roll),
  getApplications: (roll) => db.prepare('SELECT * FROM applications WHERE student_roll = ? ORDER BY id DESC').all(roll),
  createApplication: (roll, type, reason) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return db.prepare('INSERT INTO applications (student_roll, app_type, reason, status, created_at) VALUES (?, ?, ?, ?, ?)').run(roll, type, reason, 'Đang chờ duyệt', now);
  },
  getCurriculum: (majorCode = 'BIT_IA_19A_AS') => {
    return db.prepare('SELECT * FROM curriculum WHERE major_code = ? ORDER BY semester_no ASC, subject_code ASC').all(majorCode);
  },
  getSubjects: () => db.prepare('SELECT * FROM subjects ORDER BY code ASC').all(),
  getCertificates: (roll) => db.prepare('SELECT * FROM certificates WHERE student_roll = ? ORDER BY issue_date DESC').all(roll),
  getTransactions: (roll) => db.prepare('SELECT * FROM transactions WHERE student_roll = ? ORDER BY id DESC').all(roll),
  addTransaction: (roll, amount, type, desc, method) => {
    const code = 'TRX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        INSERT INTO transactions (student_roll, trans_code, amount, trans_type, description, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Thành công', ?)
      `).run(roll, code, amount, type, desc, method, now);
      db.prepare('UPDATE students SET balance = balance + ? WHERE roll_number = ?').run(amount, roll);
      db.exec('COMMIT');
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
      throw err;
    }
    return code;
  },
  getShoppingCart: (roll) => db.prepare('SELECT * FROM shopping_cart WHERE student_roll = ? ORDER BY id DESC').all(roll),
  payCartItem: (roll, itemId) => {
    // All steps run in one transaction; the conditional UPDATEs stop double payment
    // of the same item and overdrawing the wallet under concurrent requests.
    db.exec('BEGIN IMMEDIATE');
    try {
      const item = db.prepare("SELECT * FROM shopping_cart WHERE id = ? AND student_roll = ? AND status = 'Chưa thanh toán'").get(itemId, roll);
      if (!item) {
        db.exec('ROLLBACK');
        return { success: false, code: 'not_found', error: 'Không tìm thấy khoản phí hoặc khoản phí đã được thanh toán' };
      }
      const debit = db.prepare('UPDATE students SET balance = balance - ? WHERE roll_number = ? AND balance >= ?').run(item.amount, roll, item.amount);
      if (debit.changes === 0) {
        db.exec('ROLLBACK');
        return { success: false, code: 'insufficient_balance', error: 'Số dư ví không đủ, vui lòng nạp thêm tiền!' };
      }
      db.prepare("UPDATE shopping_cart SET status = 'Đã thanh toán' WHERE id = ?").run(item.id);
      const code = 'TRX-PAY-' + Date.now().toString(36).toUpperCase() + '-' + item.id;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(`
        INSERT INTO transactions (student_roll, trans_code, amount, trans_type, description, payment_method, status, created_at)
        VALUES (?, ?, ?, 'Thanh toán phí', ?, 'Số dư ví CAP', 'Thành công', ?)
      `).run(roll, code, item.amount, 'Thanh toán: ' + item.fee_title, now);
      db.exec('COMMIT');
      return { success: true };
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
      throw err;
    }
  },
  getWishlist: (roll) => db.prepare('SELECT * FROM wishlist WHERE student_roll = ? ORDER BY id DESC').all(roll),
  addWishlist: (roll, subjectCode, semesterCode, slot, note) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return db.prepare(`
      INSERT INTO wishlist (student_roll, subject_code, semester_code, desired_slot, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'Chờ xếp lớp', ?)
    `).run(roll, subjectCode, semesterCode, slot, note, now);
  },
  getFyeLogs: (roll) => db.prepare('SELECT * FROM fye_logs WHERE student_roll = ? ORDER BY checkin_time DESC').all(roll),
  getMentorFeedback: (roll) => db.prepare('SELECT * FROM mentor_feedback WHERE student_roll = ? ORDER BY id DESC').all(roll),
  addMentorFeedback: (roll, mentorName, semesterCode, rating, comment) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return db.prepare(`
      INSERT INTO mentor_feedback (student_roll, mentor_name, semester_code, rating, comment, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(roll, mentorName, semesterCode, rating, comment, now);
  },
  getDocuments: () => db.prepare('SELECT * FROM documents ORDER BY id ASC').all(),
  getCrossClassRequests: (roll) => db.prepare('SELECT * FROM cross_class_requests WHERE student_roll = ? ORDER BY id DESC').all(roll),
  addCrossClassRequest: (roll, subjectCode, fromClass, toClass, reason) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return db.prepare(`
      INSERT INTO cross_class_requests (student_roll, subject_code, from_class, to_class, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'Chờ duyệt', ?)
    `).run(roll, subjectCode, fromClass, toClass, reason, now);
  },
  getStartupGroups: (roll) => db.prepare('SELECT * FROM startup_groups WHERE student_roll = ? ORDER BY id DESC').all(roll),
  addStartupGroup: (roll, projectName, field, memberCount, desc) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return db.prepare(`
      INSERT INTO startup_groups (student_roll, project_name, field, member_count, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'Chờ xét duyệt', ?)
    `).run(roll, projectName, field, memberCount, desc, now);
  }
};
