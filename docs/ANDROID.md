# Afinah on Android

For live Outlook appointments, use **Settings → Connect your Outlook calendar**. Microsoft app registration and user sign-in are required; see [Outlook setup](OUTLOOK.md). Once connected, the selected Outlook calendars appear alongside tasks and refresh while the app is open. Calendar appointments are read-only; change them and manage their notifications in Outlook.

Afinah is an installable PWA, not an APK. Open its HTTPS address in Chrome on your phone. Select **⋮ → Add to Home screen → Install** (wording varies). Open it once online to cache its files. The installed app uses the same data as Chrome for that address.

## Everyday use

- Use **Add notes / Edit notes** on any task to save its details, including after it is completed.
- Deleting a task moves it to **Deleted tasks**, with a 15-second **Undo** action. Open **Deleted tasks** from the task list or Settings to restore it later. Notes, dates, repeat settings and completion history are preserved. Deleted tasks do not expire automatically and are included in backups. They remain on the same device, subject to the same storage and backup limitations as active tasks.

- Tap a large checkbox to complete a task. Tap again to undo completion.
- Add or edit tasks with notes, an area, a family member, due date, time, priority, and optional repeat.
- My day includes undated and overdue one-time tasks and routines scheduled for the selected day. All tasks also includes future tasks. Routines can only be checked off on a scheduled day.
- Daily routines include the 30-minute cleaning method and one laundry load. The cleaning focus rotates through kitchen, living room, bathrooms, bedrooms, Friday laundry/organization, Saturday decluttering, and Sunday reset.
- Friday detailed laundry repeats every Friday from its start date. Each occurrence has its own saved checkmark. Select an earlier date to review past routine completion.
- Weekly repeats use the start date's weekday. Monthly repeats use the start date's day, or the last day of shorter months.
- Star tasks to fill My top 3. Notes are editable personal records, including instructions you may want to discuss with Afinah later; no AI response is generated.
- Settings offers an optional planning checklist. Appointment tasks mean “schedule this”; they do not book medical care.

## Persistence and privacy

Tasks and notes use browser localStorage on this device and origin. Closing/reopening the app or going offline does not reset completion. There is no account, cloud task database, or cross-device sync. Changing the hostname creates a separate storage space. Clearing browser data, losing the device, or browser storage eviction can remove data.

Use **Settings → Download backup** regularly. **Keep device storage** requests persistent browser storage, subject to browser approval. Restore validates a backup and asks before replacing existing data. Storage errors are displayed and writes are not reported as saved when they fail. Corrupt saved data is never silently overwritten by defaults.

## Reminders

Choose a due/start date, time and **Remind me** in a task. Times follow the phone's local timezone. While Afinah is open it checks due reminders at startup, on returning to the app, and every 30 seconds. It displays in-app alerts and, with permission, service-worker device notifications. Android background throttling can delay these checks; closing the app stops them.

For alerts with Afinah closed: **Settings → Export calendar reminders**, then import the .ics file into Google Calendar on the web under **Settings → Import & export**. Verify the imported events' notification settings and that Calendar notifications are enabled on your phone. The export includes alarms and repeating events; calendar providers can handle imported alarms differently. This is a one-time export, not a live calendar sync. Update or remove imported events in your calendar when changing Afinah tasks. Re-importing may duplicate events. End-of-month monthly repeats are encoded to match Afinah's shorter-month behavior.

No server push subscription, background alarm scheduler, or native Android notification service is claimed in this release.

## Verification

Automated checks cover fresh storage reload, task edits/deletion, note persistence, recurring completion isolation, Friday scheduling, shorter months/leap years, invalid backups, calendar alarms/escaping/line folding, Worker routes, manifest, and PNG icons.

Browser checks verified adding/editing a family task, starring it, saving a note, retaining completion after reload, and showing Friday laundry with the next day's daily checkbox unchecked. With the preview server stopped, the app reloaded from its offline cache and retained the checked laundry task. A 390 × 844 viewport was checked visually. An actual Android device installation and calendar-delivered alert still need device testing.
