// js/markdown.js
// 마크다운 → HTML 변환 + 제목 번호/목차 생성
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs';

// [TOC] 또는 [목차] 가 단독으로 있는 줄에 목차를 넣는다. 없으면 첫 제목 앞에 자동으로 넣는다.
const TOC_MARKERS = ['[TOC]', '[목차]'];

export function renderMarkdown(md) {
  const root = document.createElement('div');
  root.innerHTML = DOMPurify.sanitize(marked.parse(md || '', { gfm: true, breaks: true }));

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
    return { depth, num, id, text: h.textContent };
  });

  const toc = document.createElement('div');
  toc.className = 'wiki-toc';
  toc.id = 'toc';
  toc.innerHTML = '<div class="toc-title">목차</div>';
  for (const it of items) {
    const row = document.createElement('div');
    row.className = 'toc-item';
    row.style.paddingLeft = (it.depth - 1) * 20 + 'px';
    row.innerHTML = `<a data-scroll="${it.id}" role="button">${it.num}</a> `;
    row.append(it.text);
    toc.append(row);
  }

  if (marker) marker.replaceWith(toc);
  else root.querySelector('.wiki-heading').before(toc);
  return root.innerHTML;
}
