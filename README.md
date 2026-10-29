# Afinah

Outlook calendar integration is available in Settings; see [Microsoft setup and synchronization](docs/OUTLOOK.md). A registered Microsoft application ID and user sign-in are required before real appointments can be loaded. Calendar access is read-only and separate from task storage.

A working personal to-do PWA for Android and desktop: large saved checkboxes, task add/edit/delete, task and standalone notes, due dates, family appointments, priorities, recurring cleaning/laundry, open-app reminders and calendar reminder export. Uses the existing Afinah Cloudflare Worker and forest/gold identity.

See [Android installation and usage](docs/ANDROID.md) for device storage, offline behavior, backup/restore, and reminder limitations. There is no account sync or native APK. The original foundation remains in `src/legacy-site.js` and at `/about-afinah`; the root opens the app.

## Development

Requires Node.js 22+ and npm.

```sh
npm ci
npm run build
npm test
npm run check
npm run dev
```

`npm run preview` serves the actual Worker response locally at http://localhost:8787 without Cloudflare login. `npm run deploy` builds and deploys with an authenticated Wrangler session. Deployment is not implied by a successful local build.

Edit `public/`. The build packs the nine small app assets into an ignored generated module for a single Worker deployment, with no runtime CDN or database dependency. Tests require `npm run build` first. The PWA cache version in `public/sw.js` should be advanced when releasing changes to the offline shell.

## Data model

`afinah.personal.v1` holds versioned device-local tasks, notes, reminder delivery markers and settings. One-time completion uses `once`; repeating tasks retain completion dates independently. Saves occur before UI success is shown. Imports are validated before replacing storage. Personal task data is never sent to the Worker.

The existing voice/AI architecture plan in `docs/ARCHITECTURE.md` remains available for future work; those services are not represented as working features in this app.
