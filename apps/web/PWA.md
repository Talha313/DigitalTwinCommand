# PWA setup and mobile testing

The production app registers /sw.js automatically on HTTPS or localhost.
Development mode does not register a worker. No PWA plugin or extra environment
variable is required.

## Run locally

From the repository root:

    pnpm build
    pnpm start

Keep the backend running. Open http://localhost:3000 in Chrome. In DevTools >
Application, check Manifest for valid icons and Service Workers for an activated
worker. Wait for activation, then reload once before testing offline navigation.

For phone testing, use an HTTPS deployment or trusted HTTPS tunnel. Set
NEXT_PUBLIC_API_URL to the externally reachable HTTPS backend URL before building;
allow the frontend origin in backend CORS. WebSocket connections use WSS with an
HTTPS API URL. A phone's localhost does not refer to your computer.

## Install and verify

- Android: Chrome menu > Install app / Add to Home screen.
- iPhone: Safari > Share > Add to Home Screen; enable Open as Web App if offered.
- Open the icon and verify standalone display, login, call, hold, resume, hangup.
- Background the app, return, and verify call state and connectivity.
- After an online visit, enable airplane mode and reload: the offline page appears.
  An already-open page shows an offline banner. Reconnect and choose Try again.
- Confirm Cache Storage contains only the offline page and icons. API responses,
  login pages, transcripts, and call mutations are never cached or replayed.

The offline fallback applies to full document navigation. Client-side Next.js
navigation still needs connectivity; the banner explains this. Live calls and
dashboard data require the backend. Push subscription UI is a separate feature
and is not enabled by this setup.

## Updates

Bump CACHE in public/sw.js when changing the offline page or cached icons.
Updated workers wait for existing app windows and browser tabs to close. A banner
asks users to reopen after their call. There is no forced reload or skipWaiting.
Ordinary application pages are fetched from the network, not a cached app shell.

For a clean development test, unregister the worker and clear this site's storage
in DevTools > Application (this also removes local sign-in state).

## Checks

    node --test apps/web/tests/pwa.test.mjs
    pnpm typecheck
    pnpm build

Icons derive from public/icons/app-icon.svg, matching the sidebar's node symbol.
PNG sizes are 192, 512, and 180 pixels (Apple touch icon).

## Laptop + ngrok mobile test mode

Keep the existing backend running on port 8000. This mode proxies API, media,
and WebSocket requests through the frontend origin so phone login cookies work
without a separate cross-site API connection. Existing backend webhook URLs
and ngrok tunnels are unchanged.

    pnpm --filter @dtcc/web pwa:build
    pnpm --filter @dtcc/web pwa:start

The production frontend uses port 3100 and a separate .next-mobile build.
Expose that port through ngrok and open the HTTPS URL on your phone. If ngrok
shows a browser warning, choose Visit Site first. Keep the laptop awake.

The active session created a tunnel named dtcc-mobile through the already-running
ngrok agent. View its current URL at http://127.0.0.1:4040/api/tunnels.
Tunnel URLs can change after restarting ngrok. Stopping the mobile frontend does
not stop the backend or its existing tunnel.
