/**
 * Hotel search SSE client.
 * Stream events: start → provider (x N) → done
 *
 * Listing UI is held back until at least MIN_HOTELS_BEFORE_LISTING
 * hotels are buffered (or the stream ends with fewer).
 */

export const MIN_HOTELS_BEFORE_LISTING = 15;

function hotelKey(hotel) {
  return `${hotel?.provider ?? ''}:${hotel?.id ?? ''}`;
}

export function mergeHotels(existing = [], incoming = []) {
  if (!incoming.length) return existing;
  const map = new Map();
  for (const hotel of existing) {
    map.set(hotelKey(hotel), hotel);
  }
  for (const hotel of incoming) {
    map.set(hotelKey(hotel), hotel);
  }
  return Array.from(map.values());
}

function parseSseChunk(chunk) {
  const lines = chunk.split(/\r?\n/);
  let event = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) return null;

  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

/**
 * @param {object} options
 * @param {object} options.request - hotel search payload
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.minHotelsBeforeEmit=15] - hold UI updates until this many hotels
 * @param {(info: { providers: string[], total: number }) => void} [options.onStart]
 * @param {(info: { provider: string, success: boolean, hotels: object[], allHotels: object[] }) => void} [options.onProvider]
 * @param {(info: { success: boolean, message?: string, errors?: unknown[] }) => void} [options.onDone]
 */
export async function streamHotelSearch({
  request,
  signal,
  minHotelsBeforeEmit = MIN_HOTELS_BEFORE_LISTING,
  onStart,
  onProvider,
  onDone,
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/search`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Hotel search failed (${res.status})`);
  }

  if (!res.body) {
    throw new Error('Hotel search stream is not available');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamSucceeded = true;
  let doneMessage = '';
  const hotels = [];
  let hasEmitted = false;

  const emitProvider = ({ provider, success, hotels: chunk }) => {
    if (!onProvider) return;
    onProvider({
      provider,
      success,
      hotels: chunk,
      allHotels: [...hotels],
    });
    hasEmitted = true;
  };

  const flushBufferedHotels = ({ provider = null, success = true } = {}) => {
    if (hasEmitted || !onProvider) return;
    emitProvider({
      provider,
      success,
      hotels: [...hotels],
    });
  };

  const handleEvent = (parsed) => {
    if (!parsed) return;

    if (parsed.event === 'start') {
      onStart?.({
        providers: parsed.data?.providers || [],
        total: parsed.data?.total || 0,
      });
      return;
    }

    if (parsed.event === 'provider') {
      const providerHotels = Array.isArray(parsed.data?.hotels)
        ? parsed.data.hotels.map((hotel) => ({
            ...hotel,
            provider: hotel.provider || parsed.data.provider,
          }))
        : [];

      if (providerHotels.length) {
        const merged = mergeHotels(hotels, providerHotels);
        hotels.length = 0;
        hotels.push(...merged);
      }

      const providerMeta = {
        provider: parsed.data?.provider,
        success: Boolean(parsed.data?.success),
      };

      // Keep loader until threshold — then open listing and stream the rest
      if (!hasEmitted) {
        if (hotels.length >= minHotelsBeforeEmit) {
          emitProvider({
            ...providerMeta,
            hotels: [...hotels],
          });
        }
        return;
      }

      if (providerHotels.length) {
        emitProvider({
          ...providerMeta,
          hotels: providerHotels,
        });
      }
      return;
    }

    if (parsed.event === 'done') {
      streamSucceeded = parsed.data?.success !== false;
      doneMessage = parsed.data?.message || '';

      // Stream finished under threshold — still show whatever we have
      flushBufferedHotels({ success: streamSucceeded });

      onDone?.({
        success: streamSucceeded,
        message: doneMessage,
        errors: parsed.data?.errors || [],
      });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\n\n/);
    buffer = parts.pop() || '';

    for (const part of parts) {
      handleEvent(parseSseChunk(part));
    }
  }

  if (buffer.trim()) {
    handleEvent(parseSseChunk(buffer));
  }

  // Safety: if stream ended without a done event
  flushBufferedHotels();

  if (!streamSucceeded) {
    throw new Error(doneMessage || 'Hotel search stream failed');
  }

  return hotels;
}
