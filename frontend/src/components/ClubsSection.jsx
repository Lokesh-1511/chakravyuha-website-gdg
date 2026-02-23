import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import GlassCard from './GlassCard';
import ClubModal from './ClubModal';
import { Search, X, ChevronDown, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import ParsedDescription from '../utils/parsedDescription';

const CLUBS_API_URL = 'https://pdamit.in/api/persohub/clubs';
const EVENTS_API_URL = 'https://pdamit.in/api/persohub/chakravyuha-26/events';
const EVENTS_PER_PAGE = 6;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function createDateLabel(startDate, endDate) {
  if (!startDate && !endDate) return 'Date TBA';
  if (startDate && endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  }
  return formatDate(startDate || endDate);
}

function normalizePosterUrl(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
    return null;
  }
  if (typeof value === 'object') {
    return typeof value.url === 'string' ? value.url : null;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizePosterUrl(parsed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeIdentity(value) {
  return toText(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeClubRecord(rawClub) {
  return {
    clubId: toText(rawClub?.clubId ?? rawClub?.club_id ?? rawClub?.id),
    clubName: rawClub?.clubName ?? rawClub?.club_name ?? 'Unknown Club',
    clubUrl: rawClub?.clubUrl ?? rawClub?.club_url ?? null,
    clubTagline: rawClub?.clubTagline ?? rawClub?.club_tagline ?? null,
    clubImage: rawClub?.clubImage ?? rawClub?.club_logo_url ?? rawClub?.clubLogoUrl ?? null,
    clubDescription: rawClub?.clubDescription ?? rawClub?.club_description ?? null,
    events: Array.isArray(rawClub?.events) ? rawClub.events : []
  };
}

function deriveOpenState(status, fallbackOpen) {
  if (typeof fallbackOpen === 'boolean') return fallbackOpen;

  const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (['open', 'published', 'live', 'active', 'registration_open', 'registrations_open'].includes(normalizedStatus)) {
    return true;
  }
  if (['closed', 'draft', 'archived', 'cancelled', 'completed', 'ended'].includes(normalizedStatus)) {
    return false;
  }
  return false;
}

function normalizeEventRecord(rawEvent, clubId) {
  const startDate = rawEvent?.start_date ?? rawEvent?.startDate ?? null;
  const endDate = rawEvent?.end_date ?? rawEvent?.endDate ?? null;
  const status = rawEvent?.status ?? '';
  const resolvedClubId = toText(rawEvent?.club_id ?? rawEvent?.clubId ?? clubId);
  const isOpen = deriveOpenState(status, rawEvent?.is_open ?? rawEvent?.isOpen);

  return {
    id: rawEvent?.id ?? rawEvent?.event_id ?? null,
    slug: rawEvent?.slug ?? '',
    event_code: rawEvent?.event_code ?? rawEvent?.eventCode ?? null,
    clubKey: resolvedClubId,
    community_id: resolvedClubId,
    communityKey: resolvedClubId,
    title: rawEvent?.title ?? rawEvent?.event_title ?? 'Untitled Event',
    description: rawEvent?.description ?? '',
    start_date: startDate,
    end_date: endDate,
    event_time: rawEvent?.event_time ?? rawEvent?.eventTime ?? null,
    poster_url: normalizePosterUrl(rawEvent?.poster_url ?? rawEvent?.posterUrl),
    whatsapp_url: rawEvent?.whatsapp_url ?? rawEvent?.whatsappUrl ?? null,
    external_url_name: rawEvent?.external_url_name ?? rawEvent?.externalUrlName ?? null,
    event_type: rawEvent?.event_type ?? rawEvent?.eventType ?? 'EVENT',
    format: rawEvent?.format ?? null,
    template_option: rawEvent?.template_option ?? rawEvent?.templateOption ?? null,
    participant_mode: rawEvent?.participant_mode ?? rawEvent?.participantMode ?? null,
    round_mode: rawEvent?.round_mode ?? rawEvent?.roundMode ?? null,
    round_count: rawEvent?.round_count ?? rawEvent?.roundCount ?? null,
    team_min_size: rawEvent?.team_min_size ?? rawEvent?.teamMinSize ?? null,
    team_max_size: rawEvent?.team_max_size ?? rawEvent?.teamMaxSize ?? null,
    is_visible: rawEvent?.is_visible ?? rawEvent?.isVisible ?? true,
    status: toText(status, isOpen ? 'open' : 'closed'),
    dateLabel: createDateLabel(startDate, endDate),
    isOpen
  };
}

function normalizeEventGroups(rawPayload, clubs) {
  if (!Array.isArray(rawPayload)) return [];

  const clubIdByName = new Map(
    clubs.map((club) => [normalizeIdentity(club.clubName), String(club.clubId)])
  );

  const groupedEvents = rawPayload.flatMap((group) => {
    const groupEvents = Array.isArray(group?.events) ? group.events : [];
    if (groupEvents.length === 0) return [];

    const groupClubIdRaw = toText(group?.club_id ?? group?.clubId);
    const nameMatchedClubId = clubIdByName.get(normalizeIdentity(group?.club_name ?? group?.clubName)) || '';
    const resolvedClubId = nameMatchedClubId || groupClubIdRaw;
    if (!resolvedClubId) return [];

    return groupEvents.map((event) =>
      normalizeEventRecord(
        {
          ...event,
          club_id: resolvedClubId
        },
        resolvedClubId
      )
    );
  });

  if (groupedEvents.length > 0) {
    return groupedEvents;
  }

  return rawPayload.map((event) => normalizeEventRecord(event, event?.club_id ?? event?.clubId ?? ''));
}

function parseJsonIfString(payload) {
  if (typeof payload !== 'string') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

const ClubsSection = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedClubFilter, setSelectedClubFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [posterLightbox, setPosterLightbox] = useState(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setEventsLoading(true);
    setError('');
    setEventsError('');
    try {
      const [clubsResponse, eventsResponse] = await Promise.all([
        fetch(CLUBS_API_URL, { method: 'GET' }),
        fetch(EVENTS_API_URL, { method: 'GET' })
      ]);

      if (!clubsResponse.ok) {
        throw new Error(`Failed to fetch clubs: ${clubsResponse.status}`);
      }
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
      }

      const clubsPayload = parseJsonIfString(await clubsResponse.json());
      const eventsPayload = parseJsonIfString(await eventsResponse.json());

      if (!Array.isArray(clubsPayload)) {
        throw new Error('Unexpected clubs API response');
      }

      const normalizedClubs = clubsPayload.map(normalizeClubRecord).filter((club) => club.clubId !== '');
      const inlineEvents = normalizedClubs
        .flatMap((club) => {
          return club.events.map((event) => normalizeEventRecord(event, club.clubId));
        })
        .filter((event) => event.is_visible !== false);
      const groupedEvents = normalizeEventGroups(eventsPayload, normalizedClubs).filter(
        (event) => event.is_visible !== false
      );
      const resolvedEvents = groupedEvents.length > 0 ? groupedEvents : inlineEvents;

      setClubs(normalizedClubs.map(({ events: _events, ...club }) => club));
      setEvents(resolvedEvents);
    } catch (err) {
      const message = err?.message || 'Unable to load clubs';
      setError(message);
      setEventsError(message);
      setClubs([]);
      setEvents([]);
    } finally {
      setLoading(false);
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const getClubWebsiteUrl = useCallback((club) => {
    const rawUrl = [
      club?.clubUrl,
      club?.clubURL,
      club?.clubWebsite,
      club?.clubLink,
      club?.websiteUrl,
      club?.website,
      club?.url
    ].find((value) => typeof value === 'string' && value.trim() !== '');

    if (!rawUrl) return '';

    const normalizedUrl = rawUrl.trim();
    if (/^https?:\/\//i.test(normalizedUrl)) return normalizedUrl;
    return `https://${normalizedUrl}`;
  }, []);

  const handleClubClick = (club) => {
    const clubWebsiteUrl = getClubWebsiteUrl(club);
    if (clubWebsiteUrl) {
      window.location.assign(clubWebsiteUrl);
      return;
    }

    setSelectedClub(club);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedClub(null), 300);
  };

  const getEventClubKey = useCallback(
    (event) => String(event.clubKey || event.club_id || event.communityKey || event.community_id || ''),
    []
  );

  const clubNameMap = useMemo(() => {
    return clubs.reduce((acc, club) => {
      acc[String(club.clubId)] = club.clubName;
      return acc;
    }, {});
  }, [clubs]);

  const eventTypeOptions = useMemo(() => {
    const types = Array.from(new Set((events || []).map((event) => event.event_type).filter(Boolean)));
    return types.sort((a, b) => a.localeCompare(b));
  }, [events]);

  const clubFilterOptions = useMemo(() => {
    return clubs
      .map((club) => ({
        key: String(club.clubId),
        label: club.clubName
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clubs]);

  const dateFilterOptions = useMemo(() => {
    const map = new Map();

    (events || []).forEach((event) => {
      const label = event.dateLabel;
      if (typeof label !== 'string' || label.trim() === '') return;

      const startDate = event.start_date ? new Date(`${event.start_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      const existing = map.get(label);
      if (!existing || startDate < existing.sortKey) {
        map.set(label, { label, sortKey: Number.isNaN(startDate) ? Number.MAX_SAFE_INTEGER : startDate });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => a.sortKey - b.sortKey || a.label.localeCompare(b.label))
      .map((item) => item.label);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return (events || []).filter((event) => {
      const typeMatch = selectedEventType === 'ALL' || event.event_type === selectedEventType;
      const clubMatch = selectedClubFilter === 'ALL' || getEventClubKey(event) === selectedClubFilter;
      const dateMatch = selectedDateFilter === 'ALL' || event.dateLabel === selectedDateFilter;
      return typeMatch && clubMatch && dateMatch;
    });
  }, [events, selectedEventType, selectedClubFilter, selectedDateFilter, getEventClubKey]);

  const clubsWithEvents = useMemo(() => {
    const eventClubKeys = new Set((events || []).map((event) => getEventClubKey(event)));
    return clubs.filter((club) => eventClubKeys.has(String(club.clubId)));
  }, [clubs, events, getEventClubKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE)),
    [filteredEvents.length]
  );

  const paginatedEvents = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [filteredEvents, currentPage, totalPages]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) items.push('left-ellipsis');
    for (let page = windowStart; page <= windowEnd; page += 1) {
      items.push(page);
    }
    if (windowEnd < totalPages - 1) items.push('right-ellipsis');
    items.push(totalPages);

    return items;
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSelectedEventType('ALL');
    setSelectedClubFilter('ALL');
    setSelectedDateFilter('ALL');
    setSelectedEvent(null);
    setCurrentPage(1);
    setOpenFilterMenu(null);
  };

  useEffect(() => {
    setOpenFilterMenu(null);
    setSelectedEvent(null);
    setCurrentPage(1);
  }, [selectedEventType, selectedClubFilter, selectedDateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!openFilterMenu) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-filter-dropdown]')) return;
      setOpenFilterMenu(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [openFilterMenu]);

  return (
    <>
      <AnimatedSection id="clubs" className="py-20 md:py-32">
        <div className="container-custom">
          <h2 className="section-title" data-testid="clubs-title">OUR CLUBS</h2>
          <p className="section-subtitle">Explore our diverse community of tech enthusiasts</p>

          {(loading || eventsLoading) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`club-skeleton-${idx}`}
                  className="h-48 md:h-56 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-5 text-center">
              <p className="text-red-200 text-sm mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchClubs}
                className="px-4 py-2 rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !eventsLoading && !error && eventsError && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-5 text-center">
              <p className="text-red-200 text-sm mb-3">{eventsError}</p>
              <button
                type="button"
                onClick={fetchClubs}
                className="px-4 py-2 rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !eventsLoading && !error && !eventsError && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {clubsWithEvents.map((club, index) => {
                  const clubWebsiteUrl = getClubWebsiteUrl(club);
                  return (
                    <motion.div
                      key={club.clubId}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <GlassCard
                        onClick={() => handleClubClick(club)}
                        className="p-4 md:p-6 h-full"
                        glow
                        testId={`club-card-${club.clubId}`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4">
                            <img
                              src={club.clubImage}
                              alt={club.clubName}
                              className="w-full h-full object-contain rounded-xl bg-white/5 p-1.5"
                            />
                            <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h3 className="font-semibold text-white text-sm md:text-base mb-1 line-clamp-1">
                            {club.clubName}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 hidden sm:block">
                            {club.clubTagline}
                          </p>
                          <span className="mt-3 px-3 py-1 text-xs text-purple-300 bg-purple-500/20 rounded-full">
                            {clubWebsiteUrl ? 'Visit Website' : 'View Events'}
                          </span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {clubsWithEvents.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-gray-300">
                  No clubs with active events are available right now.
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-8 rounded-2xl bg-[#09090d] border border-white/10 overflow-visible"
                data-testid="event-finder-inline"
              >
                <div className="border-b border-white/10 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Search className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl md:text-2xl font-audiowide text-white">Find Your Event</h3>
                        <p className="text-xs md:text-sm text-gray-400">
                          Browse all events with filters by type and club
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-full text-xs text-purple-300 bg-purple-500/20 shrink-0">
                        {events.length} events
                      </span>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-gray-100 transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="text-xs text-gray-300">
                      <p>Event Type</p>
                      <div className="relative mt-1" data-filter-dropdown>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFilterMenu((prev) => (prev === 'eventType' ? null : 'eventType'))
                          }
                          className="w-full rounded-xl bg-[#13131b] border border-purple-500/30 px-3 py-2.5 text-sm text-white flex items-center justify-between hover:border-purple-400 transition-colors"
                          data-testid="filter-event-type"
                        >
                          <span className="truncate">{selectedEventType === 'ALL' ? 'All Types' : selectedEventType}</span>
                          <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${openFilterMenu === 'eventType' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilterMenu === 'eventType' && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-purple-500/30 bg-[#11111a] shadow-[0_12px_30px_rgba(0,0,0,0.45)] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEventType('ALL');
                                setOpenFilterMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                selectedEventType === 'ALL' ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                              }`}
                            >
                              All Types
                            </button>
                            {eventTypeOptions.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setSelectedEventType(type);
                                  setOpenFilterMenu(null);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                  selectedEventType === type ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-300">
                      <p>Club</p>
                      <div className="relative mt-1" data-filter-dropdown>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFilterMenu((prev) => (prev === 'club' ? null : 'club'))
                          }
                          className="w-full rounded-xl bg-[#13131b] border border-purple-500/30 px-3 py-2.5 text-sm text-white flex items-center justify-between hover:border-purple-400 transition-colors"
                          data-testid="filter-club"
                        >
                          <span className="truncate">
                            {selectedClubFilter === 'ALL'
                              ? 'All Clubs'
                              : (clubFilterOptions.find((club) => club.key === selectedClubFilter)?.label || 'All Clubs')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${openFilterMenu === 'club' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilterMenu === 'club' && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-purple-500/30 bg-[#11111a] shadow-[0_12px_30px_rgba(0,0,0,0.45)] overflow-hidden max-h-64 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClubFilter('ALL');
                                setOpenFilterMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                selectedClubFilter === 'ALL' ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                              }`}
                            >
                              All Clubs
                            </button>
                            {clubFilterOptions.map((clubOption) => (
                              <button
                                key={clubOption.key}
                                type="button"
                                onClick={() => {
                                  setSelectedClubFilter(clubOption.key);
                                  setOpenFilterMenu(null);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                  selectedClubFilter === clubOption.key ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                                }`}
                              >
                                {clubOption.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-300">
                      <p>Date</p>
                      <div className="relative mt-1" data-filter-dropdown>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFilterMenu((prev) => (prev === 'date' ? null : 'date'))
                          }
                          className="w-full rounded-xl bg-[#13131b] border border-purple-500/30 px-3 py-2.5 text-sm text-white flex items-center justify-between hover:border-purple-400 transition-colors"
                          data-testid="filter-date"
                        >
                          <span className="truncate">
                            {selectedDateFilter === 'ALL' ? 'All Dates' : selectedDateFilter}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${openFilterMenu === 'date' ? 'rotate-180' : ''}`} />
                        </button>
                        {openFilterMenu === 'date' && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-purple-500/30 bg-[#11111a] shadow-[0_12px_30px_rgba(0,0,0,0.45)] overflow-hidden max-h-64 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDateFilter('ALL');
                                setOpenFilterMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                selectedDateFilter === 'ALL' ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                              }`}
                            >
                              All Dates
                            </button>
                            {dateFilterOptions.map((dateOption) => (
                              <button
                                key={dateOption}
                                type="button"
                                onClick={() => {
                                  setSelectedDateFilter(dateOption);
                                  setOpenFilterMenu(null);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                  selectedDateFilter === dateOption ? 'bg-purple-500/20 text-white' : 'text-gray-200 hover:bg-white/10'
                                }`}
                              >
                                {dateOption}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {eventsLoading && (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={`event-finder-skeleton-${idx}`}
                          className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                        />
                      ))}
                    </div>
                  )}

                  {!eventsLoading && eventsError && (
                    <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-5 text-center">
                      <p className="text-red-200 text-sm mb-3">{eventsError}</p>
                      <button
                        type="button"
                        onClick={fetchClubs}
                        className="px-4 py-2 rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-gray-300">
                      No events match the selected filters.
                    </div>
                  )}

                  {!eventsLoading && !eventsError && filteredEvents.length > 0 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {paginatedEvents.map((event, index) => {
                          const eventKey = event.slug || event.event_code || `event-${index}`;
                          const clubLabel = clubNameMap[getEventClubKey(event)] || String(event.community_id || 'Club');
                          const hasPoster = typeof event.poster_url === 'string' && event.poster_url.trim() !== '';

                          return (
                            <motion.button
                              key={eventKey}
                              type="button"
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedEvent(event)}
                              className="group w-full rounded-xl border border-white/10 bg-white/[0.03] text-left p-3 md:p-4 hover:border-purple-400/60 transition-colors"
                              data-testid={`event-finder-item-${eventKey}`}
                            >
                              {hasPoster && (
                                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30 aspect-[5/4]">
                                  <img
                                    src={event.poster_url}
                                    alt={event.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                </div>
                              )}

                              <div className={`${hasPoster ? 'mt-3' : ''} min-w-0`}>
                                <p className="text-white text-sm font-semibold line-clamp-2">{event.title}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                                    {event.event_type || 'EVENT'}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 line-clamp-1">
                                    {clubLabel}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400 inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {event.dateLabel || 'Date TBA'}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                          <p className="text-xs text-gray-400">
                            Page {currentPage} of {totalPages}
                          </p>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-gray-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label="Previous page"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {paginationItems.map((item, index) =>
                              typeof item === 'number' ? (
                                <button
                                  key={`page-${item}`}
                                  type="button"
                                  onClick={() => setCurrentPage(item)}
                                  className={`h-8 min-w-8 px-2 rounded-lg text-xs border transition-colors ${
                                    currentPage === item
                                      ? 'bg-purple-500/30 border-purple-400/60 text-white'
                                      : 'border-white/10 text-gray-200 hover:bg-white/10'
                                  }`}
                                >
                                  {item}
                                </button>
                              ) : (
                                <span
                                  key={`ellipsis-${item}-${index}`}
                                  className="h-8 min-w-8 px-2 inline-flex items-center justify-center text-gray-500 text-xs"
                                >
                                  ...
                                </span>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-gray-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              aria-label="Next page"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </AnimatedSection>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/90 p-3 sm:p-4 flex items-center justify-center"
            onClick={() => setSelectedEvent(null)}
            data-testid="event-details-modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-purple-400/30 bg-[#0d0d14] p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto"
              data-testid="event-details-modal"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-lg md:text-xl font-semibold break-words">
                    {selectedEvent.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                      {selectedEvent.event_type || 'EVENT'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200">
                      {clubNameMap[getEventClubKey(selectedEvent)] || String(selectedEvent.community_id || 'Club')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {selectedEvent.dateLabel || 'Date TBA'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                  aria-label="Close event details"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {selectedEvent.poster_url && (
                <button
                  type="button"
                  className="mt-4 block w-full rounded-xl overflow-hidden border border-white/10 bg-black/30"
                  onClick={() =>
                    setPosterLightbox({
                      src: selectedEvent.poster_url,
                      alt: selectedEvent.title
                    })
                  }
                  data-testid={`event-poster-open-${selectedEvent.slug || selectedEvent.event_code || 'active'}`}
                >
                  <img
                    src={selectedEvent.poster_url}
                    alt={selectedEvent.title}
                    className="w-full object-contain max-h-[320px] sm:max-h-[360px] hover:scale-[1.01] transition-transform"
                  />
                </button>
              )}

              <div className="mt-4 text-sm text-gray-300 space-y-2">
                <ParsedDescription
                  text={selectedEvent.description}
                  emptyText="Description will be updated soon."
                  listClassName="list-disc space-y-1 pl-5 text-gray-300"
                />
              </div>

              {selectedEvent.whatsapp_url ? (
                <a
                  href={selectedEvent.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                >
                  Register Now
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="mt-5 inline-flex items-center px-3 py-2 rounded-full bg-white/10 text-gray-300 text-xs">
                  Registration link unavailable
                </span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {posterLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 p-4 flex items-center justify-center"
            onClick={() => setPosterLightbox(null)}
            data-testid="event-poster-lightbox"
          >
            <button
              type="button"
              onClick={() => setPosterLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close poster preview"
              data-testid="event-poster-lightbox-close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={posterLightbox.src}
              alt={posterLightbox.alt}
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Club Modal */}
      <ClubModal
        club={selectedClub}
        isOpen={modalOpen}
        onClose={closeModal}
        events={events}
        eventsLoading={eventsLoading}
        eventsError={eventsError}
        onRetryEvents={fetchClubs}
      />
    </>
  );
};

export default ClubsSection;
