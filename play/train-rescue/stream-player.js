/* Serve Unity's single data request from independently compressed, immutable parts. */
window.leihoFetchBuild = async function (request, options) {
  const url = new URL(request instanceof Request ? request.url : request, document.baseURI);
  const manifest = window.leihoPackedData;
  if (url.href !== new URL(manifest.url, document.baseURI).href) {
    return window.fetch(request, options);
  }

  const controller = new AbortController();
  const signal = options && options.signal;
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const reads = new Map();
  let part = 0;
  let reader;
  let totalRead = 0;
  function prefetch(index) {
    if (index >= manifest.parts.length || reads.has(index)) return;
    const response = fetch(new URL(manifest.parts[index], url).href, { signal: controller.signal });
    response.catch(() => {});
    reads.set(index, response);
  }
  function errorMessage(error) {
    const message = '游戏资源加载失败，请检查网络后重试。';
    if (window.leihoLoadError) window.leihoLoadError(message);
    return error;
  }
  const stream = new ReadableStream({
    async pull(sink) {
      try {
        while (true) {
          if (!reader) {
            if (part === manifest.parts.length) {
              if (totalRead !== manifest.size) throw new Error("Incomplete game data");
              sink.close();
              return;
            }
            prefetch(part);
            prefetch(part + 1);
            const response = await reads.get(part);
            reads.delete(part);
            if (!response.ok || !response.body) throw new Error('Game download HTTP ' + response.status);
            reader = response.body.pipeThrough(new DecompressionStream('gzip')).getReader();
          }
          const next = await reader.read();
          if (next.done) {
            reader.releaseLock();
            reader = null;
            part++;
            continue;
          }
          totalRead += next.value.length;
          sink.enqueue(next.value);
          return;
        }
      } catch (error) {
        controller.abort();
        sink.error(errorMessage(error));
      }
    },
    cancel() { controller.abort(); }
  });
  return new Response(stream, { headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(manifest.size)
  } });
};
