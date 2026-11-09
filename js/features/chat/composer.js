// Where a message is written. Hands finished text and file to onSend.
import { config } from '../../../config/app.js';
import { h, icon, replace, toast } from '../../core/dom.js';

export function createComposer({ onSend }) {
  let file = null;
  const preview = h('div');
  const send = h('button', { class: 'icon-btn send-btn', 'aria-label': 'שליחה', disabled: true, onclick: submit }, icon('send'));
  const input = h('textarea', {
    rows: 1, placeholder: 'כתבו משהו למשפחה…', maxLength: config.maxMessageLength, 'aria-label': 'הודעה',
    oninput: refresh,
    onkeydown: (event) => {
      const desktop = matchMedia('(hover: hover)').matches;
      if (event.key === 'Enter' && !event.shiftKey && desktop && !event.isComposing) { event.preventDefault(); submit(); }
    },
  });
  const picker = h('input', {
    type: 'file', hidden: true,
    onchange: () => {
      const chosen = picker.files[0];
      picker.value = '';
      if (!chosen) return;
      if (chosen.size > config.maxFileMb * 1024 * 1024) { toast(`הקובץ גדול מדי. אפשר עד ${config.maxFileMb} מ״ב.`); return; }
      file = chosen;
      refresh();
    },
  });

  function refresh() {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
    send.disabled = !input.value.trim() && !file;
    replace(preview, file && h('div', { class: 'attach-preview' }, icon('file'), h('span', {}, file.name),
      h('button', { class: 'icon-btn', 'aria-label': 'הסרת הקובץ', onclick: () => { file = null; refresh(); } }, icon('close'))));
    preview.querySelectorAll('.attach-preview > svg').forEach((svg) => { svg.style.cssText = 'width:20px;height:20px;flex:none'; });
  }

  function submit() {
    const body = input.value.trim();
    if (!body && !file) return;
    onSend({ body, file });
    input.value = ''; file = null;
    refresh();
    input.focus();
  }

  return {
    element: h('div', { class: 'composer-wrap' }, preview, h('div', { class: 'composer' },
      h('button', { class: 'icon-btn', 'aria-label': 'צירוף תמונה או קובץ', onclick: () => picker.click() }, icon('clip')),
      input, send, picker)),
    focus: () => input.focus(),
  };
}
