import LegalPageLayout, { LegalSection } from "@/components/marketing/LegalPageLayout";
import { legalConfig } from "@/lib/legal/legal-config";

export default function DisclaimerPageContent() {
  const { serviceName, operatorName } = legalConfig;

  return (
    <LegalPageLayout
      title="Ansvarsfriskrivning"
      description={`Viktig information om begränsningar i ${serviceName}s innehåll, verktyg och community under betaperioden.`}
    >
      <LegalSection title="Allmän finansiell information">
        <p>
          {serviceName} tillhandahåller allmän information, verktyg, utbildning och
          community-diskussion. Inget innehåll ska tolkas som personlig finansiell rådgivning,
          investeringsrekommendation eller uppmaning att köpa, sälja eller behålla
          värdepapper.
        </p>
        <p>
          Användning av {serviceName} skapar ingen rådgivnings-, förvaltnings- eller
          förtroenderelation. Du ansvarar själv för dina ekonomiska beslut.
        </p>
      </LegalSection>

      <LegalSection title="Marknadsdata och externa källor">
        <p>
          Marknadsdiagram, index, nyhetsrubriker och länkar kan komma från tredje part. Information
          kan vara försenad, ofullständig, felaktig eller tillfälligt otillgänglig. {serviceName}{" "}
          tillhandahåller inte egen licensierad realtidsbörsdata som huvudsaklig tjänst.
        </p>
        <p>
          Kontrollera viktiga uppgifter mot originalkällor och auktoritativa källor innan du agerar.
        </p>
      </LegalSection>

      <LegalSection title="Frihetsplan">
        <p>
          Frihetsplan är ett förenklat hypotetiskt planeringsverktyg. Det bygger på antaganden du
          anger — till exempel kapital, sparande, avkastning och direktavkastning — och visar
          illustrativa resultat.
        </p>
        <p>
          Verktyget förutsäger inte faktisk avkastning. Skatter, avgifter, inflation, risk,
          marknadsförändringar och andra faktorer kan påverka utfall avsevärt. Använd det inte
          som enda underlag för ekonomiska beslut.
        </p>
      </LegalSection>

      <LegalSection title="Börsnyheter">
        <p>
          Börsnyheter i {serviceName} är en tidig version av tjänstens nyhetsyta. Innehållet kan
          bestå av demonstrationsexempel, redaktionellt förberedda exempelartiklar eller
          begränsade rubriker — inte en fullständig, löpande nyhetstjänst. Behandla inte
          exempelinnehåll som aktuella verifierade nyheter.
        </p>
      </LegalSection>

      <LegalSection title="Kalender">
        <p>
          Kalendern kan under betan visa illustrativa eller demonstrationshändelser och mockdata.
          Innehållet speglar inte nödvändigtvis verkliga portföljhändelser eller fullständig
          marknadskalender.
        </p>
      </LegalSection>

      <LegalSection title="Utbildningsmaterial">
        <p>
          Utbildningsartiklar är avsedda som allmän orientering och kan bli inaktuella. De ersätter
          inte egen analys eller professionell rådgivning där sådan behövs.
        </p>
      </LegalSection>

      <LegalSection title="Användargenererat innehåll">
        <p>
          Forumtrådar, svar och kommentarer speglar användarnas egna åsikter. {operatorName} och{" "}
          {serviceName} verifierar, granskar eller stödjer inte inlägg som finansiell fakta eller
          rådgivning. Andra användares inlägg kan vara felaktiga, ofullständiga eller vilseledande.
        </p>
      </LegalSection>

      <LegalSection title="DivBrain">
        <p>
          DivBrain är under utveckling och är inte en färdig rådgivningstjänst i nuläget. Inget i
          framtida planering ska tolkas som löfte om individuella investeringsrekommendationer.
        </p>
      </LegalSection>

      <LegalSection title="Inga garantier">
        <p>
          Ingen del av {serviceName} garanterar avkastning, sparmål, utdelning, inkomst eller annat
          ekonomiskt resultat. Historiska exempel, beräkningar och antaganden är ingen garanti för
          framtiden. Investeringar medför risk, inklusive risk för förlust av kapital.
        </p>
      </LegalSection>

      <LegalSection title="Ansvar">
        <p>
          I den utsträckning lagen medger ansvarar {operatorName} inte för skada som följer av
          beslut baserade på information, verktyg eller community-innehåll i {serviceName}. Tvingande
          ansvarsregler enligt lag påverkas inte.
        </p>
      </LegalSection>

      <LegalSection id="reklam" title="Reklam och affiliates">
        <p>
          Den kostnadsfria betan innehåller för närvarande ingen betald reklam, inga sponsrade
          placeringar, inga affiliate-länkar och ingen affiliate-konverteringsspårning.
        </p>
        <p>
          Om kommersiellt samarbete införs senare ska reklam tydligt märkas, sponsrat innehåll
          skiljas från redaktionellt material, affiliate-relationer redovisas och denna policy
          uppdateras innan sådan funktion aktiveras. Inget här utgör löfte om framtida reklam.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
