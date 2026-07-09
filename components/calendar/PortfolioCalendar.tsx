"use client";

import { useMemo } from "react";
import type { CalendarEvent, CalendarView } from "@/types/calendar";
import {
  calendarEventTypeAbbrev,
  calendarEventTypeLabels,
} from "@/lib/events";
import {
  getMonthMatrix,
  getWeekDays,
  isSameDay,
  parseISODate,
  toISODate,
} from "@/lib/utils/calendar";

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"] as const;

function formatDayHeading(date: Date): string {
  return date.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("sv-SE", {
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

type Props = {
  events: CalendarEvent[];
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  referenceDate: string;
  onSelectDate: (date: string) => void;
  onEventSelect: (eventId: string) => void;
};

const viewOptions: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Dag" },
  { value: "week", label: "Vecka" },
  { value: "month", label: "Månad" },
];

function EventDensityIndicator({ count }: { count: number }) {
  const visibleBars = Math.min(count, 4);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: visibleBars }, (_, index) => (
        <span
          key={index}
          className={`h-1 rounded-full ${
            index === 0 ? "w-3 bg-divlab-blue/45" : "w-2 bg-white/15"
          }`}
        />
      ))}
      {count > 4 && (
        <span className="ml-0.5 text-[9px] text-gray-600">+{count - 4}</span>
      )}
    </div>
  );
}

export default function PortfolioCalendar({
  events,
  view,
  onViewChange,
  referenceDate,
  onSelectDate,
  onEventSelect,
}: Props) {
  const activeDate = parseISODate(referenceDate);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const existing = grouped.get(event.date) ?? [];
      existing.push(event);
      grouped.set(event.date, existing);
    }

    return grouped;
  }, [events]);

  const monthMatrix = getMonthMatrix(activeDate);
  const weekDays = getWeekDays(activeDate);
  const dayEvents = eventsByDate.get(referenceDate) ?? [];

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="divlab-section-label text-[10px] tracking-[0.22em]">
            Portföljkalender
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-divlab-text">
            {view === "day"
              ? formatDayHeading(activeDate)
              : view === "week"
                ? `Vecka från ${formatShortDate(weekDays[0])}`
                : formatMonthYear(activeDate)}
          </h2>
        </div>

        <div className="flex rounded-xl border divlab-border-neutral bg-divlab-surface p-1">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                view === option.value
                  ? "divlab-selected"
                  : "text-divlab-text-muted hover:text-divlab-text-secondary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divlab-card p-4">
        {view === "month" && (
          <div className="overflow-hidden rounded-xl border divlab-border-neutral">
            <div className="grid grid-cols-7 border-b divlab-border-neutral bg-divlab-surface">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthMatrix.flat().map((date) => {
                const isoDate = toISODate(date);
                const dayEventsForCell = eventsByDate.get(isoDate) ?? [];
                const inCurrentMonth = date.getMonth() === activeDate.getMonth();
                const isToday = isSameDay(date, activeDate);
                const hasEvents = dayEventsForCell.length > 0;

                return (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => onSelectDate(isoDate)}
                    className={`relative min-h-[76px] border-b border-r divlab-border-neutral p-2 text-left transition-colors duration-300 hover:bg-white/[0.04] ${
                      inCurrentMonth ? "text-divlab-text" : "text-divlab-text-subtle"
                    } ${isToday ? "bg-divlab-blue/[0.06]" : "bg-divlab-card"}`}
                  >
                    {hasEvents && (
                      <span className="absolute bottom-0 left-0 top-0 w-px bg-divlab-blue/25" />
                    )}

                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          isToday ? "text-divlab-blue" : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {hasEvents && (
                        <span className="text-[9px] text-gray-600 tabular-nums">
                          {dayEventsForCell.length}
                        </span>
                      )}
                    </div>

                    {hasEvents && (
                      <div className="mt-1.5 space-y-1">
                        <EventDensityIndicator count={dayEventsForCell.length} />
                        {dayEventsForCell.slice(0, 2).map((event) => (
                          <p
                            key={event.id}
                            className="truncate text-[9px] leading-4 text-gray-500"
                          >
                            <span className="text-gray-600">
                              {calendarEventTypeAbbrev[event.type]}
                            </span>{" "}
                            {event.ticker}
                          </p>
                        ))}
                        {dayEventsForCell.length > 2 && (
                          <p className="text-[9px] text-gray-600">
                            +{dayEventsForCell.length - 2} till
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-7">
            {weekDays.map((date) => {
              const isoDate = toISODate(date);
              const dayEventsForCell = eventsByDate.get(isoDate) ?? [];
              const isToday = isSameDay(date, activeDate);

              return (
                <div
                  key={isoDate}
                  className={`rounded-xl border p-3 ${
                    isToday
                      ? "border-divlab-blue/30 bg-divlab-blue/[0.05]"
                      : "border-transparent bg-divlab-surface"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDate(isoDate)}
                    className="mb-2.5 text-left"
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
                      {date.toLocaleDateString("sv-SE", { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white tabular-nums">
                      {formatShortDate(date)}
                    </p>
                  </button>

                  <div className="space-y-1.5">
                    {dayEventsForCell.length === 0 ? (
                      <p className="text-[11px] text-gray-600">Inga händelser</p>
                    ) : (
                      dayEventsForCell.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onEventSelect(event.id)}
                          className="block w-full rounded-lg border divlab-border-neutral bg-divlab-card px-2 py-2 text-left transition-all duration-300 hover:border-divlab-blue/30"
                        >
                          <p className="text-[10px] font-medium text-divlab-blue">
                            {event.ticker}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-4 text-gray-500">
                            {calendarEventTypeAbbrev[event.type]}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-4 text-gray-300">
                            {calendarEventTypeLabels[event.type]}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "day" && (
          <div className="space-y-2">
            {dayEvents.length === 0 ? (
              <p className="rounded-xl border divlab-border-neutral bg-divlab-surface px-4 py-5 text-sm text-divlab-text-muted">
                Inga portföljhändelser planerade denna dag.
              </p>
            ) : (
              dayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventSelect(event.id)}
                  className="flex w-full items-start justify-between gap-4 rounded-xl border divlab-border-neutral bg-divlab-surface px-4 py-3 text-left transition-all duration-300 hover:border-divlab-blue/30"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {event.company}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{event.ticker}</p>
                    <p className="mt-2 text-sm text-gray-300">
                      {calendarEventTypeLabels[event.type]}
                    </p>
                  </div>
                  {event.time && (
                    <span className="text-xs text-gray-500 tabular-nums">
                      {event.time}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
