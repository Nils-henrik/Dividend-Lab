"use client";

import { parseSwedishDecimal } from "@/lib/gav/calculate";
import { formatQuantity, GAV_EVENT_LABELS } from "@/lib/gav/format";
import type {
  GavEvent,
  GavEventType,
  GavFieldErrors,
} from "@/lib/gav/types";

type Props = {
  event: GavEvent;
  index: number;
  errors?: GavFieldErrors;
  canMoveUp: boolean;
  canMoveDown: boolean;
  hasFractionalUnits: boolean;
  onChange: (event: GavEvent) => void;
  onTypeChange: (id: string, type: GavEventType) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
};

function FieldError({
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

const inputClassName =
  "divlab-input min-h-11 w-full px-3 py-2.5 focus-visible:ring-2 focus-visible:ring-divlab-blue/30";

export default function GavTransactionRow({
  event,
  index,
  errors,
  canMoveUp,
  canMoveDown,
  hasFractionalUnits,
  onChange,
  onTypeChange,
  onMove,
  onRemove,
}: Props) {
  const fieldId = (field: string) => `gav-${event.id}-${field}`;
  const errorId = (field: string) => `${fieldId(field)}-error`;

  let splitPreview = "";
  if (event.type === "split" || event.type === "reverseSplit") {
    const oldUnits = parseSwedishDecimal(event.oldUnits);
    const newUnits = parseSwedishDecimal(event.newUnits);
    if (oldUnits?.gt(0) && newUnits?.gt(0)) {
      splitPreview = `Varje ${formatQuantity(oldUnits)} gamla aktier eller andelar blir ${formatQuantity(newUnits)} nya. Antalet multipliceras med ${formatQuantity(newUnits.div(oldUnits))}, medan det totala omkostnadsbeloppet är oförändrat.`;
    } else {
      splitPreview =
        "Fyll i båda värdena. Kvoten beskriver det totala antalet efter händelsen, inte antalet nytilldelade aktier.";
    }
  }

  return (
    <fieldset
      id={`gav-event-${event.id}`}
      className="min-w-0 rounded-2xl border divlab-border-neutral bg-white/[0.02] p-4 sm:p-5"
    >
      <legend className="px-1 text-sm font-semibold text-divlab-text">
        Händelse {index + 1}
      </legend>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onMove(event.id, -1)}
          disabled={!canMoveUp}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-3 text-xs font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Flytta upp
        </button>
        <button
          type="button"
          onClick={() => onMove(event.id, 1)}
          disabled={!canMoveDown}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-3 text-xs font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Flytta ner
        </button>
        <button
          type="button"
          onClick={() => onRemove(event.id)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-400/20 px-3 text-xs font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-400/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
        >
          Ta bort
        </button>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor={fieldId("type")}
            className="mb-1.5 block text-sm font-medium text-divlab-text"
          >
            Typ av händelse
          </label>
          <select
            id={fieldId("type")}
            data-first-event-field
            value={event.type}
            onChange={(changeEvent) =>
              onTypeChange(event.id, changeEvent.target.value as GavEventType)
            }
            className={inputClassName}
          >
            {Object.entries(GAV_EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={fieldId("date")}
            className="mb-1.5 block text-sm font-medium text-divlab-text"
          >
            Datum (valfritt)
          </label>
          <input
            id={fieldId("date")}
            type="date"
            value={event.date}
            onChange={(changeEvent) =>
              onChange({ ...event, date: changeEvent.target.value })
            }
            className={inputClassName}
          />
          <p className="mt-1.5 text-xs leading-5 text-divlab-text-muted">
            Datumet ändrar inte händelsernas ordning.
          </p>
        </div>
      </div>

      {event.type === "purchase" || event.type === "sale" ? (
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-3">
          <div className="min-w-0">
            <label
              htmlFor={fieldId("quantity")}
              className="mb-1.5 block text-sm font-medium text-divlab-text"
            >
              Antal
            </label>
            <input
              id={fieldId("quantity")}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={event.quantity}
              onChange={(changeEvent) =>
                onChange({ ...event, quantity: changeEvent.target.value })
              }
              aria-invalid={Boolean(errors?.quantity)}
              aria-describedby={
                errors?.quantity ? errorId("quantity") : undefined
              }
              className={inputClassName}
              placeholder="0"
            />
            <FieldError
              id={errorId("quantity")}
              message={errors?.quantity}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor={fieldId("price")}
              className="mb-1.5 block text-sm font-medium text-divlab-text"
            >
              {event.type === "sale"
                ? "Försäljningspris per aktie"
                : "Pris per aktie"}
            </label>
            <div className="relative">
              <input
                id={fieldId("price")}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={event.price}
                onChange={(changeEvent) =>
                  onChange({ ...event, price: changeEvent.target.value })
                }
                aria-invalid={Boolean(errors?.price)}
                aria-describedby={
                  errors?.price ? errorId("price") : undefined
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
            <FieldError id={errorId("price")} message={errors?.price} />
          </div>
          <div className="min-w-0">
            <label
              htmlFor={fieldId("fee")}
              className="mb-1.5 block text-sm font-medium text-divlab-text"
            >
              Courtage
            </label>
            <div className="relative">
              <input
                id={fieldId("fee")}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={event.fee}
                onChange={(changeEvent) =>
                  onChange({ ...event, fee: changeEvent.target.value })
                }
                aria-invalid={Boolean(errors?.fee)}
                aria-describedby={errors?.fee ? errorId("fee") : undefined}
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
            <FieldError id={errorId("fee")} message={errors?.fee} />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-sm font-medium text-divlab-text">
            Varje <span className="sr-only">kvot: </span>
            [gamla aktier] blir [nya aktier]
          </p>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor={fieldId("oldUnits")}
                className="mb-1.5 block text-sm font-medium text-divlab-text"
              >
                Gamla aktier
              </label>
              <input
                id={fieldId("oldUnits")}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={event.oldUnits}
                onChange={(changeEvent) =>
                  onChange({ ...event, oldUnits: changeEvent.target.value })
                }
                aria-invalid={Boolean(errors?.oldUnits)}
                aria-describedby={
                  errors?.oldUnits
                    ? errorId("oldUnits")
                    : fieldId("split-preview")
                }
                className={inputClassName}
                placeholder={
                  event.type === "reverseSplit" ? "5" : "1"
                }
              />
              <FieldError
                id={errorId("oldUnits")}
                message={errors?.oldUnits}
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={fieldId("newUnits")}
                className="mb-1.5 block text-sm font-medium text-divlab-text"
              >
                Nya aktier
              </label>
              <input
                id={fieldId("newUnits")}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={event.newUnits}
                onChange={(changeEvent) =>
                  onChange({ ...event, newUnits: changeEvent.target.value })
                }
                aria-invalid={Boolean(errors?.newUnits)}
                aria-describedby={
                  errors?.newUnits
                    ? errorId("newUnits")
                    : fieldId("split-preview")
                }
                className={inputClassName}
                placeholder={
                  event.type === "reverseSplit" ? "1" : "4"
                }
              />
              <FieldError
                id={errorId("newUnits")}
                message={errors?.newUnits}
              />
            </div>
          </div>
          <p
            id={fieldId("split-preview")}
            className="mt-3 rounded-xl border border-divlab-blue/20 bg-divlab-blue/[0.06] px-3 py-2.5 text-xs leading-5 text-divlab-text-secondary"
          >
            {splitPreview}
          </p>
          {hasFractionalUnits ? (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2.5 text-xs leading-5 text-amber-100">
              Bolaget eller mäklaren kan ha hanterat överskjutande andelar
              genom kontant ersättning. Den ersättningen ingår inte
              automatiskt i denna kalkyl.
            </p>
          ) : null}
        </div>
      )}
    </fieldset>
  );
}
