import {
  ADSENSE_OFFICIAL_SCRIPT_URL,
  ADSENSE_PRODUCTION_ENABLED,
} from "./constants";
import { applyNonceToScriptProps } from "../security/content-security-policy";

export type OfficialAdSenseScriptProps = {
  src: typeof ADSENSE_OFFICIAL_SCRIPT_URL;
  async: true;
  crossOrigin: "anonymous";
  nonce: string;
};

/**
 * Exact official publisher script attributes.
 *
 * Not mounted from the root layout. Callers must not render this while
 * `ADSENSE_PRODUCTION_ENABLED` is false.
 */
export function createOfficialAdSenseScriptProps(
  nonce: string,
): OfficialAdSenseScriptProps {
  return {
    src: ADSENSE_OFFICIAL_SCRIPT_URL,
    async: true,
    crossOrigin: "anonymous",
    ...applyNonceToScriptProps(nonce),
  };
}

export function assertAdSenseNotEnabledInProduction(): void {
  if (ADSENSE_PRODUCTION_ENABLED) {
    throw new Error(
      "AdSense production enablement is forbidden until ADR-007 is accepted.",
    );
  }
}
