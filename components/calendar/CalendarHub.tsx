"use client";

import { useMemo, useState } from "react";
import type { CalendarView, PortfolioFilterMode } from "@/types/calendar";
import {
  portfolioEventService,
  searchEventService,
  timelineEventService,
  toCalendarEvents,
  toCompanySearchResult,
  toDailyOverviewMetric,
  toIntelligenceItems,
  toPortfolioChanges,
  toTodaysHighlight,
  toUpcomingDividendPayment,
} from "@/lib/events";
import BrainSummaryPlaceholder from "./BrainSummaryPlaceholder";
import DailyOverview from "./DailyOverview";
import PortfolioCalendar from "./PortfolioCalendar";
import PortfolioFilter from "./PortfolioFilter";
import PortfolioIntelligence from "./PortfolioIntelligence";
import RecentPortfolioChanges from "./RecentPortfolioChanges";
import TodaysHighlight from "./TodaysHighlight";
import UpcomingDividendsCard from "./UpcomingDividendsCard";

export default function CalendarHub() {
  const [view, setView] = useState<CalendarView>("week");
  const [filterMode, setFilterMode] = useState<PortfolioFilterMode>("portfolio");
  const [referenceDate, setReferenceDate] = useState(
    timelineEventService.getReferenceDate(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const portfolioOnly = filterMode === "portfolio";

  const dailyOverviewMetrics = useMemo(
    () =>
      portfolioEventService
        .getDailyOverview(referenceDate)
        .map(toDailyOverviewMetric),
    [referenceDate],
  );

  const todaysHighlight = useMemo(() => {
    const highlight = portfolioEventService.getTodaysHighlight();
    return highlight ? toTodaysHighlight(highlight) : null;
  }, []);

  const filteredEvents = useMemo(
    () => toCalendarEvents(timelineEventService.getTimelineEvents(portfolioOnly)),
    [portfolioOnly],
  );

  const filteredIntelligence = useMemo(
    () =>
      toIntelligenceItems(portfolioEventService.getIntelligenceFeed(portfolioOnly)),
    [portfolioOnly],
  );

  const filteredChanges = useMemo(
    () =>
      toPortfolioChanges(portfolioEventService.getRecentChanges(portfolioOnly)),
    [portfolioOnly],
  );

  const upcomingDividendPayments = useMemo(
    () =>
      portfolioEventService
        .getUpcomingDividendPayments()
        .map(toUpcomingDividendPayment),
    [],
  );

  const companySearchIndex = useMemo(
    () => searchEventService.getSearchIndex().map(toCompanySearchResult),
    [],
  );

  const handleSelectDate = (date: string) => {
    setReferenceDate(date);
    setView("day");
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId);

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
            Investeraröversikt
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
            Kalender
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Vad behöver du veta idag?
          </p>
        </div>

        <PortfolioFilter mode={filterMode} onChange={setFilterMode} />
      </header>

      <DailyOverview metrics={dailyOverviewMetrics} />

      {todaysHighlight && <TodaysHighlight highlight={todaysHighlight} />}

      <BrainSummaryPlaceholder />

      <PortfolioCalendar
        events={filteredEvents}
        view={view}
        onViewChange={setView}
        referenceDate={referenceDate}
        onSelectDate={handleSelectDate}
        onEventSelect={handleEventSelect}
      />

      <PortfolioIntelligence
        items={filteredIntelligence}
        searchIndex={companySearchIndex}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingDividendsCard payments={upcomingDividendPayments} />
        <RecentPortfolioChanges changes={filteredChanges} />
      </div>

      {selectedEvent && (
        <section className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#D4AF37]">
            Förhandsvisning av händelse
          </p>
          <p className="mt-1.5 text-sm text-white">
            {selectedEvent.company} · {selectedEvent.ticker}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Detaljvy kommer i en framtida version.
          </p>
        </section>
      )}
    </div>
  );
}
