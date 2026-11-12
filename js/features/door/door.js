// The opening moment: a real 3D doorway. The door stays closed while the app loads,
// then swings inward and the camera walks slowly through it. A tap skips it.
import { h } from '../../core/dom.js';
import { skyFor } from '../house/house.js';
import { createMotes } from './motes.js';
import { createParallax } from './parallax.js';

const MIN_VISIBLE_MS = 900;
const KNOB_MS = 450;
const SWING_BEFORE_WALK_MS = 1700;
const WALK_MS = 2400;
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

function archHole(wall, way) {
  const box = way.getBoundingClientRect();
  const W = innerWidth, H = innerHeight, inset = 6;
  const x = box.left + inset, right = box.right - inset, bottom = box.bottom, r = (right - x) / 2, top = box.top + inset;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path fill-rule="evenodd" d="M0 0H${W}V${H}H0Z M${x} ${bottom}V${top + r}A${r} ${r} 0 0 1 ${right} ${top + r}V${bottom}Z"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  wall.style.maskImage = url;
  wall.style.webkitMaskImage = url;
}

function room() {
  const frames = ['a', 'b', 'c'].map((n) => h('i', { class: `room-photo ${n}` }, '♥'));
  return h('div', { class: 'door-room' },
    h('div', { class: 'room-plane back' }, h('div', { class: 'room-lamp' }), frames),
    h('div', { class: 'room-plane side left' }),
    h('div', { class: 'room-plane side right' }),
    h('div', { class: 'room-plane floor' }),
    h('div', { class: 'room-plane ceiling' }));
}

export function createDoor() {
  const shownAt = Date.now();
  const caption = h('p', { class: 'door-caption', role: 'status' }, 'פותחים את הדלת…');
  const canvas = h('canvas', { class: 'door-motes', width: 340, height: 520, 'aria-hidden': 'true' });
  const wall = h('div', { class: 'door-wall' }, h('div', { class: 'door-tint' }));
  const way = h('div', { class: 'door-way' },
    h('div', { class: 'door-leaf' },
      h('div', { class: 'door-panel top' }, h('span', { class: 'door-heart' }, '♥')),
      h('div', { class: 'door-panel bottom' }),
      h('div', { class: 'door-knob' })),
    h('div', { class: 'door-mezuzah' }));
  const tilt = h('div', { class: 'door-tilt' }, wall,
    h('div', { class: 'door-stage' }, room(), way, canvas,
      h('div', { class: 'door-shaft' }), h('div', { class: 'door-step' }), h('div', { class: 'door-mat' }, 'ברוכים הבאים')));
  const element = h('div', { class: 'door-overlay', 'data-sky': skyFor(new Date().getHours()), 'aria-hidden': 'false' },
    h('div', { class: 'door-camera' }, tilt), caption);
  document.body.append(element);

  const fitHole = () => archHole(wall, way);
  fitHole();
  addEventListener('resize', fitHole);
  const motes = createMotes(canvas);
  const stopParallax = createParallax(tilt);
  let skipped = false;

  function cleanup() {
    motes.stop(); stopParallax();
    removeEventListener('resize', fitHole);
    element.remove();
  }

  const pause = (ms) => (skipped ? Promise.resolve() : wait(ms));

  return {
    async open() {
      await wait(Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cleanup(); return; }
      element.addEventListener('click', () => { skipped = true; cleanup(); }, { once: true });
      element.classList.add('knob');
      await pause(KNOB_MS);
      element.classList.add('opening');
      motes.glow();
      await pause(700);
      caption.textContent = 'ברוכים הבאים הביתה';
      await pause(SWING_BEFORE_WALK_MS - 700);
      element.classList.add('entering');
      await pause(WALK_MS);
      if (!skipped) cleanup();
    },
    remove: cleanup,
  };
}
