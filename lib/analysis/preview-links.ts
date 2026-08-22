const ANALYSIS_PREVIEW_ORIGIN =
  "https://dividend-lab-git-agent-us-research-coverage-v1-dividend-lab.vercel.app";

const ANALYSIS_PREVIEW_TESTCENTER_PATH = "/analyses/internal-preview/sources";

export const ANALYSIS_PREVIEW_TESTCENTER_URL = `${ANALYSIS_PREVIEW_ORIGIN}/login?redirect=${encodeURIComponent(
  ANALYSIS_PREVIEW_TESTCENTER_PATH,
)}`;
