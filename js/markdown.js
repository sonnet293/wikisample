// js/markdown.js
// 마크다운 → HTML 변환 + 제목 번호/목차 생성
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs';

// [TOC] 또는 [목차] 가 단독으로 있는 줄에 목차를 넣는다. 없으면 첫 제목 앞에 자동으로 넣는다.
const TOC_MARKERS = ['[TOC]', '[목차]'];
// 각주 (나무위키 문법): [* 내용] → [1], [*이름 내용] → [이름], 앞에서 쓴 [*이름] 은 같은 각주를 다시 가리킨다.
// [각주] 가 단독으로 있는 줄에 각주 목록을 넣는다. 없으면 문서 끝에 넣는다.
const FOOTNOTE_MARKERS = ['[각주]', '[footnote]'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let notes; // renderMarkdown 한 번 동안 모은 각주

marked.use({
  extensions: [{
    name: 'footnote',
    level: 'inline',
    start(src) {
      const i = src.indexOf('[*');
      return i < 0 ? undefined : i;
    },
    tokenizer(src) {
      if (!src.startsWith('[*')) return;
      // 내용 안의 [링크](주소) 처럼 대괄호가 겹쳐도 짝이 맞는 ] 까지를 각주로 본다
      let depth = 0;
      let end = -1;
      for (let i = 0; i < src.length && end < 0; i++) {
        if (src[i] === '\\') i++;
        else if (src[i] === '[') depth++;
        else if (src[i] === ']' && --depth === 0) end = i;
      }
      if (end < 0 || src[end + 1] === '(') return; // 닫히지 않았거나 [*기울임*](주소) 링크
      const [, name, text] = src.slice(2, end).match(/^(\S*)\s*([\s\S]*)$/);
      if (!text && !notes.names.has(name)) return; // 내용도 없고 앞에 정의된 이름도 아니면 그냥 글자
      if (name) notes.names.add(name);
      return { type: 'footnote', raw: src.slice(0, end + 1), name, tokens: this.lexer.inlineTokens(text) };
    },
    renderer(token) {
      // 제목은 marked 가 글자만 뽑으려고 한 번 더 렌더링하므로, 같은 토큰은 처음 결과를 그대로 돌려준다
      if (token.html) return token.html;
      let note = token.name && notes.byName.get(token.name);
      if (!note) {
        const label = token.name || String(++notes.count);
        note = { label, id: 'fn-' + label, html: this.parser.parseInline(token.tokens), refs: 0 };
        notes.list.push(note);
        if (token.name) notes.byName.set(token.name, note);
      }
      const refId = 'r' + note.id + (note.refs++ ? '-' + note.refs : '');
      return (token.html = `<a class="wiki-fn" id="${esc(refId)}" data-scroll="${esc(note.id)}" role="button">[${esc(note.label)}]</a>`);
    },
  }],
});

// 원본 구조: 위쪽 회색 선 아래에 "[1] 내용" 한 줄씩. [1] 을 누르면 본문의 각주 위치로 돌아간다.
function footnoteList() {
  const box = document.createElement('div');
  box.className = 'wiki-footnotes';
  box.innerHTML = DOMPurify.sanitize(notes.list.map((n) =>
    `<span class="wiki-fn-item"><a id="${esc(n.id)}" data-scroll="r${esc(n.id)}" role="button">[${esc(n.label)}]</a> ${n.html}</span>`).join(''));
  return box;
}

export function renderMarkdown(md) {
  notes = { count: 0, list: [], byName: new Map(), names: new Set() };
  const root = document.createElement('div');
  root.innerHTML = DOMPurify.sanitize(marked.parse(md || '', { gfm: true, breaks: true }));
  const fnMarker = [...root.querySelectorAll('p')].find((p) => FOOTNOTE_MARKERS.includes(p.textContent.trim()));
  if (fnMarker) notes.list.length ? fnMarker.replaceWith(footnoteList()) : fnMarker.remove();

  // 외부 링크는 새 탭으로
  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  root.querySelectorAll('img').forEach((img) => (img.loading = 'lazy'));

  const marker = [...root.querySelectorAll('p')].find((p) => TOC_MARKERS.includes(p.textContent.trim()));
  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  if (!headings.length) {
    marker?.remove();
    if (!fnMarker && notes.list.length) root.append(footnoteList());
    return root.innerHTML;
  }

  // 가장 큰 제목 단계를 1단계로 보고 1. / 1.1. / 1.1.1. 번호를 붙인다
  const minLevel = Math.min(...headings.map((h) => +h.tagName[1]));
  const counters = [0, 0, 0, 0, 0, 0, 0];
  const items = headings.map((h) => {
    const depth = +h.tagName[1] - minLevel + 1;
    counters[depth]++;
    counters.fill(0, depth + 1);
    const num = counters.slice(1, depth + 1).join('.') + '.';
    const id = 's-' + num.slice(0, -1);

    const el = document.createElement('h' + Math.min(6, depth + 1));
    el.className = 'wiki-heading';
    el.id = id;
    el.innerHTML = `<a class="wiki-heading-num" data-scroll="toc" role="button">${num}</a> <span>${h.innerHTML}</span>`;
    h.replaceWith(el);
    h.querySelectorAll('.wiki-fn').forEach((a) => a.remove()); // 목차에는 [1] 을 빼고 넣는다
    return { depth, num, id, text: h.textContent };
  });

  // 원본 구조: <details open><summary/> 안에 단계마다 .toc-indent 를 중첩, 항목은 "<a>1</a>. 개요"
  const toc = document.createElement('div');
  toc.className = 'wiki-toc';
  toc.id = 'toc';
  toc.innerHTML = '<details class="toc-details" open><summary></summary></details>';
  const stack = [toc.firstChild];
  for (const it of items) {
    while (stack.length > it.depth + 1) stack.pop();
    while (stack.length <= it.depth) {
      const indent = document.createElement('div');
      indent.className = 'toc-indent';
      stack[stack.length - 1].append(indent);
      stack.push(indent);
    }
    const row = document.createElement('span');
    row.className = 'toc-item';
    row.innerHTML = `<a data-scroll="${it.id}" role="button">${it.num.slice(0, -1)}</a>. `;
    row.append(it.text);
    stack[stack.length - 1].append(row);
  }

  if (marker) marker.replaceWith(toc);
  else root.querySelector('.wiki-heading').before(toc);

  // 제목마다 다음 같은/상위 단계 제목 전까지의 내용을 .wiki-section 으로 감싼다 (접기용).
  // 뒤에서부터 처리하면 하위 문단이 먼저 감싸져서 상위 문단 안에 그대로 들어간다.
  const els = [...root.querySelectorAll(':scope > .wiki-heading')];
  for (let i = els.length - 1; i >= 0; i--) {
    const h = els[i];
    const section = document.createElement('div');
    section.className = 'wiki-section';
    while (h.nextSibling && !(h.nextSibling.classList?.contains('wiki-heading') && depthOf(h.nextSibling) <= depthOf(h))) {
      section.append(h.nextSibling);
    }
    h.after(section);
  }
  // 문서 끝 각주 목록은 마지막 문단에 섞여 접히지 않도록 문단 묶기가 끝난 뒤에 붙인다
  if (!fnMarker && notes.list.length) root.append(footnoteList());
  return root.innerHTML;
}

const depthOf = (h) => +h.tagName[1];
