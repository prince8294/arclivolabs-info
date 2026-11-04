import Image from "next/image";

type BrandLoaderProps = {
  label?: string;
  variant?: "screen" | "section" | "inline";
  className?: string;
};

export function BrandLoader({ label = "Loading", variant = "screen", className = "" }: BrandLoaderProps) {
  if (variant === "inline") {
    return (
      <div className={`arl-loader-inline ${className}`.trim()} role="status" aria-label={label}>
        <span className="arl-loader-inline-mark" aria-hidden="true">
          <Image src="/artwork/arclivo-mark.svg" alt="" width={24} height={24} unoptimized />
        </span>
        <span className="arl-loader-inline-label" aria-hidden="true">{label}</span>
        <span className="arl-loader-inline-line" aria-hidden="true"><i /></span>
      </div>
    );
  }

  return (
    <div className={`arl-loader arl-loader-${variant} ${className}`.trim()} role="status" aria-label={label}>
      <div className="arl-loader-simple">
        <span className="arl-loader-simple-mark" aria-hidden="true">
          <Image src="/artwork/arclivo-mark.svg" alt="" width={42} height={42} priority unoptimized />
          <i />
        </span>
        <span className="arl-loader-simple-wordmark" aria-hidden="true">ARCLIVO</span>
        <span className="arl-loader-simple-kicker" aria-hidden="true">CREATOR MARKETING</span>
        <span className="arl-loader-simple-label" aria-hidden="true">{label}</span>
        <span className="arl-loader-simple-line" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}
