import { CHENNAI_AREAS, NEARBY_TOWNS } from "@/content/chennaiAreas";

export type PlaceSuggestion = {
  id: string;
  /** Bold part, e.g. "Karapakkam". */
  main: string;
  /** Muted part, e.g. "Chennai, Tamil Nadu, India". */
  secondary: string;
  /** What gets written into the field when this is chosen. */
  full: string;
};

export type PlaceSearchResult = {
  suggestions: PlaceSuggestion[];
  /** Google's terms require showing its attribution next to its predictions. */
  fromGoogle: boolean;
};

// NEXT_PUBLIC_ values are inlined at BUILD time and must be read with this exact
// literal expression. Adding or changing the key in Vercel therefore needs a
// redeploy before it takes effect.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

export const GOOGLE_PLACES_ENABLED = Boolean(API_KEY);

const ENDPOINT = "https://places.googleapis.com/v1/places:autocomplete";

/** Bias (not restrict) results toward Chennai; the API caps the radius at 50 km. */
const CHENNAI_BIAS = {
  circle: { center: { latitude: 13.0827, longitude: 80.2707 }, radius: 50000 },
};

/**
 * Fewer characters than this and the results are mostly noise, and every request
 * above the monthly free allowance is billed, so wait for something specific.
 */
const MIN_GOOGLE_CHARS = 3;

/**
 * Set once Google rejects or fails a request (bad key, quota used up, referrer
 * not allowed, network/CORS error). Every later keystroke then goes straight to
 * the local list instead of retrying a call that will keep failing, and the form
 * never breaks.
 */
let googleUnavailable = false;

const cache = new Map<string, PlaceSuggestion[]>();

/** Everything the offline list can suggest, built once. */
const LOCAL_PLACES: PlaceSuggestion[] = [
  { id: "local-chennai", main: "Chennai", secondary: "Tamil Nadu", full: "Chennai, Tamil Nadu" },
  ...CHENNAI_AREAS.map((area) => ({
    id: `local-${area}`,
    main: area,
    secondary: "Chennai, Tamil Nadu",
    full: `${area}, Chennai`,
  })),
  ...NEARBY_TOWNS.map((town) => ({
    id: `local-${town}`,
    main: town,
    secondary: "Tamil Nadu",
    full: `${town}, Tamil Nadu`,
  })),
];

export function searchLocalAreas(query: string): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const starts: PlaceSuggestion[] = [];
  const contains: PlaceSuggestion[] = [];
  for (const place of LOCAL_PLACES) {
    const name = place.main.toLowerCase();
    if (name.startsWith(q)) starts.push(place);
    else if (name.includes(q)) contains.push(place);
  }

  return [...starts, ...contains].slice(0, 6);
}

type GooglePrediction = {
  placeId?: string;
  place?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};

async function searchGoogle(
  query: string,
  signal: AbortSignal
): Promise<PlaceSuggestion[]> {
  const cached = cache.get(query);
  if (cached) return cached;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY as string,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["in"],
      languageCode: "en",
      locationBias: CHENNAI_BIAS,
    }),
  });

  if (!response.ok) throw new Error(`Places autocomplete ${response.status}`);

  const data = (await response.json()) as {
    suggestions?: { placePrediction?: GooglePrediction }[];
  };

  const results: PlaceSuggestion[] = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is GooglePrediction => Boolean(p))
    .map((p) => {
      const full = p.text?.text ?? "";
      const main = p.structuredFormat?.mainText?.text ?? full;
      return {
        id: p.placeId ?? p.place ?? full,
        main,
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
        full: full || main,
      };
    })
    .filter((s) => s.full)
    .slice(0, 5);

  cache.set(query, results);
  return results;
}

/**
 * Suggestions for the plot-location field: Google when it is configured and
 * working, otherwise the built-in Chennai list. Aborted calls reject so a slow
 * response to an old keystroke can never overwrite the results for a newer one.
 */
export async function searchPlaces(
  query: string,
  signal: AbortSignal
): Promise<PlaceSearchResult> {
  const q = query.trim();

  if (GOOGLE_PLACES_ENABLED && !googleUnavailable && q.length >= MIN_GOOGLE_CHARS) {
    try {
      const suggestions = await searchGoogle(q, signal);
      if (suggestions.length > 0) return { suggestions, fromGoogle: true };
    } catch (error) {
      if (signal.aborted) throw error;
      googleUnavailable = true;
    }
  }

  return { suggestions: searchLocalAreas(q), fromGoogle: false };
}
