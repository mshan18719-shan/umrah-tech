/**
 * Holiday package search stream client.
 * Stream events (when SSE): start → packages / shared → done
 * Also supports a plain JSON response from the same endpoint.
 *
 * shared_flight / shared_transfer live on data once; we copy them
 * onto every package as flight / transfer when present.
 */

function packageKey(pkg) {
    return pkg?.package_id ?? `${pkg?.hotel?.provider ?? ''}:${pkg?.hotel?.id ?? ''}`;
  }
  
  export function mergePackages(existing = [], incoming = []) {
    if (!incoming.length) return existing;
    const map = new Map();
    for (const pkg of existing) {
      map.set(packageKey(pkg), pkg);
    }
    for (const pkg of incoming) {
      const key = packageKey(pkg);
      map.set(key, { ...(map.get(key) || {}), ...pkg });
    }
    return Array.from(map.values());
  }
  
  /**
   * Inject top-level shared flight/transfer into each package.
   */
  export function attachSharedServices(packages = [], shared = {}) {
    const flight = shared?.shared_flight ?? null;
    const transfer = shared?.shared_transfer ?? null;
  
    if (!packages.length || (flight == null && transfer == null)) {
      return packages;
    }
  
    return packages.map((pkg) => ({
      ...pkg,
      ...(flight != null ? { flight } : {}),
      ...(transfer != null ? { transfer } : {}),
    }));
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
  
  function unwrapData(payload) {
    if (!payload || typeof payload !== 'object') return {};
    if (payload.data && typeof payload.data === 'object') return payload.data;
    return payload;
  }
  
  function pickShared(source = {}) {
    return {
      shared_flight: source.shared_flight ?? null,
      shared_transfer: source.shared_transfer ?? null,
    };
  }
  
  /**
   * @param {object} options
   * @param {object} options.request
   * @param {AbortSignal} [options.signal]
   * @param {(packages: object[]) => void} [options.onPackages]
   * @param {(info: { success: boolean, message?: string }) => void} [options.onDone]
   */
  export async function streamHolidayPackageSearch({
    request,
    signal,
    onPackages,
    onDone,
  }) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/search`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal,
      },
    );
  
    if (!res.ok) {
      throw new Error(`Holiday package search failed (${res.status})`);
    }
  
    const contentType = res.headers.get('content-type') || '';
  
    // Non-stream JSON response (same merge rules)
    if (contentType.includes('application/json') || !res.body) {
      const json = await res.json();
      const data = unwrapData(json);
      const packages = attachSharedServices(data.packages || [], pickShared(data));
      const success = json?.success !== false;
  
      onPackages?.(packages);
      onDone?.({ success, message: json?.message || '' });
  
      if (!success) {
        throw new Error(json?.message || 'Holiday package search failed');
      }
      return packages;
    }
  
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamSucceeded = true;
    let doneMessage = '';
    let packages = [];
    const shared = { shared_flight: null, shared_transfer: null };
  
    const emitPackages = () => {
      const next = attachSharedServices(packages, shared);
      onPackages?.(next);
      return next;
    };
  
    const applySharedFrom = (source) => {
      const next = pickShared(source);
      let changed = false;
      if (next.shared_flight != null) {
        shared.shared_flight = next.shared_flight;
        changed = true;
      }
      if (next.shared_transfer != null) {
        shared.shared_transfer = next.shared_transfer;
        changed = true;
      }
      return changed;
    };
  
    const handleEvent = (parsed) => {
      if (!parsed) return;
  
      const { event, data } = parsed;
  
      if (event === 'start') return;
  
      if (event === 'done') {
        streamSucceeded = data?.success !== false;
        doneMessage = data?.message || '';
        emitPackages();
        onDone?.({
          success: streamSucceeded,
          message: doneMessage,
        });
        return;
      }
  
      // Named shared events
      if (event === 'shared_flight' || event === 'flight') {
        shared.shared_flight = data?.shared_flight ?? data?.flight ?? data;
        emitPackages();
        return;
      }
      if (event === 'shared_transfer' || event === 'transfer') {
        shared.shared_transfer = data?.shared_transfer ?? data?.transfer ?? data;
        emitPackages();
        return;
      }
  
      // Generic payload: { packages, shared_flight, shared_transfer } or wrapped in data
      const payload = unwrapData(data);
      let changed = false;
  
      if (Array.isArray(payload.packages)) {
        packages = mergePackages(packages, payload.packages);
        changed = true;
      }
      if (applySharedFrom(payload) || applySharedFrom(data)) {
        changed = true;
      }
  
      if (changed) emitPackages();
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
  
    const finalPackages = emitPackages();
  
    if (!streamSucceeded) {
      throw new Error(doneMessage || 'Holiday package search stream failed');
    }
  
    return finalPackages;
  }
  