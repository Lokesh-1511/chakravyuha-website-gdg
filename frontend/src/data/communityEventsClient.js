const EVENTS_API_URL = 'https://pdamit.in/api/persohub/chakravyuha-26/events';

const COMMUNITY_ID_NAME_MAP = {
  'qcmit': 'QCMIT',
  'ausec-mit': 'AUSEC MIT',
  'mitra': 'MITRA',
  'mit-met': 'MIT MeT',
  'raptors-club': 'Raptors Club',
  'tedcmit': 'TEDcMIT',
  'csmit': 'CSMIT',
  'pda-mit': 'PDA MIT',
  'brc-mit': 'BRC MIT'
};

const COMMUNITY_NAME_TO_ID = Object.entries(COMMUNITY_ID_NAME_MAP).reduce((acc, [id, name]) => {
  acc[name.toLowerCase()] = id;
  return acc;
}, {});

const PASSTHROUGH_FIELDS = [
  'slug',
  'event_code',
  'community_id',
  'community_name',
  'title',
  'description',
  'start_date',
  'end_date',
  'poster_url',
  'whatsapp_url',
  'external_url_name',
  'event_type',
  'format',
  'template_option',
  'participant_mode',
  'round_mode',
  'round_count',
  'team_min_size',
  'team_max_size',
  'is_visible',
  'status'
];

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

function normalizeEvent(rawEvent) {
  const normalized = {};

  PASSTHROUGH_FIELDS.forEach((field) => {
    normalized[field] = rawEvent?.[field] ?? null;
  });

  const rawCommunity = normalized.community_id;
  const rawCommunityKey = rawCommunity === null || rawCommunity === undefined ? '' : String(rawCommunity);
  const directIdMatch = COMMUNITY_ID_NAME_MAP[rawCommunityKey] ? rawCommunityKey : '';
  const nameMappedId = COMMUNITY_NAME_TO_ID[rawCommunityKey.toLowerCase()] || '';

  normalized.communityKey = directIdMatch || nameMappedId || rawCommunityKey;

  normalized.dateLabel = createDateLabel(normalized.start_date, normalized.end_date);
  const status = typeof normalized.status === 'string' ? normalized.status.trim().toLowerCase() : '';
  normalized.isOpen = ['open', 'published', 'live', 'active', 'registration_open', 'registrations_open'].includes(status);
  normalized.poster_url = normalizePosterUrl(normalized.poster_url);

  return normalized;
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

  // API may return poster_url as a JSON stringified array/object.
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

export async function fetchCommunityEvents() {
  const response = await fetch(EVENTS_API_URL, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const payload = await response.json();
  const candidateArrays = [
    payload,
    payload?.community_events,
    payload?.communityEvents,
    payload?.events,
    payload?.clubEvents,
    payload?.data?.community_events,
    payload?.data?.communityEvents,
    payload?.data?.events,
    payload?.data?.clubEvents
  ];

  const eventList = candidateArrays.find((value) => Array.isArray(value)) || [];

  return eventList
    .map(normalizeEvent)
    .filter((event) => event.is_visible === true);
}

export { EVENTS_API_URL };
