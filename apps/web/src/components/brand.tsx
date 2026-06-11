import { appName } from "../api";

export function BrandMark({ alt = appName, className = "", src }: { alt?: string; className?: string; src?: string | null }) {
  return <img className={`brand-mark ${className}`.trim()} src={src || "/favicon/favicon-512.png"} alt={alt} />;
}
