// js/app.js
// 라우트: #/w/제목 (보기), #/edit/제목 (편집), #/login (로그인)
import { auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getDocument, saveDocument } from './db.js';
import { renderMarkdown } from './markdown.js';
import { uploadImage, isSupabaseConfigured } from './supabase.js';
import { INFOBOX_TEMPLATE } from './templates.js';

const SITE_NAME = '샘플위키';
const FRONT_PAGE = '대문';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = encodeURIComponent;

const app = $('#app');
let currentUser = null;
let resolveAuthReady;
const authReady = new Promise((r) => (resolveAuthReady = r));
let editDirty = false;
let currentHash = location.hash;

function fmtDate(v) {
  const d = v?.toDate ? v.toDate() : null;
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  $('#toast-area').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 2800);
}

function errorMessage(e) {
  const map = {
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
    'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    'auth/operation-not-allowed': 'Firebase 콘솔에서 이메일/비밀번호 로그인을 켜야 합니다.',
    'permission-denied': '권한이 없습니다. (Firestore 보안 규칙을 확인하세요)',
    unavailable: 'Firestore에 연결할 수 없습니다.',
  };
  return map[e.code] || e.message;
}

/* ---------------- 라우터 ---------------- */

function parseHash() {
  const raw = location.hash.slice(1);
  const q = raw.indexOf('?');
  const path = q === -1 ? raw : raw.slice(0, q);
  const params = new URLSearchParams(q === -1 ? '' : raw.slice(q + 1));
  const m = path.match(/^\/(w|edit|login)(?:\/(.*))?$/);
  let title = FRONT_PAGE;
  try { if (m?.[2]) title = decodeURIComponent(m[2]); } catch { /* 잘못된 인코딩은 대문으로 */ }
  return { view: m ? m[1] : 'w', title, params };
}

async function route() {
  if (editDirty && location.hash !== currentHash) {
    if (!confirm('저장하지 않은 내용이 있습니다. 페이지를 떠날까요?')) {
      history.replaceState(null, '', currentHash);
      return;
    }
  }
  editDirty = false;
  currentHash = location.hash;
  const r = parseHash();
  try {
    if (r.view === 'edit') await viewEdit(r.title);
    else if (r.view === 'login') await viewLogin(r.params);
    else await viewDocument(r.title);
  } catch (e) {
    console.error(e);
    renderPage({ title: '오류', body: `<div class="alert">${esc(errorMessage(e))}</div>` });
  }
  window.scrollTo(0, 0);
}

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function renderPage({ title, sub = '', meta = '', editLink = '', body }) {
  document.title = `${title} - ${SITE_NAME}`;
  app.innerHTML = `
    <div class="article-head">
      <div class="title-area">
        <h1 class="doc-title">${esc(title)}${sub ? ` <small>${sub}</small>` : ''}</h1>
        ${meta ? `<div class="doc-meta">${meta}</div>` : ''}
      </div>
      ${editLink ? `<a class="tool-btn" href="${editLink}"><i class="fa-solid fa-pen-to-square"></i><span>편집</span></a>` : ''}
    </div>
    ${body}`;
}

/* ---------------- 문서 보기 ---------------- */

async function viewDocument(title) {
  const data = await getDocument(title);
  if (!data) {
    renderPage({
      title, editLink: '#/edit/' + enc(title),
      body: `<p>해당 문서가 없습니다. <a href="#/edit/${enc(title)}">[새 문서 만들기]</a></p>`,
    });
    return;
  }
  renderPage({
    title,
    meta: `최근 수정 시각: ${fmtDate(data.updatedAt)}`,
    editLink: '#/edit/' + enc(title),
    body: `<div class="wiki-content">${renderMarkdown(data.content)}</div>`,
  });
}

// 목차 번호 ↔ 제목 이동, 제목 클릭 시 문단 접기/펼치기
app.addEventListener('click', (e) => {
  const heading = e.target.closest('.wiki-heading');
  if (heading && !e.target.closest('a')) {
    const folded = heading.classList.toggle('wiki-heading-folded');
    heading.nextElementSibling?.classList.toggle('wiki-section-folded', folded);
    return;
  }
  const link = e.target.closest('[data-scroll]');
  if (!link) return;
  e.preventDefault();
  const target = document.getElementById(link.dataset.scroll);
  if (!target) return;
  // 접힌 문단 안으로 이동하면 펼친다
  for (let s = target.closest('.wiki-section-folded'); s; s = s.parentElement.closest('.wiki-section-folded')) {
    s.classList.remove('wiki-section-folded');
    s.previousElementSibling?.classList.remove('wiki-heading-folded');
  }
  target.scrollIntoView({ block: 'start' });
});

/* ---------------- 편집 ---------------- */

async function viewEdit(title) {
  await authReady;
  if (!currentUser) {
    toast('문서를 편집하려면 로그인해야 합니다.');
    history.replaceState(null, '', '#/login?redirect=' + enc('#/edit/' + enc(title)));
    currentHash = location.hash;
    return viewLogin(parseHash().params);
  }
  const data = await getDocument(title);
  renderPage({
    title, sub: data ? '(편집)' : '(새 문서)',
    body: `
      <form id="edit-form">
        <div class="edit-tabs">
          <button type="button" class="edit-tab active" data-tab="write">작성</button>
          <button type="button" class="edit-tab" data-tab="preview">미리보기</button>
        </div>
        <div class="edit-pane" data-pane="write">
          <div class="edit-toolbar">
            <button type="button" data-wrap="**|**" title="굵게"><i class="fa-solid fa-bold"></i></button>
            <button type="button" data-wrap="*|*" title="기울임"><i class="fa-solid fa-italic"></i></button>
            <button type="button" data-wrap="\n## |\n" title="제목"><i class="fa-solid fa-heading"></i></button>
            <button type="button" data-wrap="[|](https://)" title="링크"><i class="fa-solid fa-link"></i></button>
            <button type="button" data-wrap="\n[목차]\n|" title="목차 위치"><i class="fa-solid fa-list-ol"></i></button>
            <button type="button" id="img-btn" title="이미지 업로드"><i class="fa-solid fa-image"></i></button>
            <button type="button" id="infobox-btn" title="인물 정보 틀 넣기"><i class="fa-solid fa-id-card"></i></button>
            <input type="file" id="img-file" accept="image/png,image/jpeg,image/gif,image/webp" hidden />
          </div>
          <textarea id="edit-text" spellcheck="false" placeholder="마크다운으로 작성하세요.&#10;# 제목, ## 소제목 을 쓰면 목차가 자동으로 만들어집니다.&#10;이미지는 위 버튼, 붙여넣기, 끌어다 놓기로 올릴 수 있습니다.">${esc(data?.content ?? '')}</textarea>
        </div>
        <div class="edit-pane wiki-content" data-pane="preview" hidden></div>
        <div class="form-actions">
          <a class="btn" href="#/w/${enc(title)}">취소</a>
          <button type="submit" class="btn btn-primary" id="save-btn">저장</button>
        </div>
      </form>`,
  });

  const form = $('#edit-form');
  const ta = $('#edit-text');
  ta.addEventListener('input', () => (editDirty = true));

  form.addEventListener('click', (e) => {
    const tab = e.target.closest('.edit-tab');
    if (tab) {
      form.querySelectorAll('.edit-tab').forEach((t) => t.classList.toggle('active', t === tab));
      form.querySelectorAll('.edit-pane').forEach((p) => (p.hidden = p.dataset.pane !== tab.dataset.tab));
      if (tab.dataset.tab === 'preview') $('[data-pane="preview"]', form).innerHTML = renderMarkdown(ta.value);
      return;
    }
    const wrap = e.target.closest('[data-wrap]');
    if (wrap) {
      const [a, b] = wrap.dataset.wrap.replace(/\\n/g, '\n').split('|');
      insertAround(ta, a, b);
    }
  });

  // 이미지: 버튼 / 붙여넣기 / 끌어다 놓기
  $('#img-btn').addEventListener('click', () => $('#img-file').click());
  // 틀은 HTML 블록이라 앞뒤로 빈 줄이 있어야 마크다운과 섞이지 않는다
  $('#infobox-btn').addEventListener('click', () => insertAround(ta, '\n\n' + INFOBOX_TEMPLATE + '\n', ''));
  $('#img-file').addEventListener('change', (e) => {
    uploadInto(ta, e.target.files[0]);
    e.target.value = '';
  });
  ta.addEventListener('paste', (e) => {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); uploadInto(ta, file); }
  });
  ta.addEventListener('dragover', (e) => e.preventDefault());
  ta.addEventListener('drop', (e) => {
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); uploadInto(ta, file); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#save-btn');
    btn.disabled = true;
    try {
      await saveDocument(title, ta.value, currentUser);
      editDirty = false;
      toast('저장했습니다.', 'success');
      go('#/w/' + enc(title));
    } catch (err) {
      toast(errorMessage(err), 'error');
      btn.disabled = false;
    }
  });
}

function insertAround(ta, before, after) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e);
  ta.setRangeText(before + sel + after, s, e, 'end');
  if (!sel) ta.setSelectionRange(s + before.length, s + before.length);
  ta.focus();
  editDirty = true;
}

async function uploadInto(ta, file) {
  if (!file) return;
  if (!isSupabaseConfigured) return toast('Supabase 설정이 필요합니다. (js/supabase.js)', 'error');
  const placeholder = `![업로드 중... ${file.name}]()`;
  insertAround(ta, placeholder, '');
  try {
    const { url } = await uploadImage(file);
    const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '');
    ta.value = ta.value.replace(placeholder, `![${alt}](${url})`);
    toast('이미지를 올렸습니다.', 'success');
  } catch (err) {
    ta.value = ta.value.replace(placeholder, '');
    toast(err.message, 'error');
  }
}

/* ---------------- 로그인 ---------------- */

async function viewLogin(params) {
  await authReady;
  const redirect = params.get('redirect');
  const next = redirect && redirect.startsWith('#/') ? redirect : '#/w/' + enc(FRONT_PAGE);
  if (currentUser) return go(next);

  renderPage({
    title: '로그인',
    body: `
      <form class="auth-form" id="login-form">
        <label for="login-email">이메일</label>
        <input type="email" id="login-email" autocomplete="username" required />
        <label for="login-pw">비밀번호</label>
        <input type="password" id="login-pw" autocomplete="current-password" required />
        <p class="form-error" id="login-error" hidden></p>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">로그인</button>
        </div>
      </form>`,
  });

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, $('#login-email').value.trim(), $('#login-pw').value);
      toast('로그인했습니다.', 'success');
      go(next);
    } catch (err) {
      const box = $('#login-error');
      box.textContent = errorMessage(err);
      box.hidden = false;
      btn.disabled = false;
    }
  });
}

/* ---------------- 상단 바 ---------------- */

function renderUserArea() {
  const area = $('#user-area');
  if (currentUser) {
    area.innerHTML = `
      <span class="user-name"><i class="fa-solid fa-user"></i>${esc(currentUser.displayName || currentUser.email.split('@')[0])}</span>
      <button type="button" class="nav-link" id="logout-btn">로그아웃</button>`;
    $('#logout-btn').addEventListener('click', async () => {
      await signOut(auth);
      toast('로그아웃했습니다.');
      if (location.hash.startsWith('#/edit')) go('#/w/' + enc(parseHash().title));
    });
  } else {
    const back = location.hash.startsWith('#/login') ? '' : '?redirect=' + enc(location.hash || '#/w/' + enc(FRONT_PAGE));
    area.innerHTML = `<a class="nav-link" href="#/login${back}"><i class="fa-solid fa-right-to-bracket"></i><span>로그인</span></a>`;
  }
}

$('#search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#search-input').value.trim();
  if (!q) return;
  $('#search-input').value = '';
  go('#/w/' + enc(q));
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderUserArea();
  resolveAuthReady();
});
window.addEventListener('hashchange', () => { route(); if (!currentUser) renderUserArea(); });
window.addEventListener('beforeunload', (e) => { if (editDirty) e.preventDefault(); });
route();
