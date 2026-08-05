import { useEffect } from "react";

import { startPwa } from "@/shared/pwa/register";

/**
 * Mount-once bootstrapper for the PWA foundation. Renders nothing and never
 * blocks startup — registration happens when the browser is idle.
 */
export function PwaRegistrar(): null {
  useEffect(() => {
    startPwa();
  }, []);
  return null;
}
