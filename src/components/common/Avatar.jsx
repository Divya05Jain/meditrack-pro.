export function Avatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`avatar avatar--${size}`} aria-hidden="true">
      {initials}
    </div>
  );
}
