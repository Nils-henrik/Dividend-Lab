"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { calculateGav, calculateTargetGav } from "@/lib/gav/calculate";
import {
  buildGavCsv,
  formatGav,
  formatMoney,
  formatQuantity,
} from "@/lib/gav/format";
import {
  createGavEvent,
  createInitialGavState,
  parsePersistedGavState,
} from "@/lib/gav/persistence";
import {
  GAV_STORAGE_KEY,
  type GavCalculatorMode,
  type GavEvent,
  type GavEventType,
} from "@/lib/gav/types";
import GavResults from "./GavResults";
import GavTransactionRow from "./GavTransactionRow";

const inputClassName =
  "divlab-input min-h-11 w-full px-3 py-2.5 focus-visible:ring-2 focus-visible:ring-divlab-blue/30";

function InputError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  return message ? (
    <p id={id} className="mt-1.5 text-xs leading-5 text-red-300">
      {message}
    </p>
  ) : null;
}

export default function GavCalculatorClient() {
  const [state, setState] = useState(createInitialGavState);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [targetTouched, setTargetTouched] = useState(false);
  const [generatedDate, setGeneratedDate] = useState("");
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const skipNextPersistenceRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const serialized = window.localStorage.getItem(GAV_STORAGE_KEY);
      const persisted = parsePersistedGavState(serialized);
      if (persisted) {
        setState(persisted);
      } else if (serialized) {
        window.localStorage.removeItem(GAV_STORAGE_KEY);
      }
      setGeneratedDate(
        new Intl.DateTimeFormat("sv-SE", { dateStyle: "long" }).format(
          new Date(),
        ),
      );
      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      window.localStorage.removeItem(GAV_STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(GAV_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The calculator remains fully usable if browser storage is unavailable.
    }
  }, [hasLoadedStorage, state]);

  const calculation = useMemo(
    () =>
      calculateGav({
        opening: state.opening,
        events: state.events,
        currentPrice: state.currentPrice,
        estimatedSaleFee: state.estimatedSaleFee,
      }),
    [
      state.currentPrice,
      state.estimatedSaleFee,
      state.events,
      state.opening,
    ],
  );

  const targetCalculation = useMemo(
    () => calculateTargetGav(state.target),
    [state.target],
  );

  const liveMessage = useMemo(() => {
    if (state.mode === "target") {
      if (!targetTouched || !targetCalculation.isValid) {
        return "";
      }
      return `Målberäkningen är uppdaterad. Antal att köpa: ${formatQuantity(targetCalculation.quantityToBuy!)}. Beräknat GAV: ${formatGav(targetCalculation.resultingGav!)}.`;
    }
    if (!calculation.summary) {
      return "";
    }
    return `GAV-resultatet är uppdaterat. Antal kvar: ${formatQuantity(calculation.summary.quantity)}. Aktuellt GAV: ${calculation.summary.gav ? formatGav(calculation.summary.gav) : "inget GAV"}.`;
  }, [
    calculation.summary,
    state.mode,
    targetCalculation,
    targetTouched,
  ]);

  function focusEvent(id: string) {
    window.requestAnimationFrame(() => {
      const row = document.getElementById(`gav-event-${id}`);
      const field = row?.querySelector<HTMLElement>(
        "[data-first-event-field]",
      );
      field?.focus();
    });
  }

  function updateEvent(nextEvent: GavEvent) {
    setState((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === nextEvent.id ? nextEvent : event,
      ),
    }));
  }

  function changeEventType(id: string, type: GavEventType) {
    setState((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === id
          ? {
              ...createGavEvent(type, id),
              date: event.date,
            }
          : event,
      ),
    }));
  }

  function addEvent() {
    const id = crypto.randomUUID();
    setState((current) => ({
      ...current,
      events: [...current.events, createGavEvent("purchase", id)],
    }));
    focusEvent(id);
  }

  function removeEvent(id: string) {
    const index = state.events.findIndex((event) => event.id === id);
    const focusTarget =
      state.events[index + 1]?.id ?? state.events[index - 1]?.id;
    setState((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== id),
    }));
    if (focusTarget) {
      focusEvent(focusTarget);
    } else {
      window.requestAnimationFrame(() => addButtonRef.current?.focus());
    }
  }

  function moveEvent(id: string, direction: -1 | 1) {
    setState((current) => {
      const index = current.events.findIndex((event) => event.id === id);
      const destination = index + direction;
      if (
        index < 0 ||
        destination < 0 ||
        destination >= current.events.length
      ) {
        return current;
      }
      const events = [...current.events];
      [events[index], events[destination]] = [
        events[destination],
        events[index],
      ];
      return { ...current, events };
    });
    focusEvent(id);
  }

  function loadExample() {
    setConfirmClear(false);
    setState((current) => ({
      ...current,
      mode: "events",
      opening: { enabled: false, quantity: "", gav: "" },
      events: [
        {
          id: crypto.randomUUID(),
          type: "purchase",
          date: "",
          quantity: "10",
          price: "100",
          fee: "9",
        },
        {
          id: crypto.randomUUID(),
          type: "purchase",
          date: "",
          quantity: "20",
          price: "50",
          fee: "19",
        },
      ],
      currentPrice: "",
      estimatedSaleFee: "",
    }));
  }

  function clearAll() {
    skipNextPersistenceRef.current = true;
    window.localStorage.removeItem(GAV_STORAGE_KEY);
    setState(createInitialGavState());
    setTargetTouched(false);
    setConfirmClear(false);
    window.requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function changeMode(mode: GavCalculatorMode) {
    setState((current) => ({ ...current, mode }));
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const nextMode =
      event.key === "ArrowRight" || event.key === "End"
        ? "target"
        : "events";
    changeMode(nextMode);
    document.getElementById(`gav-tab-${nextMode}`)?.focus();
  }

  function exportCsv() {
    if (!calculation.summary) {
      return;
    }
    const csv = buildGavCsv({
      securityName: state.securityName,
      events: state.events,
      calculation,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gav-berakning.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const openingErrors = calculation.errors.opening ?? {};
  const marketErrors = calculation.errors.market ?? {};
  const targetErrors = targetTouched ? targetCalculation.errors : {};

  return (
    <div className="gav-print-root">
      <div
        className="gav-no-print mb-6 flex rounded-2xl border divlab-border-neutral bg-divlab-surface p-1"
        role="tablist"
        aria-label="Välj beräkningssätt"
      >
        {(
          [
            ["events", "Händelser"],
            ["target", "Mål-GAV"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            id={`gav-tab-${mode}`}
            type="button"
            role="tab"
            aria-selected={state.mode === mode}
            aria-controls={`gav-panel-${mode}`}
            tabIndex={state.mode === mode ? 0 : -1}
            onClick={() => changeMode(mode)}
            onKeyDown={handleTabKeyDown}
            className={`min-h-11 flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
              state.mode === mode
                ? "bg-divlab-blue text-white"
                : "text-divlab-text-secondary hover:bg-white/[0.04] hover:text-divlab-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      {state.mode === "events" ? (
        <div
          id="gav-panel-events"
          role="tabpanel"
          aria-labelledby="gav-tab-events"
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start"
        >
          <div className="gav-editor min-w-0 space-y-6 print:hidden">
            <fieldset className="divlab-card p-5 sm:p-6">
              <legend className="px-1 text-base font-semibold text-divlab-text">
                Startläge
              </legend>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-divlab-text">
                <input
                  type="checkbox"
                  checked={state.opening.enabled}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      opening: {
                        ...current.opening,
                        enabled: event.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5 rounded border-divlab-border-neutral bg-divlab-input accent-divlab-blue"
                />
                Jag har redan ett innehav
              </label>

              {state.opening.enabled ? (
                <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="gav-security-name"
                      className="mb-1.5 block text-sm font-medium text-divlab-text"
                    >
                      Namn på värdepapper (valfritt)
                    </label>
                    <input
                      id="gav-security-name"
                      type="text"
                      autoComplete="off"
                      maxLength={200}
                      value={state.securityName}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          securityName: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="Exempelbolaget B"
                    />
                    <p className="mt-1.5 text-xs leading-5 text-divlab-text-muted">
                      Namnet används bara i visningen och exporterade
                      sammanställningar.
                    </p>
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor="gav-opening-quantity"
                      className="mb-1.5 block text-sm font-medium text-divlab-text"
                    >
                      Antal aktier eller fondandelar
                    </label>
                    <input
                      id="gav-opening-quantity"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={state.opening.quantity}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          opening: {
                            ...current.opening,
                            quantity: event.target.value,
                          },
                        }))
                      }
                      aria-invalid={Boolean(openingErrors.quantity)}
                      aria-describedby={
                        openingErrors.quantity
                          ? "gav-opening-quantity-error"
                          : "gav-opening-help"
                      }
                      className={inputClassName}
                      placeholder="0"
                    />
                    <InputError
                      id="gav-opening-quantity-error"
                      message={openingErrors.quantity}
                    />
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor="gav-opening-gav"
                      className="mb-1.5 block text-sm font-medium text-divlab-text"
                    >
                      Nuvarande GAV
                    </label>
                    <div className="relative">
                      <input
                        id="gav-opening-gav"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={state.opening.gav}
                        onChange={(event) =>
                          setState((current) => ({
                            ...current,
                            opening: {
                              ...current.opening,
                              gav: event.target.value,
                            },
                          }))
                        }
                        aria-invalid={Boolean(openingErrors.gav)}
                        aria-describedby={
                          openingErrors.gav
                            ? "gav-opening-gav-error"
                            : "gav-opening-help"
                        }
                        className={`${inputClassName} pr-10`}
                        placeholder="0,00"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-divlab-text-muted"
                      >
                        kr
                      </span>
                    </div>
                    <InputError
                      id="gav-opening-gav-error"
                      message={openingErrors.gav}
                    />
                  </div>
                  <p
                    id="gav-opening-help"
                    className="sm:col-span-2 text-xs leading-5 text-divlab-text-muted"
                  >
                    Startens omkostnadsbelopp beräknas som antal multiplicerat
                    med nuvarande GAV. Startläget är en sammanfattning och
                    resultatets riktighet beror på det GAV du anger.
                  </p>
                </div>
              ) : null}
            </fieldset>

            <section aria-labelledby="gav-events-heading" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3
                    id="gav-events-heading"
                    className="text-lg font-semibold text-divlab-text"
                  >
                    Händelser i beräkningsordning
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
                    Raderna räknas uppifrån och ned. Datum sorterar dem inte.
                  </p>
                </div>
                <button
                  ref={addButtonRef}
                  type="button"
                  onClick={addEvent}
                  disabled={state.events.length >= 500}
                  className="divlab-btn-primary min-h-11 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lägg till händelse
                </button>
              </div>

              {state.events.map((event, index) => (
                <GavTransactionRow
                  key={event.id}
                  event={event}
                  index={index}
                  errors={calculation.errors[event.id]}
                  canMoveUp={index > 0}
                  canMoveDown={index < state.events.length - 1}
                  hasFractionalUnits={Boolean(
                    calculation.steps.find(
                      (step) => step.eventId === event.id,
                    )?.hasFractionalUnits,
                  )}
                  onChange={updateEvent}
                  onTypeChange={changeEventType}
                  onMove={moveEvent}
                  onRemove={removeEvent}
                />
              ))}

              {!state.events.length ? (
                <p className="rounded-xl border divlab-border-neutral px-4 py-3 text-sm text-divlab-text-secondary">
                  Inga händelser har lagts till. Du kan fortfarande räkna från
                  ett startinnehav.
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={loadExample}
                  className="divlab-btn-secondary min-h-11"
                >
                  Ladda exempel
                </button>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-5 py-2.5 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                  >
                    Rensa allt
                  </button>
                ) : (
                  <div
                    role="group"
                    aria-label="Bekräfta rensning"
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-red-300/20 bg-red-300/[0.04] p-2"
                  >
                    <span className="px-1 text-xs text-red-100">
                      Rensa alla lokalt sparade uppgifter?
                    </span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex min-h-11 items-center rounded-lg bg-red-500 px-3 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                    >
                      Ja, rensa
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="inline-flex min-h-11 items-center rounded-lg border divlab-border-neutral px-3 text-xs font-medium text-divlab-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                    >
                      Avbryt
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs leading-5 text-divlab-text-muted">
                Exemplet visar hur courtage höjer det genomsnittliga
                anskaffningsvärdet.
              </p>
            </section>

            <fieldset className="divlab-card p-5 sm:p-6">
              <legend className="px-1 text-base font-semibold text-divlab-text">
                Jämför med aktuell kurs (valfritt)
              </legend>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="gav-current-price"
                    className="mb-1.5 block text-sm font-medium text-divlab-text"
                  >
                    Aktuell kurs
                  </label>
                  <div className="relative">
                    <input
                      id="gav-current-price"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={state.currentPrice}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          currentPrice: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(marketErrors.currentPrice)}
                      aria-describedby={
                        marketErrors.currentPrice
                          ? "gav-current-price-error"
                          : undefined
                      }
                      className={`${inputClassName} pr-10`}
                      placeholder="0,00"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-divlab-text-muted"
                    >
                      kr
                    </span>
                  </div>
                  <InputError
                    id="gav-current-price-error"
                    message={marketErrors.currentPrice}
                  />
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="gav-estimated-sale-fee"
                    className="mb-1.5 block text-sm font-medium text-divlab-text"
                  >
                    Beräknat courtage vid försäljning
                  </label>
                  <div className="relative">
                    <input
                      id="gav-estimated-sale-fee"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={state.estimatedSaleFee}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          estimatedSaleFee: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(
                        marketErrors.estimatedSaleFee,
                      )}
                      aria-describedby={
                        marketErrors.estimatedSaleFee
                          ? "gav-estimated-sale-fee-error"
                          : undefined
                      }
                      className={`${inputClassName} pr-10`}
                      placeholder="0"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-divlab-text-muted"
                    >
                      kr
                    </span>
                  </div>
                  <InputError
                    id="gav-estimated-sale-fee-error"
                    message={marketErrors.estimatedSaleFee}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!calculation.summary}
                className="divlab-btn-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Exportera CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!calculation.summary}
                className="divlab-btn-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Skriv ut eller spara som PDF
              </button>
            </div>

            <p className="rounded-xl border divlab-border-neutral bg-white/[0.02] px-4 py-3 text-xs leading-5 text-divlab-text-secondary">
              Dina uppgifter sparas endast lokalt i den här webbläsaren och
              skickas inte till DivLab.
            </p>
          </div>

          <div
            data-gav-result-panel="events"
            className="min-w-0 lg:sticky lg:top-24 print:static"
          >
            <div className="hidden print:mb-6 print:block">
              <p className="text-sm font-semibold">DivLab</p>
              <h2 className="mt-2 text-2xl font-semibold">
                GAV-kalkylator – beräkningssammanställning
              </h2>
              {state.securityName.trim() ? (
                <p className="mt-2">
                  Värdepapper: {state.securityName.trim()}
                </p>
              ) : null}
              <p className="mt-1 text-sm">Genererad {generatedDate}</p>
            </div>
            <GavResults
              calculation={calculation}
              showMoreDecimals={state.showMoreDecimals}
              securityName={state.securityName}
              onToggleDecimals={() =>
                setState((current) => ({
                  ...current,
                  showMoreDecimals: !current.showMoreDecimals,
                }))
              }
            />
            <p className="mt-5 hidden text-xs leading-5 print:block">
              Sammanställningen är ett hjälpmedel och inte ett officiellt
              deklarationsunderlag. Kontrollera alltid uppgifterna mot
              avräkningsnotor, kontoutdrag, företagshändelser och aktuell
              information från Skatteverket.
            </p>
          </div>
        </div>
      ) : (
        <section
          id="gav-panel-target"
          role="tabpanel"
          aria-labelledby="gav-tab-target"
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)] lg:items-start"
        >
          <fieldset className="divlab-card min-w-0 p-5 sm:p-6">
            <legend className="px-1 text-lg font-semibold text-divlab-text">
              Hur mycket behöver jag köpa för att nå ett visst GAV?
            </legend>
            <p className="mb-5 mt-2 text-sm leading-6 text-divlab-text-secondary">
              Målet måste ligga mellan ditt nuvarande GAV och köppriset.
              Verktyget fungerar både när du räknar på att snitta ned och när
              du räknar på ett högre GAV.
            </p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {(
                [
                  ["currentQuantity", "Nuvarande antal", ""],
                  ["currentGav", "Nuvarande GAV", "kr"],
                  ["purchasePrice", "Köppris per aktie", "kr"],
                  ["purchaseFee", "Courtage för köpet", "kr"],
                  ["targetGav", "Önskat GAV", "kr"],
                ] as const
              ).map(([field, label, suffix]) => {
                const id = `gav-target-${field}`;
                const error = targetErrors[field];
                return (
                  <div
                    key={field}
                    className={`min-w-0 ${
                      field === "targetGav" ? "sm:col-span-2" : ""
                    }`}
                  >
                    <label
                      htmlFor={id}
                      className="mb-1.5 block text-sm font-medium text-divlab-text"
                    >
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        id={id}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={state.target[field]}
                        onChange={(event) => {
                          setTargetTouched(true);
                          setState((current) => ({
                            ...current,
                            target: {
                              ...current.target,
                              [field]: event.target.value,
                            },
                          }));
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className={`${inputClassName} ${suffix ? "pr-10" : ""}`}
                        placeholder={suffix ? "0,00" : "0"}
                      />
                      {suffix ? (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-divlab-text-muted"
                        >
                          {suffix}
                        </span>
                      ) : null}
                    </div>
                    <InputError id={`${id}-error`} message={error} />
                  </div>
                );
              })}
            </div>
            <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-divlab-text">
              <input
                type="checkbox"
                checked={state.target.allowFractional}
                onChange={(event) => {
                  setTargetTouched(true);
                  setState((current) => ({
                    ...current,
                    target: {
                      ...current.target,
                      allowFractional: event.target.checked,
                    },
                  }));
                }}
                className="h-5 w-5 rounded border-divlab-border-neutral bg-divlab-input accent-divlab-blue"
              />
              Tillåt delar av en aktie eller fondandel
            </label>
          </fieldset>

          <aside
            data-gav-result-panel="target"
            className="divlab-card min-w-0 p-5 sm:p-6 lg:sticky lg:top-24"
          >
            <p className="divlab-section-label text-divlab-blue-muted">
              Mål-GAV
            </p>
            <h3 className="mt-2 text-xl font-semibold text-divlab-text">
              Beräknat köp
            </h3>
            {!targetTouched ? (
              <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
                Fyll i uppgifterna för att beräkna hur många aktier eller
                fondandelar som behövs.
              </p>
            ) : !targetCalculation.isValid ? (
              <p className="mt-3 rounded-xl border border-red-300/20 bg-red-300/[0.05] px-3 py-2.5 text-sm leading-6 text-red-100">
                Kontrollera de markerade fälten innan resultatet kan räknas ut.
              </p>
            ) : (
              <dl className="mt-5 space-y-3">
                <div className="border-b border-white/[0.06] pb-3">
                  <dt className="text-xs text-divlab-text-muted">
                    Antal att köpa
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-divlab-text">
                    {formatQuantity(targetCalculation.quantityToBuy!)}
                  </dd>
                  {!state.target.allowFractional &&
                  !targetCalculation.exactQuantity!.eq(
                    targetCalculation.quantityToBuy!,
                  ) ? (
                    <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
                      Matematiskt exakt antal:{" "}
                      {formatQuantity(targetCalculation.exactQuantity!)}.
                      Antalet har avrundats uppåt till en hel enhet.
                    </p>
                  ) : null}
                </div>
                <div className="border-b border-white/[0.06] pb-3">
                  <dt className="text-xs text-divlab-text-muted">
                    Beräknat ordervärde
                  </dt>
                  <dd className="mt-1 font-semibold text-divlab-text">
                    {formatMoney(targetCalculation.orderValue!)}
                  </dd>
                </div>
                <div className="border-b border-white/[0.06] pb-3">
                  <dt className="text-xs text-divlab-text-muted">
                    Total kostnad inklusive courtage
                  </dt>
                  <dd className="mt-1 font-semibold text-divlab-text">
                    {formatMoney(targetCalculation.totalPurchaseCost!)}
                  </dd>
                </div>
                <div className="border-b border-white/[0.06] pb-3">
                  <dt className="text-xs text-divlab-text-muted">
                    Nytt totalt antal
                  </dt>
                  <dd className="mt-1 font-semibold text-divlab-text">
                    {formatQuantity(targetCalculation.newTotalQuantity!)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">
                    Beräknat GAV efter köpet
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-divlab-text">
                    {formatGav(
                      targetCalculation.resultingGav!,
                      state.showMoreDecimals,
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}
