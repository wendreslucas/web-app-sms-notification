# SMS Notification Service — Operations Console

An optional Next.js interface for demonstrating the SMS Notification Microservice. It sends a message, follows its delivery status as it changes, and exposes the requeue action for messages that exhausted every provider.

It is a demo tool, not part of the backend. The microservice is complete and fully usable without it.

## Requirements

- Node.js 22
- npm
- The backend running and reachable, by default on `http://localhost:3001`

## Running

The workspace holds two sibling projects:

```text
ms-sms-notification/   the backend
web-app/               this app
```

Start the backend first, from `ms-sms-notification/`. It listens on port 3001 so it does not collide with the Next.js dev server:

```bash
cd ms-sms-notification
docker compose up -d
npm run migration:run
npm run start:dev
```

Then, in a second terminal:

```bash
cd web-app
npm install
cp .env.example .env.local
npm run dev
```

The console runs on `http://localhost:3000`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Origin of the SMS microservice. |
| `NEXT_PUBLIC_SMS_MAX_MESSAGE_LENGTH` | `1600` | Drives the character counter. Keep it in step with the backend's `SMS_MAX_MESSAGE_LENGTH`; the backend remains the authority. |

Both values are public by design and end up in the browser bundle. No credential belongs here.

The backend only accepts browser requests from the origin in its `FRONTEND_ORIGIN` setting, `http://localhost:3000` by default.

## What it does

**Send SMS** posts to `POST /api/v1/sms/send`. The recipient is validated as E.164 and the message must contain real content, mirroring the backend rules. Metadata is optional free-form JSON.

**Idempotency** is generated once with `crypto.randomUUID()` and kept between submissions. Sending the same form twice, or using *Send same request again*, replays the identical payload with the identical `X-Idempotency-Key`, and the backend returns the existing message instead of queuing a second one. *Generate new* starts a fresh logical request.

**Message status** reads `GET /api/v1/sms/:messageId` and polls every two seconds while the message is `QUEUED`, `PROCESSING` or `SENT`. `SENT` keeps polling because a delivery webhook can still move it to `DELIVERED` or `UNDELIVERED`. Polling stops at any terminal status.

**Track existing message** loads any message by its ID.

**Requeue** appears only for `FATAL_FAILURE`, asks for confirmation, and calls `POST /api/v1/admin/sms/:messageId/requeue`.

The timeline is built only from what the tracking endpoint returns. The API does not expose a per-attempt history, so the console shows the attempt count on its own and does not reconstruct individual retries or failover hops.

## Privacy

Nothing is written to `localStorage`, `sessionStorage` or cookies. The tracked message ID lives in React state and is gone on reload. The tracking endpoint itself never returns the recipient, the message body or the metadata.

## Scripts

```bash
npm run dev     # development server on :3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```
