import Image from "next/image";
import { payments } from "@/lib/integrations";

/** The payment methods row: logos only (Cash on Delivery has none, so an icon and its name). */
export function PaymentLogos() {
  return (
    <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
      {payments.map((p) => (
        <li key={p.name} className="flex h-8 items-center" title={p.name}>
          {p.logo ? (
            <Image src={p.logo} alt={p.name} width={p.w} height={96} className={`w-auto max-w-[120px] object-contain ${p.big ? "h-12" : "h-full"}`} />
          ) : (
            <span className="flex items-center gap-2 text-sm font-medium text-[#15803d]">
              <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="6" width="19" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.6" />
                <path d="M6 9.5v5M18 9.5v5" />
              </svg>
              Cash on Delivery
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
