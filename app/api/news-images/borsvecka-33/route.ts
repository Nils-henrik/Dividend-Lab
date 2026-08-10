import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const SVG_PATH = path.join(
  process.cwd(),
  "public",
  "news-demo",
  "borsvecka-33.svg",
);

export async function GET() {
  const svg = await readFile(SVG_PATH, "utf8");
  const match = svg.match(/href="data:image\/webp;base64,([^"]+)"/);

  if (!match) {
    return new Response("Börsvecka 33 image source is missing", { status: 500 });
  }

  const image = Buffer.from(match[1], "base64");
  const isWebp =
    image.subarray(0, 4).toString("ascii") === "RIFF" &&
    image.subarray(8, 12).toString("ascii") === "WEBP";

  if (!isWebp) {
    return new Response("Börsvecka 33 image source is invalid", { status: 500 });
  }

  return new Response(image, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
