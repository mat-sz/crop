export function humanTime(time?: number): string {
  if (typeof time === 'undefined') {
    return '';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const centiseconds = Math.floor((time * 100) % 100);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds
    .toString()
    .padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
