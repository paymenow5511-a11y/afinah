# Connect Afinah to Outlook

Afinah reads the calendars you select using Microsoft's sign-in library (MSAL Browser) and Microsoft Graph. Outlook appointments appear in **My day**, **Family**, and **Calendar**. They stay separate from to-dos and cannot be edited, cancelled, or booked by Afinah. Use **Open in Outlook** to manage an appointment.

## One-time Microsoft registration

An Outlook account connection has **not** been established merely by deploying the integration. Microsoft requires an application registration and the user's sign-in/consent. A ChatGPT Outlook connector does not provide credentials to the independently hosted Afinah app.

1. Sign in to https://entra.microsoft.com/ with an account permitted to register applications. Microsoft currently lists an Azure account/subscription, a tenant, and application registration privileges as prerequisites. If you do not have access, an administrator or developer with a suitable tenant must register the app. Do not create paid services merely to follow this guide.
2. Choose **Entra ID → App registrations → New registration**. Use the name **Afinah** and support both organizational and personal Microsoft accounts (**Any Entra ID Tenant + Personal Microsoft accounts**).
3. In **Authentication**, add the **Single-page application** platform. Register this exact redirect URI, including the final slash:

   `https://afinah.paymenow5511.workers.dev/`

4. Add Microsoft Graph **delegated** permission **Calendars.ReadBasic**. Do not add application-wide calendar permissions or calendar write permissions. No client secret is needed for this browser application. Leave implicit access-token/ID-token grant checkboxes disabled; MSAL uses authorization code with PKCE.
5. Copy the public **Application (client) ID** from Overview. In Afinah, open **Settings → Connect your Outlook calendar → One-time Microsoft setup**, paste the ID and save.
6. Choose **Connect Outlook**, sign in to the Outlook account with the doctor's appointments, and approve calendar reading. Work/school tenant policies may require administrator consent.
7. Select the calendars that contain the appointments, choose **Use selected calendars**, and check a known appointment's date/time/location against Outlook.

For a shared deployment, the same public application ID can be configured as the Worker's `MICROSOFT_CLIENT_ID` text variable. `/api/outlook-config` exposes only that public ID. No Microsoft secret or user token belongs in source, task backups, or chat. The browser settings fallback allows setup without changing the deployment.

## Refresh and offline behavior

Afinah initially uses the default calendar. Select additional calendars in Settings as needed. It loads a window from 30 days before the selected date to 180 days after it, with a complete extra end day. Selecting a date outside the saved window requests a new window. It refreshes on sign-in, app opening, return to the app, manual refresh, and every five minutes while the app is visible and online.

Graph `calendarView` expands recurring appointments and exceptions. Full snapshots replace prior snapshots only after all selected calendars and pages succeed, so moved/deleted/cancelled appointments are reconciled without duplicating task records. Cancelled events and declined invitations are excluded. Calendar request errors preserve the last complete saved copy and show a status message. Appointment timestamps are requested in UTC and displayed in the phone's local timezone. All-day event end dates are exclusive.

The last snapshot is stored on this device in a separate local cache. It is visibly marked with its refresh time and can be stale offline. Calendar events are not included in task backup files. Microsoft sign-in tokens are managed by MSAL rather than placed in Afinah's task state. Disconnect clears the selected account's local MSAL cache and Afinah's saved appointment copy; it does not revoke consent in Microsoft or sign out of other Outlook apps.

Outlook handles appointment notification delivery, including when Afinah is closed. Task reminder export is still a one-time .ics import and does not write tasks to Outlook automatically. This release provides **Outlook → Afinah read-only synchronization**, not two-way calendar editing.

## Validation and remaining gate

Unit tests use synthetic calendar responses to cover pagination, recurrence instance identity, event moves/deletions, cancellations, declined invitations, UTC parsing, multi-day overlap, safe Outlook links, hostile pagination URLs, throttling, and complete-snapshot replacement. Existing task persistence tests remain in place. Browser checks cover the unconfigured setup flow and preservation of existing local tasks.

The application ID, actual Microsoft sign-in/consent, a real appointment refresh, and Android sign-in must be verified with the user's account before reporting that Outlook is connected.

Official references:
- https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- https://learn.microsoft.com/en-us/entra/msal/javascript/browser/initialization
- https://learn.microsoft.com/en-us/entra/msal/javascript/browser/caching
- https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0
- https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web
