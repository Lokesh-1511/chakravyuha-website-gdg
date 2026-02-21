import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import GlassCard from './GlassCard';
import ClubModal from './ClubModal';
import { fetchCommunityEvents } from '../data/communityEventsClient';
import { Search, X, ChevronDown, Calendar } from 'lucide-react';
import ParsedDescription from '../utils/parsedDescription';

const CLUBS_API_URL = 'https://pdamit.in/api/persohub/clubs';

const ClubsSection = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventFinderOpen, setEventFinderOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedClubFilter, setSelectedClubFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [expandedEventKey, setExpandedEventKey] = useState(null);
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [posterLightbox, setPosterLightbox] = useState(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(CLUBS_API_URL, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch clubs: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected clubs API response');
      }
      setClubs(data);
    } catch (err) {
      setError(err?.message || 'Unable to load clubs');
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const data = await fetchCommunityEvents();
      setEvents(data);
    } catch (err) {
      setEventsError(err?.message || 'Unable to load events');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
    fetchEvents();
  }, [fetchClubs, fetchEvents]);

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
    (event) => String(event.communityKey || event.community_id || ''),
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

  const openEventFinder = () => {
    setEventFinderOpen(true);
    setExpandedEventKey(null);
    setOpenFilterMenu(null);
  };

  const closeEventFinder = () => {
    setEventFinderOpen(false);
    setExpandedEventKey(null);
    setOpenFilterMenu(null);
    setPosterLightbox(null);
  };

  const clearFilters = () => {
    setSelectedEventType('ALL');
    setSelectedClubFilter('ALL');
    setSelectedDateFilter('ALL');
    setOpenFilterMenu(null);
  };

  useEffect(() => {
    setOpenFilterMenu(null);
  }, [selectedEventType, selectedClubFilter, selectedDateFilter]);

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
                onClick={fetchEvents}
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
                          <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4">
                            <img
                              src={club.clubImage}
                              alt={club.clubName}
                              className="w-full h-full object-contain rounded-xl bg-white/5 p-2"
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

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={openEventFinder}
                className="mt-8 w-full p-4 md:p-5 rounded-2xl bg-black/50 border border-purple-500/30 hover:border-purple-400/60 transition-colors text-left"
                data-testid="open-event-finder"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">Find Your Event</p>
                      <p className="text-xs md:text-sm text-gray-400 truncate">
                        Browse all events with filters by type and club
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs text-purple-300 bg-purple-500/20 shrink-0">
                    {events.length} events
                  </span>
                </div>
              </motion.button>
            </>
          )}
        </div>
      </AnimatedSection>

      <AnimatePresence>
        {eventFinderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 p-4 pt-20 pb-6 overflow-y-auto"
            onClick={closeEventFinder}
            data-testid="event-finder-overlay"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl mx-auto rounded-2xl bg-[#09090d] border border-white/10 overflow-hidden"
              data-testid="event-finder-modal"
            >
              <div className="sticky top-0 z-10 bg-[#09090d]/95 backdrop-blur-md border-b border-white/10 p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-audiowide text-white">Find Your Event</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-gray-100 transition-colors"
                    >
                      Clear filters
                    </button>
                    <button
                      type="button"
                      onClick={closeEventFinder}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Close event finder"
                      data-testid="close-event-finder"
                    >
                      <X className="w-5 h-5 text-white" />
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
                      onClick={fetchEvents}
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
                  <div className="space-y-3">
                    {filteredEvents.map((event, index) => {
                      const eventKey = event.slug || event.event_code || `event-${index}`;
                      const isExpanded = expandedEventKey === eventKey;
                      const clubLabel = clubNameMap[getEventClubKey(event)] || String(event.community_id || 'Club');

                      return (
                        <div
                          key={eventKey}
                          className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                          data-testid={`event-finder-item-${eventKey}`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedEventKey(isExpanded ? null : eventKey)}
                            className="w-full text-left p-4 flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate">{event.title}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                                  {event.event_type || 'EVENT'}
                                </span>
                                <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200">
                                  {clubLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {event.dateLabel || 'Date TBA'}
                                </span>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                              {event.poster_url && (
                                <button
                                  type="button"
                                  className="block w-full max-w-md rounded-lg overflow-hidden border border-white/10 bg-black/30"
                                  onClick={() =>
                                    setPosterLightbox({
                                      src: event.poster_url,
                                      alt: event.title
                                    })
                                  }
                                  data-testid={`event-poster-open-${eventKey}`}
                                >
                                  <img
                                    src={event.poster_url}
                                    alt={event.title}
                                    className="w-full object-contain aspect-[5/4] hover:scale-[1.01] transition-transform"
                                  />
                                </button>
                              )}
                              <div className="text-sm text-gray-300 space-y-2">
                                <ParsedDescription
                                  text={event.description}
                                  emptyText="Description will be updated soon."
                                  listClassName="list-disc space-y-1 pl-5 text-gray-300"
                                />
                              </div>
                              {event.whatsapp_url ? (
                                <a
                                  href={event.whatsapp_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                                >
                                  Register Now
                                </a>
                              ) : (
                                <span className="inline-flex items-center px-3 py-2 rounded-full bg-white/10 text-gray-300 text-xs">
                                  Registration link unavailable
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
        onRetryEvents={fetchEvents}
      />
    </>
  );
};

export default ClubsSection;
