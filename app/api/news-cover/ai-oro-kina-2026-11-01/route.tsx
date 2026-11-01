import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Editorial cover as PNG (not SVG) so X, Facebook and article thumbnails
 * receive a consistently embeddable 1280x720 image.
 *
 * The top-left official masthead is an unaltered crop of the canonical
 * DivLab news logo reference. No generated or approximated logo is used.
 */
export async function GET() {
  const publicDir = join(process.cwd(), "public", "news-demo");
  const [canonicalLogoCover, techCover] = await Promise.all([
    readFile(join(publicDir, "file_000000009cf48246883ae568fc196154.png")),
    readFile(join(publicDir, "ai-frossa-wall-street-chipjattar-2026-08-19.png")),
  ]);
  const canonicalSrc = `data:image/png;base64,${canonicalLogoCover.toString("base64")}`;
  const photoSrc = `data:image/png;base64,${techCover.toString("base64")}`;

  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", overflow: "hidden", background: "#07172b", color: "#fff", fontFamily: "Arial, sans-serif" }}>
      {/* An existing editorial photo is used as backdrop, not a reused title. */}
      <img src={photoSrc} width={1280} height={720} alt="" style={{ position: "absolute", inset: 0, width: 1280, height: 720, objectFit: "cover", opacity: 0.37 }} />
      <div style={{ display: "flex", position: "absolute", inset: 0, width: 1280, height: 720, background: "linear-gradient(90deg, #061427 0%, rgba(6,20,39,0.97) 44%, rgba(6,20,39,0.50) 100%)" }} />
      {/* Preserve the original approved masthead's unaltered upper-left pixels. */}
      <div style={{ position: "absolute", display: "flex", top: 0, left: 0, width: 570, height: 170, overflow: "hidden", background: "#f3f7fc", borderBottomRightRadius: 18 }}>
        <img src={canonicalSrc} width={1280} height={720} alt="" style={{ position: "absolute", top: 0, left: 0, width: 1280, height: 720, maxWidth: "none" }} />
      </div>
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", left: 90, top: 220, width: 1040 }}>
        <div style={{ fontSize: 25, fontWeight: 700, color: "#9cbce7", letterSpacing: 3, marginBottom: 24 }}>VECKAN SOM GÅTT · 26–30 OKTOBER 2026</div>
        <div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.09, letterSpacing: -2, maxWidth: 920 }}>
          AI-ORON SKAKAR WALL STREET
        </div>
        <div style={{ display: "flex", fontSize: 51, fontWeight: 700, lineHeight: 1.15, marginTop: 28, color: "#f2d6da" }}>
          KINA NÄSTAN −14 % I ÅR
        </div>
        <div style={{ display: "flex", fontSize: 23, color: "#e5effd", marginTop: 25 }}>
          Nasdaq faller · Sverige går mot strömmen
        </div>
      </div>
    </div>,
    {
      width: 1280,
      height: 720,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
