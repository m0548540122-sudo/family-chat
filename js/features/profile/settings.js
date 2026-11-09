// Personal settings: display name, appearance, sign out.
import { h, toast } from '../../core/dom.js';
import { avatar } from '../ui/avatar.js';
import { openSheet } from '../ui/sheet.js';
import { theme } from '../ui/theme.js';

const THEMES = [['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']];

export function openSettings({ backend, me, onNameChange }) {
  const name = h('input', { class: 'field', id: 'my-name', value: me.name, maxLength: 40 });
  const buttons = THEMES.map(([value, label]) => h('button', {
    'aria-pressed': String(theme.get() === value),
    onclick: (event) => {
      theme.set(value);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === event.currentTarget)));
    },
  }, label));

  async function save(event) {
    event.preventDefault();
    const value = name.value.trim();
    if (!value) return;
    try { await backend.updateName(me.id, value); onNameChange(value); toast('נשמר'); }
    catch (error) { console.error(error); toast('השם לא נשמר. נסו שוב.'); }
  }

  openSheet('הגדרות', [
    h('div', { class: 'person' }, avatar(me), h('div', {}, h('strong', {}, me.name), h('small', {}, me.email))),
    h('form', { class: 'form-row', onsubmit: save },
      h('label', { htmlFor: 'my-name' }, 'השם שלי במשפחה'), name,
      h('button', { class: 'btn btn-quiet', type: 'submit' }, 'שמירה')),
    h('div', { class: 'form-row' }, h('span', { class: 'label' }, 'מראה'), h('div', { class: 'segment' }, buttons)),
    h('button', { class: 'btn btn-quiet', onclick: () => backend.signOut().then(() => location.reload()) }, 'יציאה מהחשבון'),
  ]);
}
