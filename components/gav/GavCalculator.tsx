import GavCalculatorClient from "./GavCalculatorClient";

export default function GavCalculator() {
  return (
    <section
      id="gav-kalkylator"
      aria-labelledby="gav-calculator-heading"
      className="divlab-hero"
    >
      <div className="gav-no-print mb-6 max-w-3xl">
        <p className="divlab-section-label text-divlab-blue-muted">
          Kostnadsfri kalkylator
        </p>
        <h2
          id="gav-calculator-heading"
          className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
        >
          Räkna ut GAV
        </h2>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Alla belopp anges i svenska kronor. Händelserna beräknas i den
          ordning de visas.
        </p>
      </div>
      <GavCalculatorClient />
    </section>
  );
}
