// The opening moment: a blue door in a stone wall. Stays closed while the app loads,
// then swings inward and the visitor walks through into the warm light.
import { h } from '../../core/dom.js';

const SWING_MS = 900;
const ENTER_MS = 650;
const MIN_VISIBLE_MS = 500;
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

export function createDoor() {
  const shownAt = Date.now();
  const caption = h('p', { class: 'door-caption', role: 'status' }, 'פותחים את הדלת…');
  const hearts = h('div', { class: 'door-hearts', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4, 5].map((i) => h('span', { style: `--i:${i}` }, '♥')));
  const scene = h('div', { class: 'door-scene' },
    h('div', { class: 'door-way', 'aria-hidden': 'true' },
      h('div', { class: 'door-light' }),
      hearts,
      h('div', { class: 'door-leaf' },
        h('div', { class: 'door-panel top' }, h('span', { class: 'door-heart' }, '♥')),
        h('div', { class: 'door-panel bottom' }),
        h('div', { class: 'door-knob' })),
      h('div', { class: 'door-mezuzah' })),
    h('div', { class: 'door-step', 'aria-hidden': 'true' }),
    h('div', { class: 'door-mat', 'aria-hidden': 'true' }, 'ברוכים הבאים'),
    caption);
  const element = h('div', { class: 'door-overlay' }, scene);
  document.body.append(element);

  return {
    async open() {
      await wait(Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.remove(); return; }
      caption.textContent = 'ברוכים הבאים הביתה';
      element.classList.add('opening');
      await wait(SWING_MS);
      element.classList.add('entering');
      await wait(ENTER_MS);
      element.remove();
    },
    remove() { element.remove(); },
  };
}
