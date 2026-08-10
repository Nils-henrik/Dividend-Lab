# DivLab Börsvecka — omslagsstandard

Den godkända fotobaserade kompositionen för Börsvecka 33 är den visuella referensen för framtida artiklar i serien **Börsvecka**. Den kanoniska rasterfilen ligger i `public/news-demo/borsvecka-33.webp` och levereras som en vanlig statisk bild via `/news-demo/borsvecka-33.webp`, på samma sätt som övriga Börsnyheter.

## Fast visuell riktning

- Utgå från ett trovärdigt, fotografiskt landskapsmotiv över Stockholm eller annan relevant svensk storstadsmiljö. Bakgrunden ska upplevas som ett riktigt redaktionellt fotografi, inte som syntetisk AI-konst.
- Lägg en mörk marinblå, halvtransparent DivLab-yta ovanpå fotografiet så att miljön fortfarande är tydligt synlig.
- Rubriken ska vara tydlig och enkel: `BÖRSVECKA <veckonummer>`.
- Visa aktuell datumperiod direkt under rubriken.
- Använd fem tydliga dagskort för måndag–fredag med datum, viktigaste händelse och en kort förklaring.
- Behåll ren svensk typografi och korta, redaktionella formuleringar.
- Undvik glödande börslinjer, futuristiska 3D-effekter, överdriven grafik och andra uttryck som gör bilden AI-genererad.
- Bilden ska fungera i både artikelhero och mobil beskärning.
- För framtida Börsvecka-omslag ska den slutliga godkända bilden sparas direkt som en riktig rasterfil (`.webp` eller `.png`) i `public/`. Bädda inte in rasterbilder som base64 inuti SVG för browserleverans.

## Referens

Canonical visual reference: den godkända Börsvecka 33-kompositionen i `public/news-demo/borsvecka-33.webp`.

Current browser delivery: `/news-demo/borsvecka-33.webp` (static WebP).

Vid kommande Börsvecka-artiklar ska samma komposition och fotografiska känsla användas, medan veckonummer, datum och dagsinnehåll uppdateras för aktuell vecka.
