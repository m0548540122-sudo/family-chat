import { h, icon } from '../../core/dom.js';

export function openSheet(title, body) {
  const dialog = h('dialog', { class: 'sheet', onclose: () => dialog.remove() },
    h('div', { class: 'sheet-head' }, h('h2', {}, title),
      h('button', { class: 'icon-btn', 'aria-label': 'סגירה', onclick: () => dialog.close() }, icon('close'))),
    h('div', { class: 'sheet-body' }, body));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
