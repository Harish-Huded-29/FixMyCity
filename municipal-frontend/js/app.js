// ============================================
// FixMyCity — Municipal Frontend Core JS
// ============================================

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://YOUR_RENDER_BACKEND_URL.onrender.com/api';

// ---- AUTH ----
const Auth = {
  getToken: () => localStorage.getItem('fmc_m_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('fmc_m_user')); } catch { return null; } },
  set: (token, user) => { localStorage.setItem('fmc_m_token', token); localStorage.setItem('fmc_m_user', JSON.stringify(user)); },
  clear: () => { localStorage.removeItem('fmc_m_token'); localStorage.removeItem('fmc_m_user'); },
  isLoggedIn: () => !!localStorage.getItem('fmc_m_token'),
  isMunicipal: () => {
    const u = Auth.getUser();
    return u && (u.role === 'municipal' || u.role === 'admin');
  },
};

// ---- API ----
const api = {
  async req(method, path, body, isForm) {
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';
    const opts = { method, headers };
    if (body) opts.body = isForm ? body : JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (res.status === 401) { Auth.clear(); window.location.href = '/pages/login.html'; return; }
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  },
  get:    (p)    => api.req('GET', p),
  post:   (p, b) => api.req('POST', p, b),
  put:    (p, b) => api.req('PUT', p, b),
  del:    (p)    => api.req('DELETE', p),
  upload: (p, f) => api.req('POST', p, f, true),
  uploadPut: (p, f) => api.req('PUT', p, f, true),
};

// ---- TOAST ----
function toast(msg, type = 'info') {
  const icons = { ok:'ti-circle-check', err:'ti-alert-circle', info:'ti-info-circle' };
  let c = document.getElementById('toasts');
  if (!c) { c = document.createElement('div'); c.id='toasts'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="ti ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---- TIME ----
function ago(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

// ---- CATEGORIES ----
const CATS = {
  pothole:              { label:'Pothole',              icon:'ti-road' },
  road_damage:          { label:'Road Damage',          icon:'ti-road-off' },
  garbage:              { label:'Garbage',              icon:'ti-trash' },
  drainage:             { label:'Drainage',             icon:'ti-droplet' },
  streetlight:          { label:'Street Light',         icon:'ti-bulb' },
  water_supply:         { label:'Water Supply',         icon:'ti-droplets' },
  electricity:          { label:'Electricity',          icon:'ti-bolt' },
  tree_fallen:          { label:'Tree Fallen',          icon:'ti-trees' },
  illegal_construction: { label:'Illegal Construction', icon:'ti-building' },
  noise_pollution:      { label:'Noise Pollution',      icon:'ti-volume-3' },
  other:                { label:'Other',                icon:'ti-dots-circle-horizontal' },
};

function statusBadge(s) {
  const m = {open:'🔵 Open',in_progress:'🟡 In Progress',resolved:'✅ Resolved',reopened:'🔴 Reopened',closed:'⚫ Closed'};
  return `<span class="badge b-${s}">${m[s]||s}</span>`;
}

function initials(name='') { return (name.split(' ').slice(0,2).map(w=>w[0]).join('')||'?').toUpperCase(); }

function avatarHtml(user, size=36) {
  const s=`width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:var(--bg5);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.floor(size*.35)}px;color:var(--a);flex-shrink:0`;
  if (user?.profilePhoto?.url) return `<div style="${s}"><img src="${user.profilePhoto.url}" style="width:100%;height:100%;object-fit:cover" alt=""></div>`;
  return `<div style="${s}">${initials(user?.name)}</div>`;
}

// ---- LOCATION ----
const Loc = {
  data: null,
  async load() {
    if (this.data) return this.data;
    const r = await api.get('/location/all');
    this.data = r.data; return this.data;
  },
  async cascade(sEl, dEl, cEl) {
    const data = await this.load();
    sEl.innerHTML = '<option value="">Select State *</option>' + Object.keys(data).map(s=>`<option value="${s}">${s}</option>`).join('');
    sEl.addEventListener('change', () => {
      const s = sEl.value;
      dEl.innerHTML = '<option value="">Select District *</option>';
      cEl.innerHTML = '<option value="">Select City *</option>';
      if (!s||!data[s]) return;
      dEl.innerHTML = '<option value="">Select District *</option>' + Object.keys(data[s]).map(d=>`<option value="${d}">${d}</option>`).join('');
    });
    dEl.addEventListener('change', () => {
      const s=sEl.value, d=dEl.value;
      cEl.innerHTML = '<option value="">Select City *</option>';
      if (!s||!d||!data[s]?.[d]) return;
      cEl.innerHTML = '<option value="">Select City *</option>' + data[s][d].map(c=>`<option value="${c}">${c}</option>`).join('');
    });
  },
};

// ---- SIDEBAR MOBILE ----
function initSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sb-overlay');
  const ham = document.getElementById('ham-btn');
  if (!sb) return;
  const open = () => { sb.classList.add('on'); if(ov) ov.classList.add('on'); };
  const close = () => { sb.classList.remove('on'); if(ov) ov.classList.remove('on'); };
  if (ham) ham.addEventListener('click', open);
  if (ov) ov.addEventListener('click', close);
}

// ---- SIDEBAR USER ----
function renderSidebarUser() {
  const el = document.getElementById('sidebar-user');
  if (!el) return;
  const u = Auth.getUser();
  if (!u) return;
  const area = u.municipalArea;
  el.innerHTML = `
    ${u.profilePhoto?.url
      ? `<img src="${u.profilePhoto.url}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0" alt="">`
      : `<div class="sb-av">${initials(u.name)}</div>`}
    <div style="flex:1;min-width:0">
      <div class="sb-uname">${u.name}</div>
      <div class="sb-urole">🏛️ ${area?.city||area?.district||'Municipal Worker'}</div>
    </div>`;
  el.onclick = () => window.location.href = '/pages/profile.html';
}

// ---- LOGOUT ----
async function logout() {
  Auth.clear();
  toast('Logged out','ok');
  setTimeout(() => window.location.href = '/pages/login.html', 400);
}

// ---- REQUIRE AUTH ----
function requireAuth() {
  if (!Auth.isLoggedIn() || !Auth.isMunicipal()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

// ---- MODAL ----
function openModal(id) { document.getElementById(id)?.classList.add('on'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('on'); }

// ---- SAFE BACK ----
function safeBack() {
  if (document.referrer && document.referrer.includes(window.location.hostname)) history.back();
  else window.location.href = '/';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  renderSidebarUser();
  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if(e.target===o) o.classList.remove('on'); });
  });
  document.querySelectorAll('[data-action="logout"]').forEach(b => b.addEventListener('click', logout));
});
