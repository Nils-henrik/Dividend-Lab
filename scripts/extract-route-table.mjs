#!/usr/bin/env node
/**
 * Extract Next.js App Router render modes from a production build.
 * Writes JSON to stdout for comparing SSG/static routes against main.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prerenderPath = join(root, ".next/prerender-manifest.json");
const appPathsPath = join(root, ".next/app-path-routes-manifest.json");
const fallbackAppPathsPath = join(root, ".next/server/app-paths-manifest.json");

if (!existsSync(prerenderPath)) {
  console.error("Missing .next/prerender-manifest.json — run `npm run build` first.");
  process.exit(1);
}

const prerender = JSON.parse(readFileSync(prerenderPath, "utf8"));
const appPaths = existsSync(appPathsPath)
  ? JSON.parse(readFileSync(appPathsPath, "utf8"))
  : existsSync(fallbackAppPathsPath)
    ? JSON.parse(readFileSync(fallbackAppPathsPath, "utf8"))
    : {};

const staticRoutes = Object.keys(prerender.routes ?? {}).sort();
const dynamicRoutes = Object.keys(prerender.dynamicRoutes ?? {}).sort();

const summary = {
  staticRouteCount: staticRoutes.length,
  dynamicPrerenderCount: dynamicRoutes.length,
  watched: {
    "/": Boolean(prerender.routes?.["/"]),
    "/news/[slug]": Boolean(prerender.dynamicRoutes?.["/news/[slug]"]),
    "/learning/[slug]": Boolean(prerender.dynamicRoutes?.["/learning/[slug]"]),
  },
  staticRoutes,
  dynamicRoutes,
  appPathKeys: Object.keys(appPaths).sort(),
};

console.log(JSON.stringify(summary, null, 2));
