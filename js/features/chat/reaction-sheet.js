// Opens when a message is tapped: pick how the message makes you feel.
import { quickReactions, reactionGroups } from '../../../config/emojis.js';
import { h } from '../../core/dom.js';
import { openSheet } from '../ui/sheet.js';

export function openReactionSheet({ reactions, myId, nameOf, onPick }) {
  const mine = reactions.find((r) => r.user_id === myId)?.emoji;
  let dialog;
  const choice = (emoji) => h('button', {
    type: 'button', 'aria-label': emoji, 'aria-pressed': String(emoji === mine),
    onclick: () => { dialog.close(); onPick(emoji); },
  }, emoji);

  const who = reactions.length > 0 && h('div', { class: 'reacted-list' }, reactions.map((r) =>
    h('span', {}, `${r.emoji} ${nameOf(r.user_id)}`)));

  dialog = openSheet('איך זה מרגיש לך?', h('div', { class: 'reaction-picker' },
    who,
    h('div', { class: 'reaction-quick' }, quickReactions.map(choice)),
    reactionGroups.map((group) => h('section', {},
      h('h3', {}, group.name),
      h('div', { class: 'reaction-grid' }, group.emojis.map(choice))))));
  dialog.classList.add('reaction-sheet');
}
