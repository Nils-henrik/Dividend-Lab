import {
  ADSENSE_SCRIPT_CROSS_ORIGIN,
  ADSENSE_SCRIPT_ID,
  ADSENSE_SCRIPT_SRC,
} from "@/lib/adsense/constants";

/**
 * Loads the official AdSense bootstrap exactly once from the root layout
 * `<head>`, matching Google's current publisher snippet.
 * Auto Ads placements remain configured in the AdSense account, not here.
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
