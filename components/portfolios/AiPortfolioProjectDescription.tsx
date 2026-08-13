export default function AiPortfolioProjectDescription() {
  return (
    <section className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
      <div className="max-w-5xl space-y-4 text-sm leading-7 text-divlab-text-secondary sm:text-[15px]">
        <p>
          Därför har vi startat ett pilotprojekt med <strong className="font-semibold text-divlab-text">fyra AI-styrda portföljer</strong>, där varje portfölj får arbeta utifrån sin egen strategi, risknivå och sina egna regler.
        </p>
        <p>
          Varje portfölj startar med <strong className="font-semibold text-divlab-text">10 000 kronor</strong> och får därefter <strong className="font-semibold text-divlab-text">5 000 kronor i nytt kapital varje månad</strong>. Tanken är att efterlikna ett vanligt långsiktigt månadssparande och samtidigt ge AI:n möjlighet att bygga upp portföljen över tid.
        </p>
        <p>
          AI:n får själv söka efter bolag, analysera information och fatta beslut om när den vill <strong className="font-semibold text-divlab-text">köpa, behålla eller sälja</strong>. Portföljerna har olika inriktningar och ska därför inte nödvändigtvis hitta samma aktier eller fatta samma beslut.
        </p>
        <p>
          <strong className="font-semibold text-divlab-text">Vi ändrar inte AI:ns investeringsbeslut i efterhand – oavsett om utfallet blir bra eller dåligt.</strong> Poängen med experimentet är att följa vad som faktiskt händer när AI får analysera marknaden och fatta egna investeringsbeslut utifrån tydliga regler. Resultatet får helt enkelt bli vad det blir.
        </p>
        <p>
          Alla köp, försäljningar, avgifter och förändringar i portföljvärdet följs öppet på DivLab. Det gör att utvecklingen går att följa över både bra och dåliga perioder.
        </p>
      </div>

      <div className="mt-7 border-t divlab-border-neutral pt-6">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">Vad vill vi ta reda på?</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-divlab-text-secondary sm:text-[15px]">
          Det intressanta är inte om AI lyckas hitta en enskild vinnare. Det vi vill se är om AI under flera år kan:
        </p>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-divlab-text-secondary sm:grid-cols-2 sm:text-[15px]">
          <li>• hitta intressanta investeringar</li>
          <li>• hantera risk</li>
          <li>• reagera på ny information</li>
          <li>• undvika dåliga beslut</li>
          <li>• bygga en fungerande portfölj</li>
          <li>• prestera konkurrenskraftigt mot traditionell aktiv aktieförvaltning</li>
        </ul>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-divlab-text-secondary sm:text-[15px]">
          <strong className="font-semibold text-divlab-text">Det här är alltså inte fyra modellportföljer som ska visa hur du bör investera. Det är ett öppet experiment.</strong>
        </p>
        <p className="mt-2 text-sm font-semibold leading-7 text-divlab-text sm:text-[15px]">
          Vi vet inte hur det kommer att sluta. Och det är precis därför vi gör det.
        </p>
      </div>
    </section>
  );
}