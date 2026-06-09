import { appName } from "../api";

export function BrandMark({ className = "" }: { className?: string }) {
  return <img className={`brand-mark ${className}`.trim()} src="/favicon/favicon-512.png" alt={appName} />;
}
