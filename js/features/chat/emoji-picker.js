// Emoji panel opened from the composer.
import { emojiGroups } from '../../../config/emojis.js';
import { h } from '../../core/dom.js';

export function createEmojiPicker({ onPick }) {
  const element = h('div', { class: 'emoji-panel', hidden: true, role: 'dialog', 'aria-label': 'בחירת אימוג\'י' },
    emojiGroups.map((group) => h('section', {},
      h('h3', {}, group.name),
      h('div', { class: 'emoji-grid' }, group.emojis.map((emoji) =>
        h('button', { type: 'button', 'aria-label': emoji, onclick: () => onPick(emoji) }, emoji))))));
  return {
    element,
    toggle() { element.hidden = !element.hidden; },
    close() { element.hidden = true; },
  };
}
