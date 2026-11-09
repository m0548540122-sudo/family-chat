// Speech-to-text in Hebrew using the browser's built-in recognition.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const ERRORS = {
  'not-allowed': 'צריך לאשר גישה למיקרופון בדפדפן.',
  'service-not-allowed': 'צריך לאשר גישה למיקרופון בדפדפן.',
  'audio-capture': 'לא נמצא מיקרופון במכשיר.',
  network: 'שירות התמלול לא זמין כרגע ברשת הזו.',
};

export const dictationSupported = Boolean(Recognition);

export function createDictation({ onFinal, onInterim, onState, onError }) {
  let recognition = null;

  function stop() { recognition?.stop(); }

  function start() {
    recognition = new Recognition();
    recognition.lang = 'he-IL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) onFinal(text.trim()); else interim += text;
      }
      onInterim(interim);
    };
    recognition.onerror = (event) => {
      if (ERRORS[event.error]) onError(ERRORS[event.error]);
    };
    recognition.onend = () => { recognition = null; onInterim(''); onState(false); };
    recognition.start();
    onState(true);
  }

  return { toggle() { if (recognition) stop(); else start(); }, stop };
}
