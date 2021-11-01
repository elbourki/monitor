import { handleRequest, handleOptions, handleScheduled } from './handlers'

addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method === "OPTIONS")
    event.respondWith(handleOptions(event.request));
  else
    event.respondWith(handleRequest(event.request));
});

addEventListener("scheduled", (event: ScheduledEvent) => {
  event.waitUntil(handleScheduled())
});