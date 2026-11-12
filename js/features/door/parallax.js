// A very small camera sway that follows the mouse or the tilt of the tablet.
const MAX_DEG = 2.4;

export function createParallax(element) {
  let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const onPointer = (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; };
  const onTilt = (e) => { if (e.gamma !== null) { tx = clamp(e.gamma / 25); ty = clamp((e.beta - 45) / 25); } };

  function tick() {
    x += (tx - x) * 0.04;
    y += (ty - y) * 0.04;
    element.style.transform = `rotateY(${x * MAX_DEG}deg) rotateX(${-y * MAX_DEG}deg)`;
    frame = requestAnimationFrame(tick);
  }

  addEventListener('pointermove', onPointer);
  addEventListener('deviceorientation', onTilt);
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('pointermove', onPointer);
    removeEventListener('deviceorientation', onTilt);
  };
}
