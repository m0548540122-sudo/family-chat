// Screens shown before someone is inside the family space.
import { config } from '../../../config/app.js';
import { h } from '../../core/dom.js';
import { createHouse } from '../house/house.js';

function layout(...card) {
  const house = createHouse({ members: 6 });
  house.setLit(6);
  return h('main', { class: 'welcome' },
    h('div', { class: 'welcome-scene' }, house.element),
    h('section', { class: 'welcome-card' }, card));
}

const googleMark = () => {
  const img = h('img', { class: 'google-mark', alt: '' });
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.500c3.500 0 6.600 1.200 9.100 3.600l6.800-6.800C35.800 2.500 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.500 17.700 9.500 24 9.500z"/><path fill="#4285F4" d="M46.100 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.400c-.5 2.900-2.100 5.300-4.600 7l7.100 5.500c4.200-3.900 7.200-9.600 7.200-17z"/><path fill="#FBBC05" d="M10.500 28.700A14.500 14.500 0 0 1 9.700 24c0-1.600.3-3.200.8-4.700l-7.900-6.100A24 24 0 0 0 0 24c0 3.900.9 7.500 2.600 10.800z"/><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.100-5.500c-2 1.300-4.600 2.100-8.800 2.100-6.300 0-11.600-4-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/></svg>');
  return img;
};

export function loginScreen(backend) {
  const error = h('p', { class: 'welcome-error', role: 'alert', hidden: true });
  const button = h('button', {
    class: 'btn btn-primary',
    onclick: async () => {
      button.disabled = true;
      const result = await backend.signIn();
      if (result?.error) {
        button.disabled = false;
        error.hidden = false;
        error.textContent = 'הכניסה לא הצליחה. נסו שוב בעוד רגע.';
      }
    },
  }, googleMark(), 'כניסה עם חשבון Google');
  return layout(h('h1', {}, config.appName), h('p', {}, 'המקום של המשפחה שלנו. נכנסים, ומרגישים בבית.'), button, error);
}

export function deniedScreen(backend, email) {
  return layout(
    h('h1', {}, 'עוד רגע בפנים'),
    h('p', {}, 'החשבון ', h('span', { class: 'who' }, email || ''), ' עדיין לא ברשימת המשפחה. בקשו ממנהל הבית להוסיף אותו, ואז היכנסו שוב.'),
    h('button', { class: 'btn btn-quiet', onclick: () => backend.signOut().then(() => location.reload()) }, 'כניסה עם חשבון אחר'),
  );
}

export function notReadyScreen() {
  return layout(h('h1', {}, config.appName), h('p', {}, 'הבית בהקמה. עוד מעט נפתח את הדלת.'));
}
