// ===== Main Application =====
const App = {
  currentView: 'home',
  currentParams: {},
  bulkStatuses: {},

  // ===== Initialization =====
  init() {
    this.applyTheme();
    this.navigate('home');
    this.registerSW();
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  },

  applyTheme() {
    const settings = DataStore.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
  },

  // ===== Navigation =====
  navigate(view, params = {}) {
    this.currentView = view;
    this.currentParams = typeof params === 'string' ? { id: params } : params;
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    let html = '';

    switch (this.currentView) {
      case 'home':
        html = this.renderHome();
        break;
      case 'course':
        html = this.renderCourse();
        break;
      case 'attendance':
        html = this.renderAttendance();
        break;
      case 'stats':
        html = this.renderStudentStats();
        break;
      case 'dayDetail':
        html = this.renderDayDetail();
        break;
      case 'courseRecords':
        html = this.renderCourseRecords();
        break;
      case 'globalStats':
        html = this.renderGlobalStats();
        break;
      case 'settings':
        html = this.renderSettings();
        break;
      default:
        html = this.renderHome();
    }

    app.innerHTML = html;
  },

  // ===== HOME PAGE =====
  renderHome() {
    const courses = DataStore.getCourses();
    const searchHtml = Components.searchBar('بحث في الدورات...', 'homeSearch', 'App.filterCourses');

    let courseListHtml;
    if (courses.length === 0) {
      courseListHtml = Components.emptyState(
        'book',
        'لا توجد دورات بعد',
        'ابدأ بإنشاء أول دورة لتسجيل حضور الطلاب',
        `<button class="btn btn-primary" onclick="App.showAddCourseModal()">
          ${getIcon('plus', 18)} إنشاء دورة جديدة
        </button>`
      );
    } else {
      courseListHtml = `
        <div id="courseList" class="list">
          ${courses.map(c => Components.courseCard(c)).join('')}
        </div>
      `;
    }

    return `
      ${Components.header('دوراتي', `${courses.length} دورة`, `
        <button class="icon-btn primary" onclick="App.showAddCourseModal()" title="إضافة دورة">
          ${getIcon('plus', 20)}
        </button>
      `)}
      <div class="page">
        ${courses.length > 0 ? searchHtml : ''}
        ${courseListHtml}
      </div>
      ${Components.bottomNav('home')}
    `;
  },

  filterCourses() {
    const query = document.getElementById('homeSearch')?.value?.toLowerCase() || '';
    const courses = DataStore.getCourses().filter(c =>
      c.name.toLowerCase().includes(query) || c.teacherName.toLowerCase().includes(query)
    );
    const list = document.getElementById('courseList');
    if (list) {
      list.innerHTML = courses.length > 0
        ? courses.map(c => Components.courseCard(c)).join('')
        : Components.emptyState('search', 'لا توجد نتائج', 'جرب البحث بكلمات مختلفة');
    }
  },

  // ===== COURSE PAGE =====
  renderCourse() {
    const course = DataStore.getCourse(this.currentParams.id);
    if (!course) return this.renderHome();

    const students = DataStore.getStudents(course.id);
    const stats = DataStore.getCourseStats(course.id);

    let studentsHtml;
    if (students.length === 0) {
      studentsHtml = Components.emptyState(
        'userPlus',
        'لا يوجد طلاب بعد',
        'أضف طلاباً لهذه الدورة لبدء تسجيل الحضور',
        `<button class="btn btn-primary" onclick="App.showAddStudentModal()">
          ${getIcon('userPlus', 18)} إضافة طلاب
        </button>`
      );
    } else {
      studentsHtml = `
        ${Components.searchBar('بحث عن طالب...', 'courseSearch', 'App.filterCourseStudents')}
        <div id="studentList" class="list">
          ${students.map(s => Components.studentCard(s, course.id)).join('')}
        </div>
      `;
    }

    return `
      ${Components.header(course.name, course.teacherName, `
        <button class="icon-btn" onclick="App.showEditCourseModal('${course.id}')" title="تعديل">
          ${getIcon('edit', 18)}
        </button>
        <button class="icon-btn danger" onclick="App.confirmDeleteCourse('${course.id}')" title="حذف">
          ${getIcon('trash', 18)}
        </button>
      `)}
      <div class="page">
        ${stats.dates.length > 0 ? Components.statsSummary(stats) : ''}
        
        <div class="section-header">
          <div class="section-title">الطلاب (${students.length})</div>
          <button class="section-action" onclick="App.showAddStudentModal()">
            ${getIcon('plus', 14)} إضافة طالب
          </button>
        </div>
        ${studentsHtml}

        ${students.length > 0 ? `
          <div style="margin-top:16px">
            <button class="btn btn-primary btn-block btn-lg" onclick="App.navigate('attendance', '${course.id}')">
              ${getIcon('clipboardCheck', 20)} تسجيل الحضور اليوم
            </button>
          </div>
          <div style="margin-top:10px">
            <button class="btn btn-outline btn-block" onclick="App.showBulkAttendanceModalForCourse('${course.id}')">
              ${getIcon('clipboard', 18)} تسجيل حضور جماعي
            </button>
          </div>
        ` : ''}
      </div>
      ${Components.bottomNav('course', 'course', course.id)}
    `;
  },

  filterCourseStudents() {
    const query = document.getElementById('courseSearch')?.value?.toLowerCase() || '';
    const courseId = this.currentParams.id;
    const students = DataStore.getStudents(courseId).filter(s =>
      s.name.toLowerCase().includes(query)
    );
    const list = document.getElementById('studentList');
    if (list) {
      list.innerHTML = students.length > 0
        ? students.map(s => Components.studentCard(s, courseId)).join('')
        : Components.emptyState('search', 'لا توجد نتائج', 'لا يوجد طلاب يطابقون البحث');
    }
  },

  // ===== COURSE RECORDS PAGE =====
  renderCourseRecords() {
    const courseId = this.currentParams.id;
    const course = DataStore.getCourse(courseId);
    if (!course) return this.renderHome();

    const datesInfo = DataStore.getAttendanceDates(courseId);
    const stats = DataStore.getCourseStats(courseId);

    let datesHtml;
    if (datesInfo.length === 0) {
      datesHtml = Components.emptyState(
        'calendar',
        'لا توجد سجلات بعد',
        'ابدأ بتسجيل الحضور لرؤية السجلات هنا'
      );
    } else {
      datesHtml = `
        <div class="stats-grid" style="margin-bottom:16px;">
          <div class="stat-card success">
            <div class="stat-value">${stats.present}</div>
            <div class="stat-label">إجمالي الحضور</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">${stats.absent}</div>
            <div class="stat-label">إجمالي الغياب</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${stats.excused}</div>
            <div class="stat-label">إجمالي المعذور</div>
          </div>
          <div class="stat-card primary">
            <div class="stat-value">${stats.rate}%</div>
            <div class="stat-label">نسبة الحضور</div>
          </div>
        </div>
        <div class="section-header">
          <div class="section-title">أيام التسجيل (${datesInfo.length})</div>
        </div>
        <div class="list" id="recordsList">
          ${datesInfo.map(d => Components.dateCard(d, courseId)).join('')}
        </div>
      `;
    }

    return `
      ${Components.header(`سجلات ${course.name}`, `${datesInfo.length} يوم مسجل`, `
        <button class="icon-btn" onclick="App.navigate('course', '${courseId}')">
          ${getIcon('back', 18)}
        </button>
      `)}
      <div class="page">
        ${datesHtml}
      </div>
      ${Components.bottomNav('records', 'course', courseId)}
    `;
  },

  // ===== ATTENDANCE PAGE =====
  renderAttendance() {
    const courseId = this.currentParams.id;
    const course = DataStore.getCourse(courseId);
    if (!course) return this.renderHome();

    const students = DataStore.getStudents(courseId);
    const today = DataStore.getToday();
    const todayFormatted = DataStore.formatDate(today);

    let studentsHtml;
    if (students.length === 0) {
      studentsHtml = Components.emptyState(
        'userPlus',
        'لا يوجد طلاب',
        'أضف طلاباً أولاً لتسجيل الحضور'
      );
    } else {
      studentsHtml = students.map(s => {
        const records = DataStore.getAttendance(courseId, today);
        const record = records.find(r => r.studentId === s.id);
        const currentStatus = record ? record.status : '';
        const initial = s.name.charAt(0);
        return `
          <div class="card student-card">
            <div class="student-avatar">${initial}</div>
            <div class="student-info">
              <div class="student-name">${s.name}</div>
            </div>
            <div class="attendance-btns">
              <button class="attendance-btn ${currentStatus === 'present' ? 'present' : ''}" 
                      onclick="App.markAttendance('${s.id}', 'present', '${courseId}', '${today}')">
                ${getIcon('checkCircle', 18)}
                <span class="tooltip">حضور</span>
              </button>
              <button class="attendance-btn ${currentStatus === 'absent' ? 'absent' : ''}" 
                      onclick="App.markAttendance('${s.id}', 'absent', '${courseId}', '${today}')">
                ${getIcon('xCircle', 18)}
                <span class="tooltip">غياب</span>
              </button>
              <button class="attendance-btn ${currentStatus === 'excused' ? 'excused' : ''}" 
                      onclick="App.markAttendance('${s.id}', 'excused', '${courseId}', '${today}')">
                ${getIcon('clock', 18)}
                <span class="tooltip">معذور</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Count statuses for today
    const todayRecords = DataStore.getAttendance(courseId, today);
    const presentCount = todayRecords.filter(r => r.status === 'present').length;
    const absentCount = todayRecords.filter(r => r.status === 'absent').length;
    const excusedCount = todayRecords.filter(r => r.status === 'excused').length;
    const totalStudents = students.length;
    const recordedCount = todayRecords.length;
    const pendingCount = totalStudents - recordedCount;

    return `
      ${Components.header(`تسجيل الحضور`, `${course.name} • ${todayFormatted}`, `
        <button class="icon-btn" onclick="App.navigate('course', '${courseId}')">
          ${getIcon('back', 18)}
        </button>
      `)}
      <div class="page">
        <div class="alert alert-info">
          ${getIcon('info', 18)}
          <span>اضغط على الزر المناسب لتسجيل حالة كل طالب</span>
        </div>

        ${totalStudents > 0 ? `
          <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
            <div class="stat-card success" style="padding:10px">
              <div class="stat-value" style="font-size:var(--font-size-xl)">${presentCount}</div>
              <div class="stat-label">حضور</div>
            </div>
            <div class="stat-card danger" style="padding:10px">
              <div class="stat-value" style="font-size:var(--font-size-xl)">${absentCount}</div>
              <div class="stat-label">غياب</div>
            </div>
            <div class="stat-card warning" style="padding:10px">
              <div class="stat-value" style="font-size:var(--font-size-xl)">${excusedCount}</div>
              <div class="stat-label">معذور</div>
            </div>
            <div class="stat-card" style="padding:10px">
              <div class="stat-value" style="font-size:var(--font-size-xl); color:var(--text-muted)">${pendingCount}</div>
              <div class="stat-label">بانتظار</div>
            </div>
          </div>
        ` : ''}

        <div class="list" id="attendanceList">
          ${studentsHtml}
        </div>

        ${recordedCount > 0 ? `
          <div style="margin-top:16px; display:flex; gap:10px;">
            <button class="btn btn-success btn-block" onclick="App.saveAttendance('${courseId}', '${today}')">
              ${getIcon('save', 18)} حفظ التسجيلات
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  markAttendance(studentId, status, courseId, date) {
    DataStore.recordAttendance(courseId, studentId, date, status);
    this.render();
  },

  saveAttendance(courseId, date) {
    Components.toast('تم حفظ تسجيل الحضور بنجاح', 'success');
    setTimeout(() => this.navigate('course', courseId), 500);
  },

  // ===== STUDENT STATS PAGE =====
  renderStudentStats() {
    const studentId = this.currentParams.id;
    const student = DataStore.getStudent(studentId);
    if (!student) return this.renderHome();

    const course = DataStore.getCourse(student.courseId);
    const stats = DataStore.getStudentStats(studentId);
    const records = DataStore.getAttendanceByStudent(studentId);
    const dates = [...new Set(records.map(r => r.date))].sort().reverse();

    return `
      ${Components.header(student.name, course ? course.name : '', `
        <button class="icon-btn" onclick="App.navigate('course', '${student.courseId}')">
          ${getIcon('back', 18)}
        </button>
      `)}
      <div class="page">
        ${Components.progressRing(parseFloat(stats.rate))}
        ${Components.statsSummary(stats)}

        <div class="section-header">
          <div class="section-title">سجل الحضور</div>
          <span class="badge badge-primary">${dates.length} يوم</span>
        </div>

        ${dates.length > 0 ? `
          <div class="list">
            ${dates.map(date => {
              const record = records.find(r => r.date === date);
              const dateObj = new Date(date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString('ar-SA', { month: 'short' });
              const weekday = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
              const statusColors = { present: 'success', absent: 'danger', excused: 'warning' };
              const statusLabels = { present: 'حاضر', absent: 'غائب', excused: 'معذور' };
              const color = statusColors[record?.status] || 'primary';
              const label = statusLabels[record?.status] || '—';
              return `
                <div class="card" style="display:flex; align-items:center; gap:12px; padding:12px 16px;">
                  <div class="date-badge" style="width:42px; height:42px; border-radius:10px;">
                    <div class="date-badge-day" style="font-size:var(--font-size-lg)">${day}</div>
                    <div class="date-badge-month" style="font-size:9px">${month}</div>
                  </div>
                  <div style="flex:1">
                    <div style="font-size:var(--font-size-sm); font-weight:600;">${weekday}</div>
                    <div style="font-size:var(--font-size-xs); color:var(--text-muted)">${date}</div>
                  </div>
                  <span class="badge badge-${color}">${label}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : Components.emptyState('calendar', 'لا توجد سجلات', 'لم يُسجَّل حضور لهذا الطالب بعد')}
      </div>
    `;
  },

  // ===== DAY DETAIL PAGE =====
  renderDayDetail() {
    const courseId = this.currentParams.id;
    const date = this.currentParams.date;
    
    // Find which course this date belongs to
    let course;
    let records;
    
    if (courseId && date) {
      course = DataStore.getCourse(courseId);
      records = DataStore.getAttendance(courseId, date);
    } else if (date) {
      // Try to find from all courses
      const allRecords = DataStore.getAttendance(null, date);
      if (allRecords.length > 0) {
        course = DataStore.getCourse(allRecords[0].courseId);
        records = allRecords;
      }
    }

    if (!course || !records) {
      return `
        ${Components.header('تفاصيل اليوم', '', `
          <button class="icon-btn" onclick="App.navigate('home')">
            ${getIcon('back', 18)}
          </button>
        `)}
        <div class="page">
          ${Components.emptyState('calendar', 'لا توجد بيانات', 'لا توجد سجلات حضور لهذا اليوم')}
        </div>
      `;
    }

    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
    const fullDate = dateObj.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;

    return `
      ${Components.header(`${weekday}`, `${fullDate} • ${course.name}`, `
        <button class="icon-btn" onclick="App.navigate('courseRecords', '${course.id}')">
          ${getIcon('back', 18)}
        </button>
      `)}
      <div class="page">
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card success">
            <div class="stat-value">${presentCount}</div>
            <div class="stat-label">حضور</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value">${absentCount}</div>
            <div class="stat-label">غياب</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${excusedCount}</div>
            <div class="stat-label">معذور</div>
          </div>
        </div>

        <div class="section-header" style="margin-top:8px">
          <div class="section-title">حالة الطلاب</div>
        </div>
        <div class="list">
          ${records.map(r => {
            const student = DataStore.getStudent(r.studentId);
            if (!student) return '';
            return Components.dayDetailRow(student, r.status);
          }).join('')}
        </div>
      </div>
    `;
  },

  // ===== GLOBAL STATS PAGE =====
  renderGlobalStats() {
    const courses = DataStore.getCourses();
    const allStudents = DataStore.getStudents();
    const allAttendance = DataStore.getAttendance();

    const totalPresent = allAttendance.filter(r => r.status === 'present').length;
    const totalAbsent = allAttendance.filter(r => r.status === 'absent').length;
    const totalExcused = allAttendance.filter(r => r.status === 'excused').length;
    const overallRate = allAttendance.length > 0
      ? ((totalPresent / allAttendance.length) * 100).toFixed(1)
      : 0;

    const allDates = [...new Set(allAttendance.map(r => r.date))].sort().reverse();

    return `
      ${Components.header('الإحصائيات العامة', '', `
        <button class="icon-btn" onclick="App.navigate('home')">
          ${getIcon('home', 18)}
        </button>
      `)}
      <div class="page">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-value">${courses.length}</div>
            <div class="stat-label">الدورات</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">${allStudents.length}</div>
            <div class="stat-label">الطلاب</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">${allDates.length}</div>
            <div class="stat-label">أيام التسجيل</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${overallRate}%</div>
            <div class="stat-label">نسبة الحضور العامة</div>
          </div>
        </div>

        ${allAttendance.length > 0 ? `
          <div class="card" style="margin-top:8px">
            <div class="section-title" style="margin-bottom:12px">توزيع الحالات</div>
            <div class="progress-bar" style="height:12px;">
              <div style="display:flex; height:100%; border-radius:var(--radius-full); overflow:hidden;">
                <div style="width:${(totalPresent/allAttendance.length)*100}%; background:var(--success);"></div>
                <div style="width:${(totalExcused/allAttendance.length)*100}%; background:var(--warning);"></div>
                <div style="width:${(totalAbsent/allAttendance.length)*100}%; background:var(--danger);"></div>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px;">
              <div class="date-stat present"><span class="dot"></span> حضور ${totalPresent}</div>
              <div class="date-stat excused"><span class="dot"></span> معذور ${totalExcused}</div>
              <div class="date-stat absent"><span class="dot"></span> غياب ${totalAbsent}</div>
            </div>
          </div>
        ` : ''}

        <div class="section-header" style="margin-top:20px">
          <div class="section-title">الدورات</div>
        </div>
        ${courses.length > 0 ? `
          <div class="list">
            ${courses.map(c => {
              const cStats = DataStore.getCourseStats(c.id);
              return `
                <div class="card card-clickable" onclick="App.navigate('course', '${c.id}')" style="padding:14px 16px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div class="course-icon" style="width:40px; height:40px;">${getIcon('book', 20)}</div>
                    <div style="flex:1;">
                      <div style="font-weight:600;">${c.name}</div>
                      <div style="font-size:var(--font-size-xs); color:var(--text-secondary);">${cStats.totalStudents} طالب • ${cStats.dates.length} يوم • ${cStats.rate}%</div>
                    </div>
                    <div class="course-arrow">${getIcon('chevronLeft', 18)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : Components.emptyState('book', 'لا توجد دورات', 'ابدأ بإنشاء دورة جديدة')}

        ${allStudents.length > 0 ? `
          <div class="section-header" style="margin-top:20px">
            <div class="section-title">أفضل الطلاب حضوراً</div>
          </div>
          <div class="list">
            ${allStudents
              .map(s => ({ student: s, stats: DataStore.getStudentStats(s.id) }))
              .filter(s => s.stats.total > 0)
              .sort((a, b) => parseFloat(b.stats.rate) - parseFloat(a.stats.rate))
              .slice(0, 5)
              .map(({ student, stats }) => `
                <div class="card" style="display:flex; align-items:center; gap:12px; padding:12px 16px;">
                  <div class="student-avatar" style="width:36px; height:36px; font-size:var(--font-size-sm);">
                    ${student.name.charAt(0)}
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:var(--font-size-sm); font-weight:600;">${student.name}</div>
                    <div style="font-size:var(--font-size-xs); color:var(--text-secondary);">${stats.present}/${stats.total} حضور</div>
                  </div>
                  <span class="badge badge-success">${stats.rate}%</span>
                </div>
              `).join('')}
          </div>
        ` : ''}
      </div>
      ${Components.bottomNav('stats')}
    `;
  },

  // ===== SETTINGS PAGE =====
  renderSettings() {
    const settings = DataStore.getSettings();
    const courses = DataStore.getCourses();
    const students = DataStore.getStudents();
    const attendance = DataStore.getAttendance();

    return `
      ${Components.header('الإعدادات')}
      <div class="page">
        <div class="card" style="padding:0; overflow:hidden;">
          <div class="settings-list">
            ${Components.settingsItem(
              'moon',
              'الوضع الداكن',
              `<div class="toggle ${settings.theme === 'dark' ? 'active' : ''}" onclick="App.toggleTheme()"></div>`,
              'var(--primary-bg)',
              'var(--primary)'
            )}
            ${Components.settingsItem(
              'database',
              'البيانات المحفوظة',
              `<span style="font-size:var(--font-size-sm); color:var(--text-secondary);">${courses.length} دورة • ${students.length} طالب</span>`,
              'var(--success-bg)',
              'var(--success)'
            )}
          </div>
        </div>

        <div class="section-header" style="margin-top:20px">
          <div class="section-title">الإدارة</div>
        </div>
        <div class="card" style="padding:0; overflow:hidden;">
          <div class="settings-list">
            <div class="settings-item" style="cursor:pointer;" onclick="App.exportData()">
              <div class="settings-item-left">
                <div class="settings-item-icon" style="background:var(--info-bg); color:var(--info);">
                  ${getIcon('download', 18)}
                </div>
                <div class="settings-item-text">تصدير البيانات</div>
              </div>
              ${getIcon('chevronLeft', 18)}
            </div>
            <div class="settings-item" style="cursor:pointer;" onclick="App.importDataPrompt()">
              <div class="settings-item-left">
                <div class="settings-item-icon" style="background:var(--warning-bg); color:var(--warning);">
                  ${getIcon('upload', 18)}
                </div>
                <div class="settings-item-text">استيراد البيانات</div>
              </div>
              ${getIcon('chevronLeft', 18)}
            </div>
            <div class="settings-item" style="cursor:pointer;" onclick="App.confirmClearAll()">
              <div class="settings-item-left">
                <div class="settings-item-icon" style="background:var(--danger-bg); color:var(--danger);">
                  ${getIcon('trash', 18)}
                </div>
                <div class="settings-item-text" style="color:var(--danger);">مسح جميع البيانات</div>
              </div>
              ${getIcon('chevronLeft', 18)}
            </div>
          </div>
        </div>

        <div class="section-header" style="margin-top:20px">
          <div class="section-title">حول التطبيق</div>
        </div>
        <div class="card">
          ${Components.summaryItem('info', 'الإصدار', '1.0.0')}
          ${Components.summaryItem('database', 'النوع', 'تطبيق ويب تفاعلي (PWA)')}
          ${Components.summaryItem('zap', 'التخزين', 'محلية على الجهاز')}
        </div>
      </div>
      ${Components.bottomNav('settings')}
    `;
  },

  // ===== Theme Toggle =====
  toggleTheme() {
    const settings = DataStore.getSettings();
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    DataStore.saveSettings(settings);
    this.applyTheme();
    this.render();
  },

  // ===== MODALS =====

  // Add Course Modal
  showAddCourseModal() {
    const content = `
      ${Components.formInput('courseName', 'اسم الدورة', 'text', 'مثال: règles de grammaire')}
      ${Components.formInput('teacherName', 'اسم الشيخ / المعلم', 'text', 'مثال: الشيخ محمد')}
      <button class="btn btn-primary btn-block" onclick="App.addCourse()" style="margin-top:8px">
        ${getIcon('plus', 18)} إنشاء الدورة
      </button>
    `;
    this.showModal('إضافة دورة جديدة', content);
  },

  addCourse() {
    const name = document.getElementById('courseName')?.value;
    const teacher = document.getElementById('teacherName')?.value;
    if (!name?.trim() || !teacher?.trim()) {
      Components.toast('يرجى ملء جميع الحقول', 'error');
      return;
    }
    DataStore.addCourse(name, teacher);
    this.closeModal();
    Components.toast('تم إنشاء الدورة بنجاح');
    this.render();
  },

  // Edit Course Modal
  showEditCourseModal(courseId) {
    const course = DataStore.getCourse(courseId);
    if (!course) return;
    const content = `
      ${Components.formInput('editCourseName', 'اسم الدورة', 'text', '', course.name)}
      ${Components.formInput('editTeacherName', 'اسم الشيخ / المعلم', 'text', '', course.teacherName)}
      <button class="btn btn-primary btn-block" onclick="App.updateCourse('${courseId}')" style="margin-top:8px">
        ${getIcon('save', 18)} حفظ التعديلات
      </button>
    `;
    this.showModal('تعديل الدورة', content);
  },

  updateCourse(courseId) {
    const name = document.getElementById('editCourseName')?.value;
    const teacher = document.getElementById('editTeacherName')?.value;
    if (!name?.trim() || !teacher?.trim()) {
      Components.toast('يرجى ملء جميع الحقول', 'error');
      return;
    }
    DataStore.updateCourse(courseId, name, teacher);
    this.closeModal();
    Components.toast('تم تحديث الدورة');
    this.render();
  },

  // Delete Course Confirmation
  confirmDeleteCourse(courseId) {
    const course = DataStore.getCourse(courseId);
    if (!course) return;
    const students = DataStore.getStudents(courseId);
    this.showConfirm(
      'حذف الدورة',
      `هل أنت متأكد من حذف "${course.name}"؟ سيتم حذف ${students.length} طالب وجميع سجلات الحضور.`,
      'حذف',
      'danger',
      () => {
        DataStore.deleteCourse(courseId);
        Components.toast('تم حذف الدورة');
        this.navigate('home');
      }
    );
  },

  // Add Student Modal
  showAddStudentModal() {
    const courseId = this.currentParams.id;
    const students = DataStore.getStudents(courseId);
    const content = `
      <div class="alert alert-success" style="margin-bottom:16px">
        ${getIcon('userPlus', 18)}
        <span>عدد الطلاب الحالي: <strong id="studentCount">${students.length}</strong></span>
      </div>
      ${Components.formInput('studentName', 'اسم الطالب', 'text', 'أدخل اسم الطالب')}
      <button class="btn btn-primary btn-block" onclick="App.addStudent('${courseId}')" style="margin-top:8px">
        ${getIcon('userPlus', 18)} إضافة الطالب
      </button>
      <div class="divider"></div>
      <div style="text-align:center; font-size:var(--font-size-sm); color:var(--text-secondary); margin-bottom:12px;">أو أضف عدة طلاب دفعة واحدة</div>
      ${Components.formInput('bulkStudents', 'أسماء الطلاب (سطر لكل اسم)', 'textarea', 'محمد\nأحمد\nخالد\n...')}
      <button class="btn btn-secondary btn-block" onclick="App.addBulkStudents('${courseId}')">
        ${getIcon('users', 18)} إضافة الجميع
      </button>
      <div class="divider"></div>
      <button class="btn btn-outline btn-block" onclick="App.closeModalAndRefresh()">
        ${getIcon('close', 18)} إغلاق وتحديث القائمة
      </button>
    `;
    this.showModal('إضافة طلاب', content);
    // Focus the name input
    setTimeout(() => document.getElementById('studentName')?.focus(), 300);
  },

  closeModalAndRefresh() {
    this.closeModal();
    this.render();
  },

  addStudent(courseId) {
    const name = document.getElementById('studentName');
    if (!name?.value?.trim()) {
      Components.toast('يرجى إدخال اسم الطالب', 'error');
      return;
    }
    DataStore.addStudent(courseId, name.value);
    name.value = '';
    name.focus();
    Components.toast('تمت إضافة الطالب بنجاح');
    // Update student count in the modal if possible
    const students = DataStore.getStudents(courseId);
    const counter = document.getElementById('studentCount');
    if (counter) counter.textContent = students.length;
  },

  addBulkStudents(courseId) {
    const textarea = document.getElementById('bulkStudents');
    if (!textarea?.value?.trim()) {
      Components.toast('يرجى إدخال الأسماء', 'error');
      return;
    }
    const names = textarea.value.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length === 0) {
      Components.toast('يرجى إدخال أسماء صحيحة', 'error');
      return;
    }
    DataStore.addStudentsBulk(courseId, names);
    textarea.value = '';
    Components.toast(`تمت إضافة ${names.length} طالب بنجاح`);
    const students = DataStore.getStudents(courseId);
    const counter = document.getElementById('studentCount');
    if (counter) counter.textContent = students.length;
  },

  // Edit Student Modal
  showEditStudentModal(studentId) {
    const student = DataStore.getStudent(studentId);
    if (!student) return;
    const content = `
      ${Components.formInput('editStudentName', 'اسم الطالب', 'text', '', student.name)}
      <button class="btn btn-primary btn-block" onclick="App.updateStudent('${studentId}')" style="margin-top:8px">
        ${getIcon('save', 18)} حفظ التعديلات
      </button>
    `;
    this.showModal('تعديل اسم الطالب', content);
  },

  updateStudent(studentId) {
    const name = document.getElementById('editStudentName')?.value;
    if (!name?.trim()) {
      Components.toast('يرجى إدخال الاسم', 'error');
      return;
    }
    DataStore.updateStudent(studentId, name);
    this.closeModal();
    Components.toast('تم تحديث اسم الطالب');
    this.render();
  },

  // Delete Student Confirmation
  confirmDeleteStudent(studentId) {
    const student = DataStore.getStudent(studentId);
    if (!student) return;
    this.showConfirm(
      'حذف الطالب',
      `هل أنت متأكد من حذف "${student.name}"؟ سيتم حذف جميع سجلات حضوره.`,
      'حذف',
      'danger',
      () => {
        DataStore.deleteStudent(studentId);
        Components.toast('تم حذف الطالب');
        this.render();
      }
    );
  },

  // Bulk Attendance Modal
  showBulkAttendanceModalForCourse(courseId) {
    this.currentParams = { id: courseId };
    this.showBulkAttendanceModal();
  },

  showBulkAttendanceModal() {
    const courseId = this.currentParams.id;
    const course = DataStore.getCourse(courseId);
    if (!course) return;

    const students = DataStore.getStudents(courseId);
    if (students.length === 0) {
      Components.toast('لا يوجد طلاب في هذه الدورة', 'error');
      return;
    }

    this.bulkStatuses = {};
    students.forEach(s => { this.bulkStatuses[s.id] = 'present'; });

    const content = `
      <div class="alert alert-info" style="margin-bottom:16px">
        ${getIcon('info', 18)}
        <span>اختر حالة الحضور لكل طالب ثم اضغط حفظ</span>
      </div>
      <div id="bulkAttendanceList">
        ${students.map(s => {
          const initial = s.name.charAt(0);
          return `
            <div class="card student-card" style="padding:10px 14px;">
              <div class="student-avatar" style="width:36px; height:36px; font-size:var(--font-size-sm);">${initial}</div>
              <div class="student-info">
                <div class="student-name" style="font-size:var(--font-size-sm);">${s.name}</div>
              </div>
              <div class="attendance-btns">
                <button class="attendance-btn present" id="bulk-${s.id}-present"
                        onclick="App.setBulkStatus('${s.id}', 'present')" style="width:36px; height:36px;">
                  ${getIcon('checkCircle', 16)}
                </button>
                <button class="attendance-btn" id="bulk-${s.id}-absent"
                        onclick="App.setBulkStatus('${s.id}', 'absent')" style="width:36px; height:36px;">
                  ${getIcon('xCircle', 16)}
                </button>
                <button class="attendance-btn" id="bulk-${s.id}-excused"
                        onclick="App.setBulkStatus('${s.id}', 'excused')" style="width:36px; height:36px;">
                  ${getIcon('clock', 16)}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-block" onclick="App.saveBulkAttendance('${courseId}')" style="margin-top:16px">
        ${getIcon('save', 18)} حفظ جميع التسجيلات
      </button>
    `;
    this.showModal('تسجيل حضور جماعي', content);
  },

  setBulkStatus(studentId, status) {
    this.bulkStatuses[studentId] = status;
    // Update button styles
    ['present', 'absent', 'excused'].forEach(s => {
      const btn = document.getElementById(`bulk-${studentId}-${s}`);
      if (btn) {
        btn.className = `attendance-btn ${s === status ? s : ''}`;
      }
    });
  },

  saveBulkAttendance(courseId) {
    const today = DataStore.getToday();
    DataStore.recordBulkAttendance(courseId, today, this.bulkStatuses);
    this.closeModal();
    Components.toast('تم حفظ التسجيلات الجماعية بنجاح');
    this.navigate('course', courseId);
  },

  // Clear All Confirmation
  confirmClearAll() {
    this.showConfirm(
      'مسح جميع البيانات',
      'هل أنت متأكد؟ سيتم حذف جميع الدورات والطلاب وسجلات الحضور نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
      'مسح الكل',
      'danger',
      () => {
        DataStore.clearAll();
        Components.toast('تم مسح جميع البيانات');
        this.navigate('home');
      }
    );
  },

  // ===== Export/Import =====
  exportData() {
    const data = DataStore.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-backup-${DataStore.getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Components.toast('تم تصدير البيانات بنجاح');
  },

  importDataPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          DataStore.importData(data);
          Components.toast('تم استيراد البيانات بنجاح');
          this.render();
        } catch {
          Components.toast('خطأ في قراءة الملف', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // ===== Modal Helpers =====
  showModal(title, content, id = 'modal') {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.innerHTML = Components.modal(title, content, id);
    document.body.appendChild(div.firstElementChild);
  },

  showConfirm(title, text, confirmText, confirmClass, onConfirm) {
    this.closeModal();
    const overlay = document.createElement('div');
    overlay.id = 'confirmOverlay';
    overlay.className = 'confirm-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };
    overlay.innerHTML = `
      <div class="confirm-dialog scale-in">
        <div class="confirm-icon ${confirmClass}">${getIcon('alertTriangle', 28)}</div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-text">${text}</div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
          <button class="btn btn-${confirmClass}" id="confirmBtn">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn')?.addEventListener('click', () => {
      this.closeModal();
      onConfirm();
    });
  },

  closeModal() {
    ['modal', 'confirmModal', 'confirmOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  goBack() {
    if (this.currentParams.courseId) {
      this.navigate('course', this.currentParams.courseId);
    } else {
      this.navigate('home');
    }
  },
};

// Fix the attendance rendering - need to use 'student' variable correctly
const _origRenderAttendance = App.renderAttendance;
App.renderAttendance = function() {
  const courseId = this.currentParams.id;
  const course = DataStore.getCourse(courseId);
  if (!course) return this.renderHome();

  const students = DataStore.getStudents(courseId);
  const today = DataStore.getToday();
  const todayFormatted = DataStore.formatDate(today);

  let studentsHtml;
  if (students.length === 0) {
    studentsHtml = Components.emptyState(
      'userPlus',
      'لا يوجد طلاب',
      'أضف طلاباً أولاً لتسجيل الحضور'
    );
  } else {
    studentsHtml = students.map(student => {
      const records = DataStore.getAttendance(courseId, today);
      const record = records.find(r => r.studentId === student.id);
      const currentStatus = record ? record.status : '';
      const initial = student.name.charAt(0);
      return `
        <div class="card student-card">
          <div class="student-avatar">${initial}</div>
          <div class="student-info">
            <div class="student-name">${student.name}</div>
          </div>
          <div class="attendance-btns">
            <button class="attendance-btn ${currentStatus === 'present' ? 'present' : ''}" 
                    onclick="App.markAttendance('${student.id}', 'present', '${courseId}', '${today}')">
              ${getIcon('checkCircle', 18)}
              <span class="tooltip">حضور</span>
            </button>
            <button class="attendance-btn ${currentStatus === 'absent' ? 'absent' : ''}" 
                    onclick="App.markAttendance('${student.id}', 'absent', '${courseId}', '${today}')">
              ${getIcon('xCircle', 18)}
              <span class="tooltip">غياب</span>
            </button>
            <button class="attendance-btn ${currentStatus === 'excused' ? 'excused' : ''}" 
                    onclick="App.markAttendance('${student.id}', 'excused', '${courseId}', '${today}')">
              ${getIcon('clock', 18)}
              <span class="tooltip">معذور</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const todayRecords = DataStore.getAttendance(courseId, today);
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const absentCount = todayRecords.filter(r => r.status === 'absent').length;
  const excusedCount = todayRecords.filter(r => r.status === 'excused').length;
  const totalStudents = students.length;
  const recordedCount = todayRecords.length;
  const pendingCount = totalStudents - recordedCount;

  return `
    ${Components.header(`تسجيل الحضور`, `${course.name} • ${todayFormatted}`, `
      <button class="icon-btn" onclick="App.navigate('course', '${courseId}')">
        ${getIcon('back', 18)}
      </button>
    `)}
    <div class="page">
      <div class="alert alert-info">
        ${getIcon('info', 18)}
        <span>اضغط على الزر المناسب لتسجيل حالة كل طالب</span>
      </div>

      ${totalStudents > 0 ? `
        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
          <div class="stat-card success" style="padding:10px">
            <div class="stat-value" style="font-size:var(--font-size-xl)">${presentCount}</div>
            <div class="stat-label">حضور</div>
          </div>
          <div class="stat-card danger" style="padding:10px">
            <div class="stat-value" style="font-size:var(--font-size-xl)">${absentCount}</div>
            <div class="stat-label">غياب</div>
          </div>
          <div class="stat-card warning" style="padding:10px">
            <div class="stat-value" style="font-size:var(--font-size-xl)">${excusedCount}</div>
            <div class="stat-label">معذور</div>
          </div>
          <div class="stat-card" style="padding:10px">
            <div class="stat-value" style="font-size:var(--font-size-xl); color:var(--text-muted)">${pendingCount}</div>
            <div class="stat-label">بانتظار</div>
          </div>
        </div>
      ` : ''}

      <div class="list" id="attendanceList">
        ${studentsHtml}
      </div>

      ${recordedCount > 0 ? `
        <div style="margin-top:16px; display:flex; gap:10px;">
          <button class="btn btn-success btn-block" onclick="App.saveAttendance('${courseId}', '${today}')">
            ${getIcon('save', 18)} حفظ التسجيلات
          </button>
        </div>
      ` : ''}
    </div>
  `;
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
