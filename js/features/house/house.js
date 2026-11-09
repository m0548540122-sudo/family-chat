// The signature scene: a family home under the real time-of-day sky.
// Each family member has a window; it glows while they are online.
const SKIES = {
  dawn: ['#6F86C9', '#F6B38E', '#FFD9A6'],
  day: ['#5AA9E6', '#A5D8F3', '#FDEBC8'],
  dusk: ['#3B2F73', '#C85A6E', '#F7A35B'],
  night: ['#0F1538', '#232A5C', '#54406E'],
};

export function skyFor(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function windowsMarkup(count) {
  const total = Math.max(4, Math.min(count, 8));
  const cols = Math.ceil(total / 2);
  const gap = 74, startX = 500 - ((cols - 1) * gap) / 2 - 22;
  let out = '';
  for (let i = 0; i < total; i += 1) {
    const x = startX + (i % cols) * gap;
    const y = 300 + Math.floor(i / cols) * 74;
    out += `<g class="window" data-index="${i}"><rect x="${x - 4}" y="${y - 4}" width="52" height="56" rx="6" fill="#FFF3DF"/><rect class="glass" x="${x}" y="${y}" width="44" height="48" rx="3"/><path d="M${x + 22} ${y}v48M${x} ${y + 24}h44" stroke="#FFF3DF" stroke-width="3"/></g>`;
  }
  return out;
}

const tree = (x, scale, cls, color) => `
  <g transform="translate(${x} 470) scale(${scale})">
    <rect x="-9" y="-70" width="18" height="74" rx="6" fill="#6B4630"/>
    <g class="tree-top ${cls}"><circle cx="0" cy="-120" r="62" fill="${color}"/><circle cx="-42" cy="-90" r="42" fill="${color}"/><circle cx="42" cy="-92" r="44" fill="${color}"/></g>
  </g>`;

const fence = (x) => Array.from({ length: 12 }, (_, i) => `<rect x="${x + i * 22}" y="462" width="12" height="44" rx="5"/>`).join('')
  + `<rect x="${x}" y="476" width="264" height="7" rx="3"/>`;

const FLOWER_COLORS = ['#FF7A59', '#FFD166', '#F8A1C4', '#FFFFFF'];
const flowers = Array.from({ length: 34 }, (_, i) => {
  const x = (i * 61 + 20) % 1000;
  if (x > 390 && x < 610) return '';
  return `<circle cx="${x}" cy="${512 + ((i * 29) % 42)}" r="${3.5 + (i % 3)}" fill="${FLOWER_COLORS[i % 4]}"/>`;
}).join('');

export function createHouse({ slice = 'xMidYMax', members = 4, hour = new Date().getHours() } = {}) {
  const phase = skyFor(hour);
  const [top, mid, low] = SKIES[phase];
  const dark = phase === 'night';
  const ground = dark ? '#1E3A33' : phase === 'dusk' ? '#4E6B44' : '#7FAE5C';
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;inset:0';
  holder.setAttribute('aria-hidden', 'true');
  const stars = dark ? Array.from({ length: 40 }, (_, i) =>
    `<circle class="star" style="animation-delay:${(i * 0.37) % 3}s" cx="${(i * 137) % 1000}" cy="${(i * 53) % 230}" r="${1 + (i % 3) * 0.5}" fill="#fff"/>`).join('') : '';
  const orb = dark
    ? '<circle cx="790" cy="90" r="38" fill="#F6EFD2"/><circle cx="806" cy="80" r="34" fill="#232A5C"/>'
    : `<circle cx="790" cy="${phase === 'day' ? 90 : 210}" r="52" fill="#FFE29A" opacity=".95"/>`;
  const cloud = '<ellipse cx="60" cy="40" rx="60" ry="22"/><ellipse cx="34" cy="28" rx="30" ry="22"/><ellipse cx="84" cy="24" rx="36" ry="26"/>';
  holder.innerHTML = `
  <svg class="scene" viewBox="0 0 1000 560" preserveAspectRatio="${slice} slice">
    <defs><linearGradient id="sky-${phase}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/></linearGradient>
      <linearGradient id="wall-${phase}" x1="0" x2="1"><stop offset="0" stop-color="${dark ? '#A87B5D' : '#FBE3C4'}"/><stop offset="1" stop-color="${dark ? '#7F5A45' : '#E6BE94'}"/></linearGradient>
      <linearGradient id="roof-${phase}" x1="0" x2="1"><stop offset="0" stop-color="#D9603A"/><stop offset="1" stop-color="#A63C1C"/></linearGradient>
      <linearGradient id="ground-${phase}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ground}"/><stop offset="1" stop-color="${dark ? '#12261F' : '#4F8040'}"/></linearGradient></defs>
    <rect width="1000" height="560" fill="url(#sky-${phase})"/>${stars}${orb}
    <g class="cloud" fill="#fff" opacity="${dark ? .12 : .75}"><g transform="translate(0 60)">${cloud}</g></g>
    <g class="cloud slow" fill="#fff" opacity="${dark ? .08 : .55}"><g transform="translate(0 130) scale(.7)">${cloud}</g></g>
    ${dark ? '' : '<g class="bird" fill="none" stroke="#3B2A22" stroke-width="2.500" stroke-linecap="round"><path d="M0 90q9-10 18 0q9-10 18 0"/><path d="M44 72q7-8 14 0q7-8 14 0"/></g>'}
    <path d="M0 440C180 370 340 400 520 430S850 380 1000 420V560H0Z" fill="${dark ? '#172E2A' : '#9CC274'}" opacity=".85"/>
    ${tree(180, 1.15, '', dark ? '#24503F' : '#4F8F4A')}${tree(830, 1, 'b', dark ? '#1F4638' : '#5C9C4F')}
    <g class="smoke" fill="#fff"><circle cx="618" cy="165" r="10"/><circle cx="618" cy="165" r="10"/><circle cx="618" cy="165" r="10"/></g>
    <rect x="596" y="170" width="44" height="90" fill="#8C3F26"/><rect x="590" y="164" width="56" height="12" rx="3" fill="#6F2F1B"/>
    <rect x="330" y="270" width="340" height="230" fill="url(#wall-${phase})"/>
    <path d="M295 282 500 130 705 282Z" fill="url(#roof-${phase})"/>
    <path d="M295 282H705" stroke="#7E2C14" stroke-width="10" stroke-linecap="round"/>
    <path d="M360 262 500 158M420 262 500 200M640 262 500 158M580 262 500 200M500 158V262" stroke="#7E2C14" stroke-opacity=".28" stroke-width="3"/>
    <circle cx="500" cy="222" r="24" fill="#FFF3DF"/><circle cx="500" cy="222" r="18" fill="#FFC861"/><path d="M500 234c-14-9-12-20-5-20 3 0 4 2 5 4 1-2 2-4 5-4 7 0 9 11-5 20Z" fill="#BF4A27"/>
    ${windowsMarkup(members)}
    <ellipse cx="500" cy="506" rx="${dark ? 150 : 90}" ry="26" fill="#FFC861" opacity="${dark ? .28 : .1}"/>
    <path d="M0 490C260 462 720 462 1000 492V560H0Z" fill="url(#ground-${phase})"/>
    <path d="M462 482 C450 520 420 545 396 560H604C580 545 550 520 538 482Z" fill="#E7C9A2" opacity=".85"/>
    <g fill="#FFF3DF" opacity="${dark ? .35 : .9}">${fence(60)}${fence(676)}</g>
    <g>${flowers}</g>
  </svg>`;
  return {
    element: holder,
    setLit(count) {
      holder.querySelectorAll('.window').forEach((w, i) => w.classList.toggle('lit', i < count));
    },
  };
}
