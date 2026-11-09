// Where a message is written: text, emoji, voice typing and a file.
import { config } from '../../../config/app.js';
import { h, icon, replace, toast } from '../../core/dom.js';
import { createDictation, dictationSupported } from './dictation.js';
import { createEmojiPicker } from './emoji-picker.js';

export function createComposer({ onSend, onTyping }) {
  let file = null;
  const preview = h('div');
  const interim = h('div', { class: 'dictation-live', hidden: true, 'aria-live': 'polite' });
  const send = h('button', { class: 'icon-btn send-btn', 'aria-label': 'שליחה', disabled: true, onclick: submit }, icon('send'));
  const input = h('textarea', {
    rows: 1, placeholder: 'כתבו הודעה…', maxLength: config.maxMessageLength, 'aria-label': 'הודעה',
    oninput: () => { refresh(); onTyping(); },
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

  function insertText(text, addSpace = false) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const before = input.value.slice(0, start);
    const glue = addSpace && before && !/\s$/.test(before) ? ' ' : '';
    input.value = before + glue + text + input.value.slice(end);
    const caret = before.length + glue.length + text.length;
    input.setSelectionRange(caret, caret);
    refresh();
  }

  const emoji = createEmojiPicker({ onPick: (value) => { insertText(value); input.focus(); } });

  const mic = dictationSupported && h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'תמלול דיבור', 'aria-pressed': 'false', onclick: () => dictation.toggle() }, icon('mic'));
  const dictation = dictationSupported && createDictation({
    onFinal: (text) => { if (text) insertText(text, true); },
    onInterim: (text) => { interim.hidden = !text; interim.textContent = text; },
    onState: (active) => { mic.setAttribute('aria-pressed', String(active)); mic.classList.toggle('listening', active); },
    onError: toast,
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
    if (dictation) dictation.stop();
    emoji.close();
    onSend({ body, file });
    input.value = ''; file = null;
    refresh();
    input.focus();
  }

  return {
    element: h('div', { class: 'composer-wrap' }, preview, emoji.element, interim, h('div', { class: 'composer' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'אימוג\'י', onclick: () => emoji.toggle() }, icon('smile')),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'צירוף תמונה או קובץ', onclick: () => picker.click() }, icon('clip')),
      input, mic, send, picker)),
    focus: () => input.focus(),
  };
}
