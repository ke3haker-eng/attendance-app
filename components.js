// ===== UI Components Module =====
const Components = {

  // ===== Header =====
  header(title, subtitle = '', actions = '') {
    return `
      <header class="header">
        <div class="header-inner">
          <div>
            <div class="header-title">${title}</div>
            ${subtitle ? `<div class="header-subtitle">${subtitle}</div>` : ''}
          </div>
          <div class="header-actions">${actions}</div>
        </div>
      </header>
    `;
  },

  // ===== Empty State =====
  emptyState(icon, title, text, actionHtml = '') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon(icon, 40)}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-text">${text}</div>
        ${actionHtml}
      </div>
    `;
  },

  // ===== Course Card =====
  courseCard(course) {
    const students = DataStore.getStudents(course.id);
    const stats = DataStore.getCourseStats(course.id);
    return `
      <div class="card card-clickable course-card" onclick="App.navigate('course', '${course.id}')">
        <div class="course-icon">${getIcon('book', 24)}</div>
        <div class="course-info">
          <div class="course-name">${course.name}</div>
          <div class="course-teacher">${course.teacherName}</div>
          <div class="course-meta">
            <div class="course-meta-item">
              ${getIcon('user', 14)}
              <strong>${students.length}</strong> طالب
            </div>
            <div class="course-meta-item">
              ${getIcon('calendar', 14)}
              <strong>${stats.dates.length}</strong> يوم
            </div>
            ${stats.dates.length > 0 ? `
            <div class="course-meta-item">
              ${getIcon('trendingUp', 14)}
              <strong>${stats.rate}%</strong>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="course-arrow">${getIcon('chevronLeft', 20)}</div>
      </div>
    `;
  },

  // ===== Student Card =====
  studentCard(student, courseId, showActions = true) {
    const stats = DataStore.getStudentStats(student.id);
    const initial = student.name.charAt(0);
    return `
      <div class="card student-card">
        <div class="student-avatar">${initial}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-stats">
            ${stats.total > 0 ? `
              <span style="color:var(--success)">${getIcon('check', 12)} ${stats.present}</span>
              <span style="color:var(--danger)">${getIcon('xCircle', 12)} ${stats.absent}</span>
              <span style="color:var(--warning)">${getIcon('clock', 12)} ${stats.excused}</span>
              <span>•</span>
              <span>${stats.rate}%</span>
            ` : '<span>لم يُسجَّل حضور بعد</span>'}
          </div>
        </div>
        ${showActions ? `
        <div class="student-actions">
          <button class="icon-btn small" onclick="event.stopPropagation(); App.navigate('stats', '${student.id}')" title="الإحصائيات">
            ${getIcon('barChart', 16)}
          </button>
          <button class="icon-btn small" onclick="event.stopPropagation(); App.showEditStudentModal('${student.id}')" title="تعديل">
            ${getIcon('edit', 16)}
          </button>
          <button class="icon-btn small danger" onclick="event.stopPropagation(); App.confirmDeleteStudent('${student.id}')" title="حذف">
            ${getIcon('trash', 16)}
          </button>
        </div>
        ` : ''}
      </div>
    `;
  },

  // ===== Attendance Student Row =====
  attendanceStudentRow(student, courseId, date) {
    const records = DataStore.getAttendance(courseId, date);
    const record = records.find(r => r.studentId === student.id);
    const currentStatus = record ? record.status : '';
    const initial = student.name.charAt(0);

    return `
      <div class="card student-card" style="animation-delay: ${Math.random() * 0.1}s">
        <div class="student-avatar">${initial}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
        </div>
        <div class="attendance-btns">
          <button class="attendance-btn ${currentStatus === 'present' ? 'present' : ''}" 
                  onclick="App.markAttendance('${studentId}', 'present', '${courseId}', '${date}')"
                  title="حضور">
            ${getIcon('checkCircle', 18)}
            <span class="tooltip">حضور</span>
          </button>
          <button class="attendance-btn ${currentStatus === 'absent' ? 'absent' : ''}" 
                  onclick="App.markAttendance('${studentId}', 'absent', '${courseId}', '${date}')"
                  title="غياب">
            ${getIcon('xCircle', 18)}
            <span class="tooltip">غياب</span>
          </button>
          <button class="attendance-btn ${currentStatus === 'excused' ? 'excused' : ''}" 
                  onclick="App.markAttendance('${studentId}', 'excused', '${courseId}', '${date}')"
                  title="معذور">
            ${getIcon('clock', 18)}
            <span class="tooltip">معذور</span>
          </button>
        </div>
      </div>
    `;
  },

  // ===== Date Card =====
  dateCard(dateInfo, courseId = null) {
    const date = new Date(dateInfo.date);
    const day = date.getDate();
    const month = date.toLocaleDateString('ar-SA', { month: 'short' });
    const weekday = date.toLocaleDateString('ar-SA', { weekday: 'long' });
    const isToday = dateInfo.date === DataStore.getToday();
    const clickAction = courseId 
      ? `App.navigate('dayDetail', {id:'${courseId}', date:'${dateInfo.date}'})`
      : `App.navigate('dayDetail', '${dateInfo.date}')`;

    return `
      <div class="card card-clickable date-card" onclick="${clickAction}">
        <div class="date-badge">
          <div class="date-badge-day">${day}</div>
          <div class="date-badge-month">${month}</div>
        </div>
        <div class="date-info">
          <div class="date-title">
            ${weekday}
            ${isToday ? '<span class="today-badge">' + getIcon('zap', 10) + ' اليوم</span>' : ''}
          </div>
          <div class="date-stats">
            <div class="date-stat present"><span class="dot"></span> ${dateInfo.present} حضور</div>
            <div class="date-stat absent"><span class="dot"></span> ${dateInfo.absent} غياب</div>
            <div class="date-stat excused"><span class="dot"></span> ${dateInfo.excused} معذور</div>
          </div>
        </div>
        <div class="course-arrow">${getIcon('chevronLeft', 20)}</div>
      </div>
    `;
  },

  // ===== Stats Summary =====
  statsSummary(stats) {
    return `
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-value">${stats.present}</div>
          <div class="stat-label">أيام الحضور</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${stats.absent}</div>
          <div class="stat-label">أيام الغياب</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${stats.excused}</div>
          <div class="stat-label">أيام المعذور</div>
        </div>
        <div class="stat-card primary">
          <div class="stat-value">${stats.rate}%</div>
          <div class="stat-label">نسبة الحضور</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill success" style="width: ${stats.rate}%"></div>
      </div>
    `;
  },

  // ===== Progress Ring =====
  progressRing(rate) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (rate / 100) * circumference;
    return `
      <div class="rate-display">
        <div style="position:relative; width:130px; height:130px;">
          <svg width="130" height="130" viewBox="0 0 130 130" style="transform: rotate(-90deg)">
            <circle cx="65" cy="65" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
            <circle cx="65" cy="65" r="52" fill="none" stroke="var(--primary)" stroke-width="8"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
              stroke-linecap="round" style="transition: stroke-dashoffset 1s ease"/>
          </svg>
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="font-size:var(--font-size-3xl); font-weight:700; color:var(--primary);">${rate}%</div>
            <div style="font-size:var(--font-size-xs); color:var(--text-secondary);">نسبة الحضور</div>
          </div>
        </div>
      </div>
    `;
  },

  // ===== Form Input =====
  formInput(id, label, type = 'text', placeholder = '', value = '', required = true) {
    return `
      <div class="form-group">
        <label class="form-label" for="${id}">${label}</label>
        <input class="form-input" type="${type}" id="${id}" placeholder="${placeholder}" 
               value="${value}" ${required ? 'required' : ''}>
      </div>
    `;
  },

  // ===== Modal =====
  modal(title, content, id = 'modal') {
    return `
      <div class="modal-overlay" id="${id}" onclick="if(event.target===this) App.closeModal()">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button class="icon-btn small" onclick="App.closeModal()">${getIcon('close', 18)}</button>
          </div>
          <div class="modal-body">${content}</div>
        </div>
      </div>
    `;
  },

  // ===== Confirm Dialog =====
  confirmDialog(title, text, confirmText = 'تأكيد', confirmClass = 'danger') {
    return `
      <div class="confirm-overlay" onclick="if(event.target===this) App.closeModal()">
        <div class="confirm-dialog scale-in">
          <div class="confirm-icon ${confirmClass}">${getIcon('alertTriangle', 28)}</div>
          <div class="confirm-title">${title}</div>
          <div class="confirm-text">${text}</div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button>
            <button class="btn btn-${confirmClass}" id="confirmBtn">${confirmText}</button>
          </div>
        </div>
      </div>
    `;
  },

  // ===== Toast =====
  toast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || (() => {
      const div = document.createElement('div');
      div.id = 'toastContainer';
      div.className = 'toast-container';
      document.body.appendChild(div);
      return div;
    })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${getIcon(type === 'success' ? 'checkCircle' : type === 'error' ? 'xCircle' : 'info', 18)} ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // ===== Bottom Navigation =====
  bottomNav(active = 'home', mode = 'main', courseId = null) {
    if (mode === 'course' && courseId) {
      return `
        <nav class="bottom-nav">
          <button class="nav-item ${active === 'course' ? 'active' : ''}" onclick="App.navigate('course', '${courseId}')">
            ${getIcon('users', 22)}
            <span>الطلاب</span>
          </button>
          <button class="nav-item ${active === 'records' ? 'active' : ''}" onclick="App.navigate('courseRecords', '${courseId}')">
            ${getIcon('calendar', 22)}
            <span>السجلات</span>
          </button>
          <button class="nav-item ${active === 'stats' ? 'active' : ''}" onclick="App.navigate('globalStats')">
            ${getIcon('pieChart', 22)}
            <span>الإحصائيات</span>
          </button>
        </nav>
      `;
    }
    return `
      <nav class="bottom-nav">
        <button class="nav-item ${active === 'home' ? 'active' : ''}" onclick="App.navigate('home')">
          ${getIcon('home', 22)}
          <span>الرئيسية</span>
        </button>
        <button class="nav-item ${active === 'stats' ? 'active' : ''}" onclick="App.navigate('globalStats')">
          ${getIcon('pieChart', 22)}
          <span>الإحصائيات</span>
        </button>
        <button class="nav-item ${active === 'settings' ? 'active' : ''}" onclick="App.navigate('settings')">
          ${getIcon('settings', 22)}
          <span>الإعدادات</span>
        </button>
      </nav>
    `;
  },

  // ===== Search Bar =====
  searchBar(placeholder = 'بحث...', id = 'searchInput', oninput = '') {
    return `
      <div class="search-bar">
        ${getIcon('search', 18)}
        <input type="text" id="${id}" placeholder="${placeholder}" oninput="${oninput}">
      </div>
    `;
  },

  // ===== Tabs =====
  tabs(items, activeId, onclick) {
    return `
      <div class="tabs">
        ${items.map(item => `
          <button class="tab ${item.id === activeId ? 'active' : ''}" onclick="${onclick}('${item.id}')">
            ${item.icon ? getIcon(item.icon, 16) : ''}
            ${item.label}
          </button>
        `).join('')}
      </div>
    `;
  },

  // ===== Day Detail Row =====
  dayDetailRow(student, status) {
    const initial = student.name.charAt(0);
    const statusColors = {
      present: 'success',
      absent: 'danger',
      excused: 'warning',
    };
    const statusLabels = {
      present: 'حاضر',
      absent: 'غائب',
      excused: 'معذور',
    };
    const color = statusColors[status] || 'primary';

    return `
      <div class="card student-card">
        <div class="student-avatar">${initial}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
        </div>
        <span class="badge badge-${color}">${statusLabels[status] || '—'}</span>
      </div>
    `;
  },

  // ===== Settings Item =====
  settingsItem(icon, label, rightContent, iconBg = 'var(--primary-bg)', iconColor = 'var(--primary)') {
    return `
      <div class="settings-item">
        <div class="settings-item-left">
          <div class="settings-item-icon" style="background:${iconBg}; color:${iconColor}">
            ${getIcon(icon, 18)}
          </div>
          <div class="settings-item-text">${label}</div>
        </div>
        ${rightContent}
      </div>
    `;
  },

  // ===== Summary Item =====
  summaryItem(icon, label, value, color = 'var(--text)') {
    return `
      <div class="summary-row">
        <div class="summary-label">${getIcon(icon, 16)} ${label}</div>
        <div class="summary-value" style="color:${color}">${value}</div>
      </div>
    `;
  },

  // ===== Bulk Attendance Checkbox =====
  bulkAttendanceCheck(student, currentStatus) {
    const initial = student.name.charAt(0);
    return `
      <div class="card student-card">
        <div class="student-avatar">${initial}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
        </div>
        <div class="attendance-btns">
          <button class="attendance-btn ${currentStatus === 'present' ? 'present' : ''}" 
                  onclick="App.toggleBulkStatus('${student.id}', 'present')">
            ${getIcon('checkCircle', 18)}
          </button>
          <button class="attendance-btn ${currentStatus === 'absent' ? 'absent' : ''}" 
                  onclick="App.toggleBulkStatus('${student.id}', 'absent')">
            ${getIcon('xCircle', 18)}
          </button>
          <button class="attendance-btn ${currentStatus === 'excused' ? 'excused' : ''}" 
                  onclick="App.toggleBulkStatus('${student.id}', 'excused')">
            ${getIcon('clock', 18)}
          </button>
        </div>
      </div>
    `;
  },
};

window.Components = Components;
