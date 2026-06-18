// ===== Data Management Module =====
const DataStore = {
  KEYS: {
    COURSES: 'attendance_courses',
    STUDENTS: 'attendance_students',
    ATTENDANCE: 'attendance_records',
    SETTINGS: 'attendance_settings',
  },

  // ===== Generic CRUD Operations =====
  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ===== Courses =====
  getCourses() {
    return this._get(this.KEYS.COURSES);
  },

  getCourse(id) {
    return this.getCourses().find(c => c.id === id);
  },

  addCourse(name, teacherName) {
    const courses = this.getCourses();
    const newCourse = {
      id: this._generateId(),
      name: name.trim(),
      teacherName: teacherName.trim(),
      createdAt: new Date().toISOString(),
    };
    courses.push(newCourse);
    this._set(this.KEYS.COURSES, courses);
    return newCourse;
  },

  updateCourse(id, name, teacherName) {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      courses[index].name = name.trim();
      courses[index].teacherName = teacherName.trim();
      courses[index].updatedAt = new Date().toISOString();
      this._set(this.KEYS.COURSES, courses);
      return courses[index];
    }
    return null;
  },

  deleteCourse(id) {
    const courses = this.getCourses().filter(c => c.id !== id);
    this._set(this.KEYS.COURSES, courses);
    // Also delete related students and attendance
    const students = this.getStudents().filter(s => s.courseId !== id);
    this._set(this.KEYS.STUDENTS, students);
    const attendance = this.getAttendance().filter(a => a.courseId !== id);
    this._set(this.KEYS.ATTENDANCE, attendance);
  },

  // ===== Students =====
  getStudents(courseId = null) {
    const students = this._get(this.KEYS.STUDENTS);
    if (courseId) return students.filter(s => s.courseId === courseId);
    return students;
  },

  getStudent(id) {
    return this.getStudents().find(s => s.id === id);
  },

  addStudent(courseId, name) {
    const students = this.getStudents();
    const newStudent = {
      id: this._generateId(),
      courseId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    students.push(newStudent);
    this._set(this.KEYS.STUDENTS, students);
    return newStudent;
  },

  addStudentsBulk(courseId, names) {
    const students = this.getStudents();
    const newStudents = names.map(name => ({
      id: this._generateId(),
      courseId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }));
    students.push(...newStudents);
    this._set(this.KEYS.STUDENTS, students);
    return newStudents;
  },

  updateStudent(id, name) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students[index].name = name.trim();
      this._set(this.KEYS.STUDENTS, students);
      return students[index];
    }
    return null;
  },

  deleteStudent(id) {
    const students = this.getStudents().filter(s => s.id !== id);
    this._set(this.KEYS.STUDENTS, students);
    // Also delete related attendance
    const attendance = this.getAttendance().filter(a => a.studentId !== id);
    this._set(this.KEYS.ATTENDANCE, attendance);
  },

  // ===== Attendance =====
  getAttendance(courseId = null, date = null) {
    const records = this._get(this.KEYS.ATTENDANCE);
    let filtered = records;
    if (courseId) filtered = filtered.filter(a => a.courseId === courseId);
    if (date) filtered = filtered.filter(a => a.date === date);
    return filtered;
  },

  getAttendanceByStudent(studentId) {
    return this.getAttendance().filter(a => a.studentId === studentId);
  },

  recordAttendance(courseId, studentId, date, status) {
    const records = this.getAttendance();
    const existingIndex = records.findIndex(
      a => a.courseId === courseId && a.studentId === studentId && a.date === date
    );
    
    const record = {
      id: existingIndex !== -1 ? records[existingIndex].id : this._generateId(),
      courseId,
      studentId,
      date,
      status, // 'present', 'absent', 'excused'
      timestamp: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    this._set(this.KEYS.ATTENDANCE, records);
    return record;
  },

  recordBulkAttendance(courseId, date, attendanceMap) {
    const records = this.getAttendance();
    
    Object.entries(attendanceMap).forEach(([studentId, status]) => {
      const existingIndex = records.findIndex(
        a => a.courseId === courseId && a.studentId === studentId && a.date === date
      );
      
      const record = {
        id: existingIndex !== -1 ? records[existingIndex].id : this._generateId(),
        courseId,
        studentId,
        date,
        status,
        timestamp: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }
    });
    
    this._set(this.KEYS.ATTENDANCE, records);
  },

  deleteAttendance(id) {
    const records = this.getAttendance().filter(a => a.id !== id);
    this._set(this.KEYS.ATTENDANCE, records);
  },

  // ===== Statistics =====
  getStudentStats(studentId) {
    const records = this.getAttendanceByStudent(studentId);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    
    return { total, present, absent, excused, rate };
  },

  getCourseStats(courseId) {
    const records = this.getAttendance(courseId);
    const students = this.getStudents(courseId);
    const dates = [...new Set(records.map(r => r.date))].sort().reverse();
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    
    return {
      totalStudents: students.length,
      totalRecords: total,
      present,
      absent,
      excused,
      dates,
      rate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
    };
  },

  getAttendanceDates(courseId) {
    const records = this.getAttendance(courseId);
    const dates = [...new Set(records.map(r => r.date))].sort().reverse();
    return dates.map(date => {
      const dayRecords = records.filter(r => r.date === date);
      return {
        date,
        total: dayRecords.length,
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        excused: dayRecords.filter(r => r.status === 'excused').length,
      };
    });
  },

  // ===== Settings =====
  getSettings() {
    const defaults = {
      theme: 'light',
      language: 'ar',
    };
    try {
      const saved = localStorage.getItem(this.KEYS.SETTINGS);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ===== Export/Import =====
  exportData() {
    return {
      courses: this.getCourses(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  },

  importData(data) {
    if (data.courses) this._set(this.KEYS.COURSES, data.courses);
    if (data.students) this._set(this.KEYS.STUDENTS, data.students);
    if (data.attendance) this._set(this.KEYS.ATTENDANCE, data.attendance);
    if (data.settings) this._set(this.KEYS.SETTINGS, data.settings);
  },

  // ===== Helpers =====
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  formatShortDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    });
  },

  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },
};

window.DataStore = DataStore;
