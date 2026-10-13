"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { META_PIXEL_ID, track } from "@/lib/pixel";

/**
 * Fires PageView on every page, client-side navigations included. `track()` loads the pixel
 * itself (lib/pixel.ts), and PageView goes through it so it carries an event id that the
 * Conversions API copy shares.
 */
export function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => {
    track("PageView");
  }, [pathname]);

  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

/** Fires ViewContent once when a page opens (the "Build with <tool>" pages). */
export function TrackView({ name, category }: { name: string; category: string }) {
  useEffect(() => {
    track("ViewContent", { content_name: name, content_category: category });
  }, [name, category]);
  return null;
}
