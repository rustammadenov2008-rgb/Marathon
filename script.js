/* ── DATA STORE ── */
const DB_KEY = 'marathon_runners_v1';

const defaultRunners = [
  { id: 1, name:'First',  surname:'User1', email:'first@email.com',  password:'pass1', role:'Координатор', country:'Russia',  gender:'Мужской', dob:'1980-01-01' },
  { id: 2, name:'Second', surname:'User2', email:'second@email.com', password:'pass2', role:'Координатор', country:'Russia',  gender:'Мужской', dob:'1985-05-10' },
  { id: 3, name:'Third',  surname:'User3', email:'third@email.com',  password:'pass3', role:'Координатор', country:'Russia',  gender:'Женский', dob:'1990-03-22' },
  { id: 4, name:'Fourth', surname:'User4', email:'fourth@email.com', password:'pass4', role:'Бегун',       country:'Germany', gender:'Мужской', dob:'1992-08-14' },
  { id: 5, name:'Fifth',  surname:'User5', email:'fifth@email.com',  password:'pass5', role:'Бегун',       country:'France',  gender:'Женский', dob:'1995-11-30' },
  { id: 6, name:'Sixth',  surname:'User6', email:'sixth@email.com',  password:'pass6', role:'Бегун',       country:'USA',     gender:'Мужской', dob:'1988-07-07' },
];

let runners = [];
let session = null;  // { runner }
let nextId = 10;

function loadData() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      runners = parsed.runners || defaultRunners;
      nextId  = parsed.nextId  || 10;
    } else {
      runners = JSON.parse(JSON.stringify(defaultRunners));
    }
  } catch { runners = JSON.parse(JSON.stringify(defaultRunners)); }
}

function saveData() {
  localStorage.setItem(DB_KEY, JSON.stringify({ runners, nextId }));
}

function resetData() {
  runners = JSON.parse(JSON.stringify(defaultRunners));
  nextId = 10;
  saveData();
}

/* ── COUNTDOWN ── */
function getMarathonDate() {
  const now = new Date();
  let d = new Date(now.getFullYear(), 5, 15, 9, 0, 0); // June 15
  if (now >= d) d = new Date(now.getFullYear() + 1, 5, 15, 9, 0, 0);
  return d;
}

function updateCountdown() {
  const diff = getMarathonDate() - new Date();
  if (diff <= 0) {
    document.getElementById('cd-days').textContent   = '00';
    document.getElementById('cd-hours').textContent  = '00';
    document.getElementById('cd-mins').textContent   = '00';
    document.getElementById('cd-secs').textContent   = '00';
    return;
  }
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);
  document.getElementById('cd-days').textContent  = String(days).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2,'0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2,'0');
}

/* ── NAVIGATION ── */
const pages = ['about','register','participants','bmi'];

function navigate(target) {
  pages.forEach(id => {
    document.getElementById('page-' + id)?.classList.toggle('active', id === target);
    document.querySelector(`[data-page="${id}"]`)?.classList.toggle('active', id === target);
  });
  window.scrollTo(0,0);
  if (target === 'participants') renderParticipants();
}

/* ── AUTH ── */
function updateNav() {
  const el = document.getElementById('nav-user-area');
  if (!el) return;
  if (session) {
    el.innerHTML = `
      <span>${session.name} ${session.surname}</span>
      <span class="badge ${session.role === 'Координатор' ? 'badge-coord' : 'badge-runner'}">${session.role}</span>
      <button class="btn btn-secondary btn-sm" onclick="logout()">Выйти</button>`;
  } else {
    el.innerHTML = `<button class="btn btn-primary btn-sm" onclick="openLogin()">Войти</button>`;
  }

  // Show/hide coordinator controls
  document.querySelectorAll('.coord-only').forEach(el => {
    el.style.display = (session?.role === 'Координатор') ? '' : 'none';
  });
}

function openLogin() { document.getElementById('modal-login').classList.add('open'); }
function closeLogin() { document.getElementById('modal-login').classList.remove('open'); }

function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const runner = runners.find(r => r.email === email && r.password === pass);
  if (!runner) {
    document.getElementById('login-error').textContent = 'Неверный email или пароль.';
    return;
  }
  session = runner;
  closeLogin();
  updateNav();
  renderParticipants();
  toast('success', `Добро пожаловать, ${runner.name}!`);
}

function logout() {
  session = null;
  updateNav();
  renderParticipants();
  toast('success', 'Вы вышли из системы.');
}

/* ── REGISTER ── */
function doRegister(e) {
  e.preventDefault();
  const get = id => document.getElementById(id)?.value?.trim();
  const name    = get('reg-name');
  const surname = get('reg-surname');
  const email   = get('reg-email');
  const pass    = get('reg-pass');
  const pass2   = get('reg-pass2');
  const country = get('reg-country');
  const gender  = get('reg-gender');
  const dob     = get('reg-dob');

  // Validation
  if (!name || !surname || !email || !pass || !country || !gender || !dob) {
    showFormError('reg-error', 'Заполните все обязательные поля.');
    return;
  }
  if (pass !== pass2) { showFormError('reg-error', 'Пароли не совпадают.'); return; }
  if (runners.find(r => r.email === email)) {
    showFormError('reg-error', 'Этот email уже зарегистрирован.'); return;
  }

  const newRunner = { id: nextId++, name, surname, email, password: pass, role: 'Бегун', country, gender, dob };
  runners.push(newRunner);
  saveData();

  document.getElementById('reg-error').textContent = '';
  document.getElementById('reg-success').style.display = 'flex';
  document.getElementById('form-register').reset();
  setTimeout(() => document.getElementById('reg-success').style.display = 'none', 3500);
  toast('success', `${name} зарегистрирован(а)!`);
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; setTimeout(()=> el.textContent='', 4000); }
}

/* ── PARTICIPANTS ── */
function renderParticipants() {
  const tbody = document.getElementById('participants-tbody');
  if (!tbody) return;

  const search  = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const roleF   = document.getElementById('filter-role')?.value || '';
  const genderF = document.getElementById('filter-gender')?.value || '';
  const countryF = document.getElementById('filter-country')?.value || '';

  const filtered = runners.filter(r => {
    const fullName = `${r.name} ${r.surname} ${r.email}`.toLowerCase();
    if (search && !fullName.includes(search)) return false;
    if (roleF   && r.role    !== roleF)   return false;
    if (genderF && r.gender  !== genderF) return false;
    if (countryF && r.country !== countryF) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:3rem">Участники не найдены</td></tr>`;
    return;
  }

  const isCoord = session?.role === 'Координатор';

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td style="font-weight:600">${escHtml(r.name)} ${escHtml(r.surname)}</td>
      <td class="text-muted">${escHtml(r.email)}</td>
      <td><span class="badge ${r.role === 'Координатор' ? 'badge-coord' : 'badge-runner'}">${escHtml(r.role)}</span></td>
      <td>${escHtml(r.country)}</td>
      <td><span class="badge ${r.gender === 'Мужской' ? 'badge-m' : 'badge-f'}">${escHtml(r.gender)}</span></td>
      <td class="text-muted text-sm">${formatDob(r.dob)}</td>
      <td>
        ${isCoord ? `
          <div class="action-group">
            <button class="btn btn-secondary btn-sm" onclick="openEdit(${r.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRunner(${r.id})">🗑️</button>
          </div>` : '—'}
      </td>
    </tr>
  `).join('');

  // Populate country filter
  const cf = document.getElementById('filter-country');
  if (cf && cf.options.length <= 1) {
    const countries = [...new Set(runners.map(r => r.country))].sort();
    countries.forEach(c => { const o = new Option(c,c); cf.appendChild(o); });
  }
}

function formatDob(dob) {
  if (!dob) return '—';
  const [y,m,d] = dob.split('-');
  return `${d}.${m}.${y}`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── EDIT MODAL ── */
function openEdit(id) {
  const r = runners.find(x => x.id === id);
  if (!r) return;
  document.getElementById('edit-id').value       = r.id;
  document.getElementById('edit-name').value     = r.name;
  document.getElementById('edit-surname').value  = r.surname;
  document.getElementById('edit-email').value    = r.email;
  document.getElementById('edit-country').value  = r.country;
  document.getElementById('edit-gender').value   = r.gender;
  document.getElementById('edit-dob').value      = r.dob;
  document.getElementById('edit-role').value     = r.role;
  document.getElementById('modal-edit').classList.add('open');
}

function closeEdit() { document.getElementById('modal-edit').classList.remove('open'); }

function doEdit(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('edit-id').value);
  const idx = runners.findIndex(x => x.id === id);
  if (idx === -1) return;
  runners[idx] = {
    ...runners[idx],
    name:    document.getElementById('edit-name').value.trim(),
    surname: document.getElementById('edit-surname').value.trim(),
    email:   document.getElementById('edit-email').value.trim(),
    country: document.getElementById('edit-country').value.trim(),
    gender:  document.getElementById('edit-gender').value,
    dob:     document.getElementById('edit-dob').value,
    role:    document.getElementById('edit-role').value,
  };
  if (session?.id === id) session = runners[idx];
  saveData();
  closeEdit();
  renderParticipants();
  updateNav();
  toast('success', 'Данные обновлены.');
}

function deleteRunner(id) {
  if (!confirm('Удалить этого участника?')) return;
  runners = runners.filter(r => r.id !== id);
  saveData();
  renderParticipants();
  toast('success', 'Участник удалён.');
}

/* ── BMI ── */
function calcBMI(e) {
  e.preventDefault();
  const w = parseFloat(document.getElementById('bmi-weight').value);
  const h = parseFloat(document.getElementById('bmi-height').value) / 100;
  if (!w || !h || h <= 0) return;
  const bmi = w / (h * h);
  const res = document.getElementById('bmi-result');
  document.getElementById('bmi-value').textContent = bmi.toFixed(1);

  let cat, color;
  if      (bmi < 18.5) { cat = 'Недостаточная масса тела'; color = '#7eb8ff'; }
  else if (bmi < 25)   { cat = 'Норма';                    color = '#3dffa0'; }
  else if (bmi < 30)   { cat = 'Избыточная масса тела';    color = '#e8ff47'; }
  else                 { cat = 'Ожирение';                 color = '#ff5555'; }

  document.getElementById('bmi-category').textContent = cat;
  document.getElementById('bmi-category').style.color = color;
  document.getElementById('bmi-value').style.color = color;

  const pct = Math.min(100, Math.max(0, (bmi - 10) / 30 * 100));
  document.getElementById('bmi-bar').style.width = pct + '%';
  res.style.display = 'block';
}

/* ── TOAST ── */
function toast(type, msg) {
  const icon = type === 'success' ? '✅' : '❌';
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${icon}</span><span>${escHtml(msg)}</span>`;
  document.getElementById('toast-container').appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateNav();
  navigate('about');
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Nav link click
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
  });

  // Login form
  document.getElementById('form-login')?.addEventListener('submit', doLogin);

  // Register form
  document.getElementById('form-register')?.addEventListener('submit', doRegister);

  // Edit form
  document.getElementById('form-edit')?.addEventListener('submit', doEdit);

  // BMI form
  document.getElementById('form-bmi')?.addEventListener('submit', calcBMI);

  // Filter inputs
  ['filter-search','filter-role','filter-gender','filter-country'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderParticipants);
    document.getElementById(id)?.addEventListener('change', renderParticipants);
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
  });
});
