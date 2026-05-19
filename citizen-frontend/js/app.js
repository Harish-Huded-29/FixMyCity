// ============================================
// FixMyCity — Citizen Frontend Core JS v2
// ============================================

// ---- CONFIG ----
// Change this to your Render backend URL when deployed
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://YOUR_RENDER_BACKEND_URL.onrender.com/api';

// ---- AUTH ----
const Auth = {
  getToken: () => localStorage.getItem('fmc_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('fmc_user')); } catch { return null; } },
  set: (token, user) => { localStorage.setItem('fmc_token', token); localStorage.setItem('fmc_user', JSON.stringify(user)); },
  clear: () => { localStorage.removeItem('fmc_token'); localStorage.removeItem('fmc_user'); },
  isLoggedIn: () => !!localStorage.getItem('fmc_token'),
  isMunicipal: () => { const u = Auth.getUser(); return u && (u.role === 'municipal' || u.role === 'admin'); },
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
  const icons = { ok: 'ti-circle-check', err: 'ti-alert-circle', info: 'ti-info-circle' };
  let container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="ti ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---- TIME ----
function ago(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

// ---- CATEGORIES ----
const CATS = {
  pothole:              { label:'Pothole',               icon:'ti-road' },
  road_damage:          { label:'Road Damage',           icon:'ti-road-off' },
  garbage:              { label:'Garbage',               icon:'ti-trash' },
  drainage:             { label:'Drainage',              icon:'ti-droplet' },
  streetlight:          { label:'Street Light',          icon:'ti-bulb' },
  water_supply:         { label:'Water Supply',          icon:'ti-droplets' },
  electricity:          { label:'Electricity',           icon:'ti-bolt' },
  tree_fallen:          { label:'Tree Fallen',           icon:'ti-trees' },
  illegal_construction: { label:'Illegal Construction',  icon:'ti-building' },
  noise_pollution:      { label:'Noise Pollution',       icon:'ti-volume-3' },
  other:                { label:'Other',                 icon:'ti-dots-circle-horizontal' },
};

// ---- STATUS BADGE ----
function statusBadge(s) {
  const m = { open:'🔵 Open', in_progress:'🟡 In Progress', resolved:'✅ Resolved', reopened:'🔴 Reopened', closed:'⚫ Closed' };
  return `<span class="badge badge-${s}">${m[s]||s}</span>`;
}

// ---- AVATAR ----
function initials(name='') { return (name.split(' ').slice(0,2).map(w=>w[0]).join('')||'?').toUpperCase(); }
function avatarHtml(user, size=38) {
  const style = `width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:var(--bg5);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.floor(size*0.35)}px;color:var(--accent);flex-shrink:0`;
  if (user?.profilePhoto?.url) return `<div style="${style}"><img src="${user.profilePhoto.url}" style="width:100%;height:100%;object-fit:cover" alt="${user?.name||''}"></div>`;
  return `<div style="${style}">${initials(user?.name)}</div>`;
}

// ---- MEDIA GRID ----
function mediaGrid(media=[], clickable=false) {
  if (!media.length) return '';
  const n = Math.min(media.length, 4);
  const extra = media.length > 4 ? media.length - 4 : 0;
  const cls = ['','g1','g2','g3','g4','g4'][n] || 'g4';
  const items = media.slice(0, n).map((m, i) => {
    const isLast = extra>0 && i===n-1;
    const inner = m.resourceType==='video'
      ? `<iframe src="${m.url}" frameborder="0" allowfullscreen style="width:100%;height:100%;border:none;display:block" loading="lazy"></iframe>`
      : `<img src="${m.url}" alt="Issue photo" loading="lazy">`;
    const click = clickable && m.resourceType!=='video' ? `onclick="openLightbox('${m.url}')" style="cursor:zoom-in"` : '';
    return `<div class="mi" ${click}>${inner}${isLast?`<div class="mi-more">+${extra+1}</div>`:''}</div>`;
  });
  return `<div class="media-grid ${cls}">${items.join('')}</div>`;
}

// ---- ISSUE CARD ----
function issueCard(issue) {
  const author = issue.isAnonymous ? {name:'Anonymous',profilePhoto:{url:''}} : issue.postedBy;
  return `
  <article class="issue-card ${issue.status}" data-id="${issue._id}" onclick="goIssue('${issue._id}')">
    <div class="ic-head">
      ${avatarHtml(author)}
      <div class="ic-meta">
        <div class="ic-author-row">
          <span class="ic-author">${author?.name||'Anonymous'}</span>
          ${issue.isAnonymous?'<span class="badge" style="background:var(--bg5);color:var(--t3);font-size:.6rem">Anon</span>':''}
          <span class="cat-badge"><i class="ti ${CATS[issue.category]?.icon||'ti-map-pin'}"></i>${CATS[issue.category]?.label||issue.category}</span>
          ${statusBadge(issue.status)}
        </div>
        <div class="ic-loc"><i class="ti ti-map-pin"></i>${issue.location.city}, ${issue.location.district}</div>
      </div>
      <span class="ic-time">${ago(issue.createdAt)}</span>
    </div>
    <div class="ic-body">
      <div class="ic-title">${issue.title}</div>
      <div class="ic-desc">${issue.description}</div>
      ${mediaGrid(issue.media||[])}
    </div>
    <div class="ic-foot">
      <div class="ic-action ${issue._uv?'upvoted':''}" onclick="doUpvote(event,'${issue._id}',this)">
        <i class="ti ti-arrow-up"></i><span>${issue.upvoteCount||0}</span>
      </div>
      <div class="ic-action"><i class="ti ti-message-circle"></i><span>${issue.commentCount||0}</span></div>
      <div class="ic-action" style="margin-left:auto" onclick="shareIssue(event,'${issue._id}')"><i class="ti ti-share-2"></i></div>
    </div>
    ${issue.resolution?.resolvedAt?`
    <div class="resolved-bar"><i class="ti ti-circle-check"></i>
      Resolved on ${fmtDate(issue.resolution.resolvedAt)}
      ${issue.resolution.description?`· ${issue.resolution.description.slice(0,60)}...`:''}
    </div>`:''}
  </article>`;
}

// ---- NAVIGATION ----
function goIssue(id) { window.location.href = `/pages/issue-detail.html?id=${id}`; }
function goPage(p) {
  const pages = { feed:'/', post:'/pages/post-issue.html', profile:'/pages/profile.html', login:'/pages/login.html', register:'/pages/register.html' };
  if (pages[p]) window.location.href = pages[p];
}
function requireAuth() {
  if (!Auth.isLoggedIn()) { toast('Please login to continue','err'); setTimeout(()=>goPage('login'),700); return false; }
  return true;
}

// ---- UPVOTE ----
async function doUpvote(e, id, btn) {
  e.stopPropagation();
  if (!requireAuth()) return;
  try {
    const r = await api.post(`/issues/${id}/upvote`);
    btn.querySelector('span').textContent = r.upvoteCount;
    btn.classList.toggle('upvoted', r.hasUpvoted);
  } catch(err){ toast(err.message,'err'); }
}

// ---- SHARE ----
function shareIssue(e, id) {
  e.stopPropagation();
  const url = `${window.location.origin}/pages/issue-detail.html?id=${id}`;
  if (navigator.share) navigator.share({ title:'FixMyCity Issue', url });
  else navigator.clipboard.writeText(url).then(()=>toast('Link copied!','ok'));
}

// ---- LOCATION ----
const Loc = {
  data: null,
  async load() {
    if (this.data) return this.data;
    const r = await api.get('/location/all');
    this.data = r.data; return this.data;
  },
  async autoDetect() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(async ({coords}) => {
        try {
          const {latitude:lat,longitude:lng} = coords;
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`, {headers:{'User-Agent':'FixMyCity/1.0'}});
          const d = await r.json();
          const a = d.address||{};
          res({ lat, lng, state:a.state||'', district:a.county||a.state_district||'', city:a.city||a.town||a.village||'', pincode:a.postcode||'', address:d.display_name||'' });
        } catch(e){ rej(e); }
      }, rej, {timeout:8000});
    });
  },
  async cascade(sEl, dEl, cEl) {
    const data = await this.load();
    const states = Object.keys(data);
    sEl.innerHTML = '<option value="">Select State *</option>' + states.map(s=>`<option value="${s}">${s}</option>`).join('');
    const upd = () => {
      const s = sEl.value;
      dEl.innerHTML = '<option value="">Select District *</option>';
      cEl.innerHTML = '<option value="">Select City *</option>';
      if (!s||!data[s]) return;
      dEl.innerHTML = '<option value="">Select District *</option>' + Object.keys(data[s]).map(d=>`<option value="${d}">${d}</option>`).join('');
    };
    const updC = () => {
      const s=sEl.value, d=dEl.value;
      cEl.innerHTML = '<option value="">Select City *</option>';
      if (!s||!d||!data[s]?.[d]) return;
      cEl.innerHTML = '<option value="">Select City *</option>' + data[s][d].map(c=>`<option value="${c}">${c}</option>`).join('');
    };
    sEl.addEventListener('change', upd);
    dEl.addEventListener('change', updC);
  },
  setVals(sEl, dEl, cEl, {state,district,city}) {
    if (state) { sEl.value=state; sEl.dispatchEvent(new Event('change')); }
    setTimeout(()=>{ if(district){ dEl.value=district; dEl.dispatchEvent(new Event('change')); }},120);
    setTimeout(()=>{ if(city) cEl.value=city; },250);
  }
};

// ---- SIDEBAR TOGGLE (mobile) ----
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const ham = document.querySelector('.hamburger');
  if (!sidebar) return;
  const open = () => { sidebar.classList.add('open'); if(overlay){overlay.classList.add('show');} };
  const close = () => { sidebar.classList.remove('open'); if(overlay){overlay.classList.remove('show');} };
  if (ham) ham.addEventListener('click', open);
  if (overlay) overlay.addEventListener('click', close);
}

// ---- SIDEBAR USER ----
function renderSidebarUser() {
  const el = document.getElementById('sidebar-user');
  if (!el) return;
  const user = Auth.getUser();
  if (!user) { el.innerHTML = `<div class="s-avatar">?</div><div class="s-info"><div class="s-name">Guest</div></div>`; return; }
  el.innerHTML = `
    ${user.profilePhoto?.url ? `<img src="${user.profilePhoto.url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0" alt="">` : `<div class="s-avatar">${initials(user.name)}</div>`}
    <div class="s-info"><div class="s-name">${user.name}</div><div class="s-role">${user.role==='municipal'?'🏛️ Municipal':'🏘️ Citizen'}</div></div>
  `;
  el.onclick = () => goPage('profile');
}

// ---- LOGOUT ----
async function logout() {
  Auth.clear();
  if (window.fbAuth) { try { await window.fbAuth.signOut(); } catch{} }
  toast('Logged out','ok');
  setTimeout(() => goPage('login'), 500);
}

// ---- LIGHTBOX ----
function openLightbox(url) {
  let lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:popIn .2s ease';
    lb.innerHTML = `<button onclick="this.parentElement.remove()" style="position:absolute;top:16px;right:16px;color:#fff;font-size:26px;background:none;border:none;cursor:pointer"><i class="ti ti-x"></i></button><img id="lb-img" src="${url}" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:10px">`;
    lb.onclick = e => { if(e.target===lb) lb.remove(); };
    document.body.appendChild(lb);
  } else {
    document.getElementById('lb-img').src = url;
  }
}

// ---- MODAL ----
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function initModals() {
  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if(e.target===o) o.classList.remove('open'); });
  });
}

// ---- ACTIVE NAV ----
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav]').forEach(el => {
    if (path.includes(el.dataset.nav) || (el.dataset.nav==='/' && (path==='/'||path==='/index.html'))) {
      el.classList.add('active');
    }
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  renderSidebarUser();
  setActiveNav();
  initModals();
  document.querySelectorAll('[data-action="logout"]').forEach(b => b.addEventListener('click', logout));
  // Show municipal dashboard link if applicable
  const mLink = document.getElementById('municipal-nav');
  if (mLink && Auth.isMunicipal()) mLink.style.display = 'flex';
});