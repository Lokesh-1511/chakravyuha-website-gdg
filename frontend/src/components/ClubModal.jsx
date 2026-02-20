import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Code,
  Gamepad2,
  Wrench,
  Trophy,
  Calendar,
  ChevronDown,
  ExternalLink,
  Users,
  Sparkles
} from 'lucide-react';
import ParsedDescription from '../utils/parsedDescription';

const EVENT_TYPE_ORDER = [
  'HACKATHON',
  'TECHNICAL',
  'FUNTECHINICAL',
  'WORKSHOP',
  'SESSION',
  'EVENT',
  'SIGNATURE',
  'NONTECHINICAL'
];

const EVENT_TYPE_META = {
  TECHNICAL: { label: 'Technical', color: '#00f0ff', icon: Code },
  FUNTECHINICAL: { label: 'Fun Technical', color: '#ff0099', icon: Gamepad2 },
  WORKSHOP: { label: 'Workshop', color: '#7c3aed', icon: Wrench },
  HACKATHON: { label: 'Hackathon', color: '#fbbf24', icon: Trophy },
  SESSION: { label: 'Session', color: '#60a5fa', icon: Users },
  EVENT: { label: 'Event', color: '#34d399', icon: Calendar },
  SIGNATURE: { label: 'Signature', color: '#fb7185', icon: Sparkles },
  NONTECHINICAL: { label: 'Non Technical', color: '#f97316', icon: Gamepad2 }
};

function titleCaseEnum(value) {
  if (!value) return 'Other';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getEventTypeMeta(eventType) {
  return (
    EVENT_TYPE_META[eventType] || {
      label: titleCaseEnum(eventType),
      color: '#a78bfa',
      icon: Calendar
    }
  );
}

function getTeamSizeLabel(event) {
  if (event.participant_mode !== 'TEAM') {
    return 'Individual';
  }

  const min = event.team_min_size;
  const max = event.team_max_size;

  if (min && max) return `${min}-${max}`;
  if (min) return `${min}+`;
  if (max) return `Up to ${max}`;
  return 'Team';
}

const EventCard = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const typeMeta = getEventTypeMeta(event.event_type);
  const Icon = typeMeta.icon;
  const hasPoster = typeof event.poster_url === 'string' && event.poster_url.trim() !== '';

  const hasActionLink = Boolean(event.whatsapp_url);
  const actionLabel = 'Register Now';

  return (
    <motion.div
      layout
      className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
      style={{ borderColor: expanded ? `${typeMeta.color}40` : 'rgba(255,255,255,0.1)' }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full p-4 text-left flex items-start justify-between gap-4"
        data-testid={`event-${event.slug || event.event_code}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: `${typeMeta.color}25`, color: typeMeta.color }}
            >
              <Icon className="w-3 h-3" />
              {typeMeta.label}
            </span>
            <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-medium bg-white/10 text-gray-300">
              {event.format}
            </span>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                event.isOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {event.status}
            </span>
          </div>

          <h4 className="font-semibold text-white">{event.title}</h4>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {event.dateLabel}
            </span>
            <span>{event.participant_mode}</span>
            <span>{event.round_mode}</span>
            <span>{event.round_count} Round{event.round_count > 1 ? 's' : ''}</span>
            {event.participant_mode === 'TEAM' && (
              <span>Team {getTeamSizeLabel(event)}</span>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1"
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {hasPoster && (
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-full aspect-[5/4] object-contain rounded-lg border border-white/10 bg-black/30"
                />
              )}

              <ParsedDescription text={event.description} />

              {hasActionLink && (
                <a
                  href={event.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all"
                  style={{ background: typeMeta.color }}
                  data-testid={`register-${event.slug || event.event_code}`}
                >
                  {actionLabel}
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {!hasActionLink && (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 bg-white/10 cursor-not-allowed"
                >
                  Link unavailable
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ClubModal = ({ club, isOpen, onClose, events, eventsLoading, eventsError, onRetryEvents }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  const communityEvents = useMemo(
    () =>
      (events || []).filter(
        (event) =>
          String(event.communityKey || event.community_id || '') === String(club?.clubId || '')
      ),
    [club?.clubId, events]
  );

  const eventsByType = useMemo(() => {
    return communityEvents.reduce((acc, event) => {
      const type = event.event_type || 'EVENT';
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});
  }, [communityEvents]);

  const categories = useMemo(() => {
    const available = Object.keys(eventsByType);
    const ordered = EVENT_TYPE_ORDER.filter((type) => available.includes(type));
    const extras = available.filter((type) => !EVENT_TYPE_ORDER.includes(type)).sort();
    return [...ordered, ...extras];
  }, [eventsByType]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
      setActiveCategory(categories[0] || null);
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen, categories]);

  if (!club) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 pb-4 overflow-y-auto"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          onClick={onClose}
          data-testid="club-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(5, 5, 10, 0.98) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              boxShadow: '0 0 60px rgba(124, 58, 237, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="club-modal"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="close-modal-btn"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="relative p-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={club.clubImage || '/chakravyuha-logo.png'}
                  alt={club.clubName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain bg-white/10 p-2 shrink-0"
                />
                <div>
                  <h2 className="font-audiowide text-2xl text-white">{club.clubName}</h2>
                  <p className="text-purple-400 text-sm mt-1">{club.clubTagline || 'Community Events'}</p>
                </div>
              </div>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                {club.clubDescription || 'Explore events from this community.'}
              </p>
            </div>

            <div className="p-4 max-h-[62vh] overflow-y-auto">
              {eventsLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`event-skeleton-${idx}`}
                      className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {!eventsLoading && eventsError && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-5 text-center">
                  <p className="text-red-200 text-sm mb-3">{eventsError}</p>
                  <button
                    type="button"
                    onClick={onRetryEvents}
                    className="px-4 py-2 rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!eventsLoading && !eventsError && categories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No events available for this community yet.</p>
                </div>
              )}

              {!eventsLoading && !eventsError && categories.length > 0 && (
                <>
                  <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-white/10">
                    {categories.map((category) => {
                      const meta = getEventTypeMeta(category);
                      const Icon = meta.icon;
                      const isActive = activeCategory === category;

                      return (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                            ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                          `}
                          style={{
                            background: isActive ? `${meta.color}30` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isActive ? meta.color : 'transparent'}`
                          }}
                          data-testid={`category-${category}`}
                        >
                          <Icon className="w-4 h-4" style={{ color: isActive ? meta.color : 'inherit' }} />
                          {meta.label}
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
                            {eventsByType[category]?.length || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    {(eventsByType[activeCategory] || []).map((event) => (
                      <EventCard
                        key={event.slug || event.event_code}
                        event={event}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClubModal;
