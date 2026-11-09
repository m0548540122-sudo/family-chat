// Owner screen: who may enter the family space. The database enforces this too.
import { h, replace, toast } from '../../core/dom.js';
import { isEmail } from '../../core/format.js';
import { openSheet } from '../ui/sheet.js';

export function openAdmin(backend) {
  const list = h('div', { class: 'people' });
  const email = h('input', { class: 'field ltr', type: 'email', id: 'new-email', placeholder: 'name@gmail.com', autocomplete: 'off' });
  const name = h('input', { class: 'field', id: 'new-name', maxLength: 40, placeholder: 'לדוגמה: נועה' });

  async function act(work, failure) {
    try { await work(); await load(); } catch (error) { console.error(error); toast(failure); }
  }

  function row(person) {
    return h('div', { class: `person ${person.blocked ? 'is-blocked' : ''}` },
      h('div', {}, h('strong', {}, person.display_name || person.email.split('@')[0]), h('small', {}, person.email)),
      person.is_owner ? h('span', { class: 'tag' }, 'מנהל')
        : [
          h('button', { class: 'small-btn', onclick: () => act(() => backend.setBlocked(person.email, !person.blocked), 'השינוי לא נשמר. נסו שוב.') }, person.blocked ? 'שחרור' : 'חסימה'),
          h('button', {
            class: 'small-btn danger',
            onclick: () => { if (confirm(`להסיר את ${person.email} מהמשפחה? ההודעות שלו יישארו.`)) act(() => backend.removeAllowed(person.email), 'ההסרה לא הצליחה. נסו שוב.'); },
          }, 'הסרה'),
        ]);
  }

  async function load() { replace(list, (await backend.listAllowed()).map(row)); }

  function add(event) {
    event.preventDefault();
    const value = email.value.trim().toLowerCase();
    if (!isEmail(value)) { toast('צריך כתובת Gmail תקינה.'); return; }
    act(async () => { await backend.addAllowed(value, name.value.trim()); email.value = ''; name.value = ''; }, 'לא הצלחתי להוסיף. אולי הכתובת כבר ברשימה?');
  }

  openSheet('ניהול המשפחה', [
    h('form', { class: 'add-form', onsubmit: add },
      h('div', { class: 'form-row' }, h('label', { htmlFor: 'new-email' }, 'כתובת Google של בן המשפחה'), email),
      h('div', { class: 'form-row' }, h('label', { htmlFor: 'new-name' }, 'שם (לא חובה)'), name),
      h('button', { class: 'btn btn-primary', type: 'submit' }, 'הוספה למשפחה')),
    list,
  ]);
  load().catch(() => toast('לא הצלחתי לטעון את הרשימה.'));
}
