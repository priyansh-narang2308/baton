# User connection status

The `user:connection_status` event fires whenever a user connects to, disconnects from, or logs out of the messaging service. Use this event to track user presence in real time on your app server.

For the complete webhook setup and signature verification guide, see [Webhooks overview](/platform-chat-api/webhook/overview.md).

## Event type[​](#event-type "Direct link to Event type")

`user:connection_status`

## Payload[​](#payload "Direct link to Payload")

### Envelope[​](#envelope "Direct link to Envelope")

| Field  | Type     | Required | Description                                                          |
| ------ | -------- | -------- | -------------------------------------------------------------------- |
| `type` | `String` | Yes      | `"user:connection_status"`                                           |
| `id`   | `String` | Yes      | Unique event ID.                                                     |
| `time` | `Long`   | Yes      | Event generation time (Unix ms).                                     |
| `data` | `Array`  | Yes      | Array containing one status object. See [Data fields](#data-fields). |

### Data fields[​](#data-fields "Direct link to Data fields")

| Field       | Type     | Required | Description                                                                                                            |
| ----------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `status`    | `String` | Yes      | Connection status change event. `"0"` = connected (online). `"1"` = disconnected (offline). `"2"` = logged out.        |
| `userId`    | `String` | Yes      | The user ID.                                                                                                           |
| `os`        | `String` | No       | Client platform. One of: `iOS`, `Android`, `Websocket`. Included when the user comes online.                           |
| `time`      | `Long`   | Yes      | Time of the status change (Unix ms).                                                                                   |
| `clientIp`  | `String` | No       | The user's current IP address and port (e.g., `192.168.1.100:12345`).                                                  |
| `sessionId` | `String` | No       | Unique connection ID. When a user is online on multiple devices simultaneously, each device has a distinct session ID. |

### Status values[​](#status-values "Direct link to Status values")

| Value | Meaning                                                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `"0"` | **Connected** — The client successfully connected to the messaging service.                                                         |
| `"1"` | **Disconnected** — The client disconnected (app called `disconnect`, network interruption, or was kicked by another device login).  |
| `"2"` | **Logged out** — The client actively logged out (app called `logout`). Push notifications are suspended for this user after logout. |

note

The `status` field represents a **status change event**, not the user's current state. For example, receiving `"1"` means the user just went offline, not that they are currently offline.

When a client loses connectivity abnormally (without sending an explicit disconnect), the offline event (`"1"`) is delivered within 5 minutes.

## Example[​](#example "Direct link to Example")

JSON

```json
{
  "type": "user:connection_status",
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "time": 1730192400000,
  "data": [
    {
      "status": "0",
      "userId": "user_001",
      "os": "iOS",
      "time": 1730192400000,
      "clientIp": "192.168.1.100:12345",
      "sessionId": "sess_abc123"
    }
  ]
}

```
