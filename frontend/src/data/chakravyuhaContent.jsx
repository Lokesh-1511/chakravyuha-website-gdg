import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CONTENT_URL = 'https://pdamit.in/api/persohub/chakravyuha-26';

const SECTION_DEFAULTS = {
  hero: {},
  aboutChakravyuha: {},
  aboutMIT: { highlights: [] },
  eventPass: { tiers: [] },
  services: { items: [] },
  gallery: { images: [] },
  faq: { items: [] },
  reachUs: {
    address: {},
    busInfo: {},
    instructions: []
  },
  contact: {
    socials: {},
    coordinators: []
  },
  footer: { links: [] }
};

const SECTION_ALIASES = {
  hero: ['hero', 'landing', 'home'],
  aboutChakravyuha: ['aboutChakravyuha', 'about_event', 'aboutEvent', 'aboutFestival'],
  aboutMIT: ['aboutMIT', 'aboutInstitute', 'aboutCollege'],
  eventPass: ['eventPass', 'passes', 'event_pass'],
  services: ['services', 'hospitality', 'serviceAndHospitality'],
  gallery: ['gallery', 'photos', 'media'],
  faq: ['faq', 'faqs'],
  reachUs: ['reachUs', 'reach', 'location'],
  contact: ['contact', 'contacts'],
  footer: ['footer', 'footnote']
};

const ROOT_PATHS = [
  [],
  ['data'],
  ['payload'],
  ['content'],
  ['result'],
  ['sections'],
  ['data', 'content'],
  ['data', 'payload'],
  ['data', 'sections']
];

const defaultContext = {
  content: SECTION_DEFAULTS,
  loading: true,
  error: null,
  refresh: () => {}
};

const ChakravyuhaContentContext = createContext(defaultContext);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getByPath(source, path) {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

function arrayToObject(input) {
  if (!Array.isArray(input)) {
    return input;
  }

  const mapped = input.reduce((acc, item) => {
    if (!isObject(item)) return acc;
    const key = item.section || item.sectionKey || item.slug || item.key || item.name;
    const value = item.content || item.data || item.value;
    if (typeof key === 'string' && key.length > 0 && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return Object.keys(mapped).length > 0 ? mapped : input;
}

function deepMerge(base, incoming) {
  if (incoming === undefined || incoming === null) return base;
  if (Array.isArray(incoming)) return incoming;
  if (!isObject(base)) return incoming;
  if (!isObject(incoming)) return incoming;

  const merged = { ...base };

  Object.keys(incoming).forEach((key) => {
    merged[key] = deepMerge(base[key], incoming[key]);
  });

  return merged;
}

function resolveSectionFromSource(source, sectionKey) {
  if (!isObject(source)) return undefined;
  const aliases = SECTION_ALIASES[sectionKey] || [sectionKey];

  for (const alias of aliases) {
    if (source[alias] !== undefined) {
      return source[alias];
    }
  }

  return undefined;
}

function resolvePayload(rawResponse) {
  const response = arrayToObject(rawResponse);
  const candidates = [];

  for (const path of ROOT_PATHS) {
    const value = path.length === 0 ? response : getByPath(response, path);
    const normalized = arrayToObject(value);
    if (isObject(normalized)) {
      candidates.push(normalized);
    }
  }

  if (candidates.length === 0) {
    return {};
  }

  // Pick the object that matches the most known sections.
  const scored = candidates
    .map((candidate) => {
      let score = 0;
      Object.keys(SECTION_ALIASES).forEach((sectionKey) => {
        if (resolveSectionFromSource(candidate, sectionKey) !== undefined) {
          score += 1;
        }
      });
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0].candidate;
}

function normalizeContent(rawResponse) {
  const payload = resolvePayload(rawResponse);
  const normalized = { ...SECTION_DEFAULTS };
  const nestedCandidates = [payload.sections, payload.content, payload.data].filter(isObject);

  Object.keys(SECTION_DEFAULTS).forEach((sectionKey) => {
    let incoming = resolveSectionFromSource(payload, sectionKey);

    if (incoming === undefined) {
      for (const nested of nestedCandidates) {
        incoming = resolveSectionFromSource(nested, sectionKey);
        if (incoming !== undefined) break;
      }
    }

    normalized[sectionKey] = deepMerge(SECTION_DEFAULTS[sectionKey], incoming);
  });

  return normalized;
}

export function ChakravyuhaContentProvider({ children }) {
  const [content, setContent] = useState(SECTION_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(CONTENT_URL, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }

      const raw = await response.json();
      setContent(normalizeContent(raw));
    } catch (err) {
      setError(err?.message || 'Failed to fetch content');
      setContent(SECTION_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ content, loading, error, refresh }),
    [content, loading, error, refresh]
  );

  return (
    <ChakravyuhaContentContext.Provider value={value}>
      {children}
    </ChakravyuhaContentContext.Provider>
  );
}

export function useChakravyuhaContent() {
  return useContext(ChakravyuhaContentContext);
}

export function useContentSection(sectionKey) {
  const { content } = useChakravyuhaContent();
  return content?.[sectionKey] ?? SECTION_DEFAULTS?.[sectionKey] ?? {};
}
