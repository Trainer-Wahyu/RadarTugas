/* =========================================
   1. INISIALISASI & PENYIMPANAN LOKAL
   ========================================= */
const STORAGE_KEY = 'tugasradar_tasks_v1';
const THEME_KEY = 'tugasradar_theme_v1';

// Mengambil data tugas dari localStorage (jika kosong, mulai dengan array kosong)
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Menangkap elemen-elemen HTML berdasarkan ID
const taskForm = document.getElementById('task-form');
const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');
const activeCounterEl = document.getElementById('active-counter');
const filterSubjectEl = document.getElementById('filter-subject');
const themeToggleBtn = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileEl = document.getElementById('import-file');

/* =========================================
   2. PENGATURAN MODE GELAP (DARK MODE)
   ========================================= */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
  }
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  
  // Ubah ikon tombol & simpan pilihan tema ke memori lokal
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
});

/* =========================================
   3. FUNGSI PENGOLAHAN WAKTU & KEDARURATAN
   ========================================= */
function getUrgencyStatus(deadlineString, isCompleted) {
  if (isCompleted) {
    return { className: '', label: 'Selesai' };
  }

  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffMs = deadline - now; // Selisih waktu dalam milidetik
  const diffHours = diffMs / (1000 * 60 * 60);

  // Jika waktu sudah terlewat
  if (diffMs <= 0) {
    return { className: 'urgent-danger', label: 'Terlewat!' };
  }

  // Hitung sisa hari dan jam
  const days = Math.floor(diffHours / 24);
  const hours = Math.floor(diffHours % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  let timeText = '';
  if (days > 0) {
    timeText = `Sisa ${days} hari ${hours} jam`;
  } else if (hours > 0) {
    timeText = `Sisa ${hours} jam ${minutes} menit`;
  } else {
    timeText = `Sisa ${minutes} menit lagi!`;
  }

  // Tentukan kelas warna berdasarkan sisa jam
  if (diffHours < 24) {
    return { className: 'urgent-danger', label: timeText };
  } else if (diffHours <= 72) {
    return { className: 'urgent-warn', label: timeText };
  } else {
    return { className: 'urgent-safe', label: timeText };
  }
}

function formatReadableDate(deadlineString) {
  const date = new Date(deadlineString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Mencegah karakter HTML berbahaya dari input teks pengguna
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================
   4. SIMPAN, URUTKAN, & TAMPILKAN TUGAS
   ========================================= */
function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  updateFilterDropdown();
  renderTasks();
}

// Memperbarui pilihan mata pelajaran di menu filter sesuai tugas yang ada
function updateFilterDropdown() {
  const currentFilter = filterSubjectEl.value;
  const uniqueSubjects = [...new Set(tasks.map(task => task.subject))].sort();

  filterSubjectEl.innerHTML = '<option value="ALL">Semua Mata Pelajaran</option>';
  uniqueSubjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    filterSubjectEl.appendChild(option);
  });

  // Pertahankan pilihan filter sebelumnya jika mapelnya masih ada
  if (uniqueSubjects.includes(currentFilter)) {
    filterSubjectEl.value = currentFilter;
  }
}

function renderTasks() {
  const selectedSubject = filterSubjectEl.value;

  // Hitung tugas yang masih aktif (belum selesai)
  const activeCount = tasks.filter(t => !t.completed).length;
  activeCounterEl.textContent = `${activeCount} Tugas Aktif`;

  // 1. Saring berdasarkan mata pelajaran
  let filteredTasks = tasks.filter(task => {
    if (selectedSubject === 'ALL') return true;
    return task.subject === selectedSubject;
  });

  // 2. Urutkan: Tugas aktif di atas (tenggat terdekat lebih dulu), tugas selesai di bawah
  filteredTasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // Bersihkan wadah daftar tugas sebelum menggambar ulang
  taskListEl.innerHTML = '';

  // Tampilkan pesan kosong jika tidak ada tugas
  if (filteredTasks.length === 0) {
    emptyStateEl.style.display = 'block';
    return;
  }
  emptyStateEl.style.display = 'none';

  // Buat elemen kartu untuk setiap tugas
  filteredTasks.forEach(task => {
    const urgency = getUrgencyStatus(task.deadline, task.completed);
    const card = document.createElement('article');
    card.className = `task-card ${urgency.className} ${task.completed ? 'completed' : ''}`;

    // Siapkan blok catatan khusus hanya jika diisi oleh pengguna
    const notesHTML = task.notes && task.notes.trim() !== ''
      ? `<div class="task-notes">📝 ${escapeHTML(task.notes)}</div>`
      : '';

    card.innerHTML = `
      <div class="task-meta">
        <span>${escapeHTML(task.subject)} • ${escapeHTML(task.teacher)}</span>
      </div>
      <h3 class="task-title">${escapeHTML(task.title)}</h3>
      <div class="task-deadline-info">
        <span>📅 ${formatReadableDate(task.deadline)}</span>
        <span class="countdown-pill">${urgency.label}</span>
      </div>
      ${notesHTML}
      <div class="task-actions">
        <button type="button" class="btn-action btn-done" data-id="${task.id}">
          ${task.completed ? '↩️ Batal Selesai' : '✅ Tandai Selesai'}
        </button>
        <button type="button" class="btn-action btn-delete" data-id="${task.id}">
          🗑️ Hapus
        </button>
      </div>
    `;

    taskListEl.appendChild(card);
  });
}

/* =========================================
   5. INTERAKSI PENGGUNA (TAMBAH, SELESAI, HAPUS)
   ========================================= */
taskForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Mencegah halaman memuat ulang saat form dikirim

  const title = document.getElementById('task-title').value.trim();
  const subject = document.getElementById('task-subject').value;
  const teacher = document.getElementById('task-teacher').value.trim();
  const deadline = document.getElementById('task-deadline').value;
  const notes = document.getElementById('task-notes').value.trim();

  if (!title || !subject || !teacher || !deadline) return;

  const newTask = {
    id: Date.now().toString(), // ID unik berdasarkan stempel waktu saat ini
    title,
    subject,
    teacher,
    deadline,
    notes,
    completed: false
  };

  tasks.push(newTask);
  taskForm.reset();
  saveAndRender();
});

// Menangani klik tombol Selesai atau Hapus pada kartu tugas
taskListEl.addEventListener('click', (e) => {
  const target = e.target;
  const taskId = target.getAttribute('data-id');
  if (!taskId) return;

  if (target.classList.contains('btn-done')) {
    tasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveAndRender();
  }

  if (target.classList.contains('btn-delete')) {
    const confirmDelete = confirm('Yakin ingin menghapus tugas ini?');
    if (confirmDelete) {
      tasks = tasks.filter(task => task.id !== taskId);
      saveAndRender();
    }
  }
});

// Menangani perubahan pilihan filter mata pelajaran
filterSubjectEl.addEventListener('change', renderTasks);

/* =========================================
   6. CADANGKAN & PULIHKAN DATA (JSON)
   ========================================= */
exportBtn.addEventListener('click', () => {
  if (tasks.length === 0) {
    alert('Belum ada data tugas untuk dicadangkan.');
    return;
  }

  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cadangan-tugasradar-${today}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
  importFileEl.click(); // Memicu jendela pilih file di HP
});

importFileEl.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedTasks = JSON.parse(event.target.result);
      if (Array.isArray(importedTasks)) {
        tasks = importedTasks;
        saveAndRender();
        alert('Data tugas berhasil dipulihkan!');
      } else {
        alert('Format file cadangan tidak valid.');
      }
    } catch (err) {
      alert('Gagal membaca file. Pastikan file berformat .json dari TugasRadar.');
    }
    importFileEl.value = ''; // Reset input file
  };
  reader.readAsText(file);
});

/* =========================================
   7. PENDAFTARAN SERVICE WORKER (OFFLINE PWA)
   ========================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker terdaftar: Siap digunakan offline.'))
      .catch(err => console.error('Gagal mendaftarkan Service Worker:', err));
  });
}

// Jalankan aplikasi saat pertama kali dibuka & perbarui hitung mundur tiap 1 menit
initTheme();
saveAndRender();
setInterval(renderTasks, 60000);
