export function BrandLogo({ variant = 'full', className = '' }) {
  if (variant === 'icon') {
    return (
      <div className={`brand-logo brand-logo--icon ${className}`.trim()}>
        <img
          src="/brand/logo-2.png"
          alt=""
          className="brand-logo__image brand-logo__image--icon"
          width={36}
          height={36}
        />
      </div>
    );
  }

  return (
    <div className={`brand-logo ${className}`.trim()}>
      <img
        src="/brand/logo.png"
        alt="MediTrack Pro"
        className="brand-logo__image"
        width={160}
        height={36}
      />
    </div>
  );
}
