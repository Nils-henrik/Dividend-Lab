import LegalPageLayout, { LegalList, LegalSection } from "@/components/marketing/LegalPageLayout";
import {
  LEGAL_OPERATOR_TERMS,
  legalConfig,
} from "@/lib/legal/legal-config";

export default function TermsPageContent() {
  const { serviceName, operatorName, phaseLabel, minAccountAge } = legalConfig;

  return (
    <LegalPageLayout
      title="Användarvillkor"
      description={`Villkor för användning av ${serviceName} under den kostnadsfria betaperioden. Dessa villkor beskriver hur tjänsten får användas och vilka begränsningar som gäller.`}
    >
      <LegalSection title="Om DivLab">
        <p>{LEGAL_OPERATOR_TERMS}</p>
        <p>
          {serviceName} är en svensk digital plattform som erbjuder verktyg, utbildningsmaterial,
          marknadsrelaterad information och community-funktioner för personer som följer
          finansmarknaden.
        </p>
        <p>
          {serviceName} är för närvarande i {phaseLabel}. Tjänsten är inte en bank, mäklare,
          värdepappersbolag, investeringsföretag eller finansiell rådgivare.
        </p>
      </LegalSection>

      <LegalSection title="Behörighet och konton">
        <p>
          För att skapa konto och använda {serviceName} måste du vara minst {minAccountAge} år.
          Du ansvarar för att uppgifterna i ditt konto är korrekta och hålls uppdaterade.
        </p>
        <p>
          Kontot är personligt. Du ansvarar för att skydda dina inloggningsuppgifter och för
          all aktivitet som sker via ditt konto. Kontodelning, identitetsförfalskning och
          automatiserat missbruk av tjänsten är inte tillåtet.
        </p>
        <p>
          Acceptans av dessa villkor vid registrering loggas ännu inte tekniskt i tjänsten.
          Sådan funktion planeras som separat steg inför bredare lansering.
        </p>
      </LegalSection>

      <LegalSection title="Kostnadsfri beta">
        <p>
          {serviceName} erbjuds i nuläget utan avgift. Betalningar eller prenumerationer
          erbjuds inte. Betaperioden innebär att funktioner kan vara ofullständiga, förändras,
          pausas eller tas bort utan föregående meddelande.
        </p>
        <p>
          Tillgänglighet och funktionalitet garanteras inte under betan. {serviceName} utvecklas
          löpande och vissa delar kan innehålla demonstrationsexempel eller tidiga versioner.
        </p>
      </LegalSection>

      <LegalSection title="Finansiell information och rådgivningsgräns">
        <p>
          Innehåll i {serviceName} — inklusive artiklar, verktyg, beräkningar, marknadsinformation
          och community-inlägg — är avsett som allmän information och utbildning. Det utgör inte
          personlig finansiell rådgivning och ska inte tolkas som individuella rekommendationer
          att köpa, sälja eller behålla finansiella instrument.
        </p>
        <p>
          Verktyg som Frihetsplan och liknande beräkningar bygger på antaganden och ger
          förenklade eller illustrativa resultat. Historisk utveckling, exempel och prognoser
          är ingen garanti för framtida utfall. Du ansvarar själv för dina ekonomiska beslut.
        </p>
      </LegalSection>

      <LegalSection title="Information från tredje part">
        <p>
          Marknadsdiagram, nyhetsrubriker, länkar och annat material kan hämtas från externa
          leverantörer. Sådan information kan vara försenad, ofullständig, otillgänglig eller
          felaktig.
        </p>
        <p>
          {serviceName} tillhandahåller inte licensierad realtidsdata från börser som egen
          tjänst. Kontrollera viktig information mot originalkällor och auktoritativa källor
          innan du fattar beslut. Externa länkar styrs av respektive leverantörs villkor och
          integritetspolicy.
        </p>
      </LegalSection>

      <LegalSection title="Användargenererat innehåll">
        <p>
          Du kan publicera eller skicka innehåll i tjänsten, till exempel genom forumtrådar,
          svar, kommentarer på utbildningsartiklar, profiltext, uppladdade profilbilder och
          privata meddelanden. Du ansvarar för innehåll du publicerar eller skickar.
        </p>
        <p>Följande är inte tillåtet:</p>
        <LegalList
          items={[
            "olagligt innehåll",
            "trakasserier, hot eller hatiska uttalanden",
            "ärekränkning",
            "upphovsrättsintrång",
            "publicering av andras personuppgifter utan tillåtelse",
            "spam och otillbörlig marknadsföring",
            "marknadsmanipulation, pump-and-dump eller vilseledande marknadsföring",
            "dold reklam eller sponsrat innehåll utan tydlig markering",
            "bedrägeri och vilseledande påståenden",
            "skadlig programvara eller säkerhetshot",
            "identitetsförfalskning",
            "individuell finansiell rådgivning presenterad som professionell rådgivning",
          ]}
        />
      </LegalSection>

      <LegalSection title="Licens för hostat innehåll">
        <p>
          Du behåller äganderätten till ditt innehåll. Genom att publicera eller skicka innehåll
          i tjänsten ger du {operatorName} en begränsad, icke-exklusiv licens att lagra,
          tekniskt behandla, säkerhetskopiera, moderera och på annat sätt använda innehållet i
          den utsträckning som behövs för att driva {serviceName}.
        </p>
        <p>
          För offentligt synligt innehåll — till exempel forumtrådar, svar, synliga kommentarer
          och profiluppgifter — inkluderar licensen rätt att visa och göra innehållet tillgängligt
          för andra användare och besökare. Privata meddelanden avses endast vara tillgängliga
          för konversationens deltagare och ska inte beskrivas som allmänt offentligt innehåll.
        </p>
      </LegalSection>

      <LegalSection title="Moderering">
        <p>
          {operatorName} kan granska, dölja eller ta bort innehåll som bryter mot dessa villkor
          eller gällande rätt, samt begränsa eller avsluta konton i allvarliga fall. Det finns
          ingen garanti för att allt innehåll granskas innan publicering.
        </p>
        <p>
          Forum- och community-inlägg speglar användarnas egna åsikter och ska inte behandlas
          som verifierad finansiell information från {serviceName}. Formell rapporteringsfunktion
          och utökade modereringsverktyg förbereds inför bredare lansering.
        </p>
      </LegalSection>

      <LegalSection title="Tillgänglighet och ändringar">
        <p>
          {serviceName} kan påverkas av underhåll, tekniska fel, avbrott eller problem hos
          tredjepartsleverantörer. Funktioner kan ändras, begränsas eller tas bort. Drift dygnet
          runt eller felfri tillgänglighet garanteras inte.
        </p>
      </LegalSection>

      <LegalSection title="Ansvar">
        <p>
          {serviceName} tillhandahålls i betaläge i befintligt skick. I den utsträckning lagen
          medger ansvarar {operatorName} inte för indirekta skador, förlorad vinst eller förlust
          som följer av användning av tjänsten, inklusive beslut baserade på information,
          beräkningar eller community-innehåll.
        </p>
        <p>
          Inget i dessa villkor begränsar ansvar vid uppsåt eller grov vårdslöshet, eller annat
          ansvar som enligt tvingande lag inte får uteslutas. Obligatoriska konsumenträttigheter
          enligt tillämplig lag påverkas inte.
        </p>
      </LegalSection>

      <LegalSection title="Upphörande">
        <p>
          Du kan när som helst sluta använda {serviceName} och begära att ditt konto avslutas.
          Det finns ännu ingen funktion för automatisk kontoradering i tjänsten; sådan
          självbetjäning kan tillkomma senare som ett komplement till dina rättigheter enligt
          tillämplig dataskyddslag.
        </p>
        <p>
          När ett konto avslutas raderas eller anonymiseras uppgifter i den utsträckning det är
          möjligt och lämpligt. Viss data kan behöva behållas eller hanteras särskilt när lag,
          säkerhet, tvisthantering eller berättigat modereringsbehov kräver det, i enlighet med
          tillämpliga regler. Allt innehåll raderas inte nödvändigtvis omedelbart i varje del.
        </p>
      </LegalSection>

      <LegalSection title="Immateriella rättigheter">
        <p>
          {serviceName}s varumärke, design, programvara och originalartiklar tillhör{" "}
          {operatorName} eller licensgivare, om inte annat anges. Tredjepartsrättigheter
          respekteras. Ditt eget användargenererade innehåll förblir ditt, med den begränsade
          licens som anges ovan.
        </p>
      </LegalSection>

      <LegalSection title="Ändringar av villkoren">
        <p>
          Dessa villkor kan uppdateras när tjänsten utvecklas. Väsentliga ändringar bör
          kommuniceras på lämpligt sätt. Framtida versioner kan kräva aktiv acceptans vid
          inloggning eller registrering. Teknisk loggning av accepterad version finns ännu inte.
        </p>
      </LegalSection>

      <LegalSection title="Tillämplig lag">
        <p>
          Svensk lag tillämpas på dessa villkor. Tvingande konsumentskydd enligt lag som gäller
          för dig påverkas inte. Tvister bör i första hand lösas genom kontakt med {serviceName}.
          Ingen särskild domstolsforumklausul ska tolkas som att den åsidosätter tvingande regler.
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Verifierade kontaktuppgifter publiceras på kontaktsidan innan registrering öppnas
          brett. Frågor om dessa villkor kan då ställas via angivna kontaktvägar.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
