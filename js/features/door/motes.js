// Slow golden dust drifting in the light of the open door.
export function createMotes(canvas, count = 42) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  let strength = 0;
  let target = 0;
  const motes = Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2,
    speed: 0.012 + Math.random() * 0.03, phase: Math.random() * 6.28,
  }));
  let last = performance.now();

  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    strength += (target - strength) * Math.min(1, dt * 1.2);
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    for (const m of motes) {
      m.y -= m.speed * dt;
      if (m.y < -0.02) m.y = 1.02;
      const sway = Math.sin(now / 1800 + m.phase) * 0.02;
      const twinkle = 0.45 + 0.55 * Math.sin(now / 900 + m.phase) ** 2;
      ctx.globalAlpha = strength * twinkle * 0.85;
      ctx.fillStyle = '#FFE9B0';
      ctx.beginPath();
      ctx.arc((m.x + sway) * width, m.y * height, m.r, 0, 6.29);
      ctx.fill();
    }
    frame = requestAnimationFrame(draw);
  }

  frame = requestAnimationFrame(draw);
  return { glow() { target = 1; }, stop() { cancelAnimationFrame(frame); } };
}
