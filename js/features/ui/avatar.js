import { h } from '../../core/dom.js';
import { colorFor, initial } from '../../core/format.js';

export function avatar(person, size = 44) {
  const box = h('div', { class: 'avatar' }, initial(person?.name));
  box.style.setProperty('--size', `${size}px`);
  box.style.background = colorFor(person?.id);
  if (person?.avatar_url) {
    const img = h('img', { alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', onerror: () => img.remove() });
    img.src = person.avatar_url;
    box.append(img);
  }
  return box;
}
