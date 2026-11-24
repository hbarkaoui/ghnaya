import { APPLE_TOUCH_ICON_SIZE, appleTouchIcon } from "@/components/brand/appleTouchIcon";

/** Icône déclarée dans <head> (`<link rel="apple-touch-icon">`). Voir aussi apple-touch-icon.png/route.ts. */
export const size = { width: APPLE_TOUCH_ICON_SIZE, height: APPLE_TOUCH_ICON_SIZE };
export const contentType = "image/png";

export default function AppleIcon() {
  return appleTouchIcon();
}
