import {
  ADSENSE_SCRIPT_CROSS_ORIGIN,
  ADSENSE_SCRIPT_ID,
  ADSENSE_SCRIPT_SRC,
} from "@/lib/adsense/constants";

/**
 * Official AdSense publisher bootstrap. Rendered exactly once from the
 * root layout `<head>`. Auto Ads remain configured in AdSense, not here.
 */
export default function AdSenseScript() {
  return (
    <script
      id={ADSENSE_SCRIPT_ID}
      async
      src={ADSENSE_SCRIPT_SRC}
      crossOrigin={ADSENSE_SCRIPT_CROSS_ORIGIN}
    />
  );
}
