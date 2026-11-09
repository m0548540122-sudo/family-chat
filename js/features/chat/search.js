// Search within the open conversation.
import { h, replace, toast } from '../../core/dom.js';
import { dayLabel, time } from '../../core/format.js';
import { openSheet } from '../ui/sheet.js';

export function openSearch({ backend, conversationId, nameOf }) {
  const results = h('div', { class: 'people', 'aria-live': 'polite' });
  const input = h('input', { class: 'field', id: 'search-text', type: 'search', placeholder: 'מה לחפש?', autocomplete: 'off' });

  async function run(event) {
    event.preventDefault();
    const text = input.value.trim();
    if (text.length < 2) { toast('כתבו לפחות שתי אותיות.'); return; }
    try {
      const rows = await backend.searchMessages(conversationId, text);
      replace(results, rows.length ? rows.map((m) => h('div', { class: 'person' }, h('div', {},
        h('strong', {}, nameOf(m.sender_id)),
        h('p', { class: 'search-body' }, m.body),
        h('small', { class: 'search-when' }, `${dayLabel(m.created_at)}, ${time(m.created_at)}`))))
        : h('p', { class: 'search-empty' }, 'לא נמצאו הודעות.'));
    } catch (error) { console.error(error); toast('החיפוש לא הצליח. נסו שוב.'); }
  }

  openSheet('חיפוש בשיחה', [
    h('form', { class: 'add-form', onsubmit: run },
      h('div', { class: 'form-row' }, h('label', { htmlFor: 'search-text' }, 'מילה או משפט'), input),
      h('button', { class: 'btn btn-primary', type: 'submit' }, 'חיפוש')),
    results,
  ]);
  input.focus();
}
