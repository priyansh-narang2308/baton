# Call webhooks

Call webhooks deliver real-time audio and video call events from Nexconn to your server over HTTP. You configure a single webhook URL, select the events you want to receive, and Nexconn sends a `POST` request to that URL whenever a selected Call event occurs.

Call webhooks use the same request envelope, signing method, retry behavior, and IP allowlist as Chat webhooks. The Call Webhooks URL and Chat Webhooks URL are configured separately, so you can enable either feature independently or send them to different endpoints.

## Set up Call webhooks[​](#set-up-call-webhooks "Direct link to Set up Call webhooks")

1. Log in to the [Nexconn Console](https://console.nexconn.ai/agile/dashboard/workplace).

2. Go to **Call** > **Call Setting** > **Webhooks**.

   ![Call webhooks](/assets/console/call-webhook-console.png)

3. Turn on Webhooks.

4. Enter your webhook URL. The URL must begin with `https://` or `http://` and must be no longer than 512 characters.

5. Select the room, member, user, and call events you want to receive.

6. Save the configuration.

## IP allowlist[​](#ip-allowlist "Direct link to IP allowlist")

If your network restricts inbound IP addresses, add the following IP addresses to your allowlist. Without this, your server cannot receive webhook deliveries.

* **Singapore:** 52.221.93.74, 8.219.168.45, 8.219.93.148, 8.219.215.35, 8.219.43.97, 47.245.124.194, 8.222.167.17, 47.236.149.1, 8.219.217.193, 8.222.202.67, 43.156.138.254, 43.163.81.196, 43.156.239.53
* **North America:** 52.41.206.152
* **Saudi Arabia:** 8.213.17.80, 8.213.16.171, 8.213.28.96, 101.46.58.181, 80.238.230.175, 101.46.53.241

## Event envelope[​](#event-envelope "Direct link to Event envelope")

Every webhook request body is a single JSON object with the following envelope structure. Fields with empty or null values are omitted from the payload.

JSON

```json
{
  "type": "call:hangup",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "time": 1733124200000,
  "data": [
    {
      "callId": "call_9001",
      "mediaType": 1,
      "startTime": 1733124000000,
      "endTime": 1733124200000
    }
  ]
}

```

| Field  | Type     | Required | Description                                                                                                                         |
| ------ | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `type` | `String` | Yes      | Event type identifier. See [Event types](#event-types).                                                                             |
| `id`   | `String` | Yes      | Unique event ID. Use this value for idempotency and log correlation.                                                                |
| `time` | `Long`   | Yes      | Time the event was generated, as a Unix timestamp in milliseconds.                                                                  |
| `data` | `Array`  | Yes      | Event payload. Each element contains the fields specific to the event type. In the current version, the array contains one element. |

## Verify webhook signatures[​](#verify-webhook-signatures "Direct link to Verify webhook signatures")

Each webhook request includes four signature parameters in the HTTP request headers. Verify these on your server to confirm that the request originated from Nexconn and that the payload has not been tampered with.

| Header      | Type     | Description                                                                                                                               |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `AppKey`    | `String` | The App Key for your application.                                                                                                         |
| `Nonce`     | `String` | A random string for this request, 8 to 32 characters long.                                                                                |
| `Timestamp` | `String` | Unix timestamp in milliseconds.                                                                                                           |
| `Signature` | `String` | Data signature. Computed by concatenating App Secret + Nonce + Timestamp and applying SHA1. The result is a lowercase hexadecimal string. |

### Signature formula[​](#signature-formula "Direct link to Signature formula")

```text
Signature = sha1(AppSecret + Nonce + Timestamp)

```

Concatenate your App Secret, the `Nonce` header value, and the `Timestamp` header value as plain strings with no separators, then apply SHA1. Compare the result against the `Signature` header value. Discard requests where the values do not match.

### Verification example[​](#verification-example "Direct link to Verification example")

**PHP:**

PHP

```php
$appSecret   = 'your-own-app-secret'; // Replace with your App Secret.
$nonce       = $_SERVER['HTTP_NONCE'];
$timestamp   = $_SERVER['HTTP_TIMESTAMP'];
$signature   = $_SERVER['HTTP_SIGNATURE'];

$localSignature = sha1($appSecret . $nonce . $timestamp);

if (strcmp($signature, $localSignature) === 0) {
    echo 'OK';
} else {
    echo 'Error';
}

```

## Delivery behavior[​](#delivery-behavior "Direct link to Delivery behavior")

| Property                   | Value                                                                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP method                | `POST`                                                                                                                                                                                                     |
| Content-Type               | `application/json`                                                                                                                                                                                         |
| Successful response        | Any HTTP `2xx` status code                                                                                                                                                                                 |
| Single-request timeout     | 5 seconds                                                                                                                                                                                                  |
| Retries on timeout         | 2 retries, for 3 total attempts per event                                                                                                                                                                  |
| Circuit breaker            | If 30 events within a 1-minute window all exhaust retries, Nexconn pauses delivery to that URL for 1 minute, then automatically resumes.                                                                   |
| Abnormal offline detection | For `user:offline` events, if a client stops reporting heartbeats, the user is marked offline after more than 15 seconds without a heartbeat. Actual delivery time can vary based on detection scheduling. |

A request is considered successful when Nexconn receives any HTTP `2xx` response. If the request times out or returns a non-`2xx` status, Nexconn retries up to two more times. If all attempts fail, the event is not retried further.

Webhooks do not guarantee global ordering, ordering within the same `callId`, or ordering within the same `roomId`. Use `id`, `time`, `timestamp`, `startTime`, and `endTime` to make your processing idempotent and tolerant of out-of-order delivery.

### Request example[​](#request-example "Direct link to Request example")

The following shows what Nexconn sends to your webhook URL:

HTTP

```http
POST /call-webhook HTTP/1.1
Host: example.com
Content-Type: application/json
AppKey: your-app-key
Nonce: 8f3a2b1c
Timestamp: 1733124200000
Signature: a1b2c3d4e5f6...

{"type":"call:hangup","id":"550e8400-e29b-41d4-a716-446655440205","time":1733124200000,"data":[{"callId":"call_9001","optUserId":"user_002","mediaType":1,"startTime":1733124000000,"endTime":1733124200000}]}

```

## Event types[​](#event-types "Direct link to Event types")

The following table lists all available Call webhook event types. Select the events you need in the console.

### Room events[​](#room-events "Direct link to Room events")

| Event type       | Description                                     | Reference                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------- |
| `room:created`   | Fired when an audio or video room is created.   | [Room events](/server-call-api/webhook/room.md) |
| `room:destroyed` | Fired when an audio or video room is destroyed. | [Room events](/server-call-api/webhook/room.md) |

### Member events[​](#member-events "Direct link to Member events")

| Event type      | Description                       | Reference                                           |
| --------------- | --------------------------------- | --------------------------------------------------- |
| `member:joined` | Fired when a member joins a room. | [Member events](/server-call-api/webhook/member.md) |
| `member:exited` | Fired when a member exits a room. | [Member events](/server-call-api/webhook/member.md) |

### User events[​](#user-events "Direct link to User events")

| Event type     | Description                                             | Reference                                       |
| -------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `user:offline` | Fired when a user in a room is detected as offline.     | [User events](/server-call-api/webhook/user.md) |
| `user:online`  | Fired when an offline user is detected as online again. | [User events](/server-call-api/webhook/user.md) |

### Call events[​](#call-events "Direct link to Call events")

| Event type       | Description                                                                 | Reference                                                 |
| ---------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `call:initiated` | Fired when the caller starts a one-to-one or group call.                    | [Call lifecycle events](/server-call-api/webhook/call.md) |
| `call:invited`   | Fired when a participant invites one or more users to an ongoing call.      | [Call lifecycle events](/server-call-api/webhook/call.md) |
| `call:ringing`   | Fired when an invited user receives the call invitation and starts ringing. | [Call lifecycle events](/server-call-api/webhook/call.md) |
| `call:answered`  | Fired when an invited user answers the call.                                | [Call lifecycle events](/server-call-api/webhook/call.md) |
| `call:hangup`    | Fired when a participant hangs up.                                          | [Call lifecycle events](/server-call-api/webhook/call.md) |
| `call:ended`     | Fired when the whole call ends.                                             | [Call lifecycle events](/server-call-api/webhook/call.md) |
