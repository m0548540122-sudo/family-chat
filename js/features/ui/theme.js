const KEY = 'family-chat-theme';

function read() { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } }

function apply(choice) {
  const dark = choice === 'dark' || (choice === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export const theme = {
  get: read,
  set(choice) { try { localStorage.setItem(KEY, choice); } catch { /* still applies for this visit */ } apply(choice); },
  init() { apply(read()); matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => apply(read())); },
};
