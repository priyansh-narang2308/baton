# Call lifecycle events

Call lifecycle events fire as a one-to-one or group call progresses. Use these events to track call state, build server-side call records, or trigger downstream workflows.

For the complete webhook setup and signature verification guide, see [Call webhooks](/server-call-api/webhook/overview.md).

## Event types[​](#event-types "Direct link to Event types")

| Event type       | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `call:initiated` | Fired when the caller starts a one-to-one or group call.                    |
| `call:invited`   | Fired when a participant invites one or more users to an ongoing call.      |
| `call:ringing`   | Fired when an invited user receives the call invitation and starts ringing. |
| `call:answered`  | Fired when an invited user answers the call.                                |
| `call:hangup`    | Fired when a participant hangs up.                                          |
| `call:ended`     | Fired when the whole call ends.                                             |

## Payload[​](#payload "Direct link to Payload")

### Envelope[​](#envelope "Direct link to Envelope")

| Field  | Type     | Required | Description                                                              |
| ------ | -------- | -------- | ------------------------------------------------------------------------ |
| `type` | `String` | Yes      | One of the call lifecycle event types.                                   |
| `id`   | `String` | Yes      | Unique event ID.                                                         |
| `time` | `Long`   | Yes      | Event generation time (Unix ms).                                         |
| `data` | `Array`  | Yes      | Array containing one call event object. See [Data fields](#data-fields). |

### Data fields[​](#data-fields "Direct link to Data fields")

| Field       | Type       | Availability                | Description                                                                                                         |
| ----------- | ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `callId`    | `String`   | All call events             | Call ID.                                                                                                            |
| `optUserId` | `String`   | Most call events            | User ID of the user who performed the operation, such as the caller, invite sender, answering user, or hangup user. |
| `toUserIds` | `String[]` | Invitation-related events   | Invited user ID list.                                                                                               |
| `targetId`  | `String`   | Group call events           | Organization ID. For a group call, this value is the group ID.                                                      |
| `mediaType` | `Number`   | All call events             | Call media type. See [Media types](#media-types).                                                                   |
| `extra`     | `String`   | Optional                    | Custom business data passed through from the call.                                                                  |
| `startTime` | `Long`     | All call events             | Call start time (Unix ms).                                                                                          |
| `endTime`   | `Long`     | `call:hangup`, `call:ended` | Call end time (Unix ms).                                                                                            |

### Media types[​](#media-types "Direct link to Media types")

| Value | Meaning     |
| ----- | ----------- |
| `0`   | Audio call. |
| `1`   | Video call. |

## Examples[​](#examples "Direct link to Examples")

### call<!-- -->:initiated[​](#call "Direct link to call")

JSON

```json
{
  "type": "call:initiated",
  "id": "550e8400-e29b-41d4-a716-446655440201",
  "time": 1733124000000,
  "data": [
    {
      "callId": "call_9001",
      "optUserId": "user_001",
      "toUserIds": ["user_002", "user_003"],
      "targetId": "group_555",
      "mediaType": 1,
      "extra": "{\"biz\":\"customer_service\"}",
      "startTime": 1733124000000
    }
  ]
}

```

### call<!-- -->:invited[​](#call-1 "Direct link to call-1")

JSON

```json
{
  "type": "call:invited",
  "id": "550e8400-e29b-41d4-a716-446655440202",
  "time": 1733124002000,
  "data": [
    {
      "callId": "call_9001",
      "optUserId": "user_001",
      "toUserIds": ["user_003"],
      "targetId": "group_555",
      "mediaType": 1,
      "extra": "{\"biz\":\"customer_service\"}",
      "startTime": 1733124000000
    }
  ]
}

```

### call<!-- -->:ringing[​](#call-2 "Direct link to call-2")

JSON

```json
{
  "type": "call:ringing",
  "id": "550e8400-e29b-41d4-a716-446655440203",
  "time": 1733124003000,
  "data": [
    {
      "callId": "call_9001",
      "optUserId": "user_002",
      "toUserIds": ["user_001"],
      "targetId": "group_555",
      "mediaType": 1,
      "extra": "{\"biz\":\"customer_service\"}",
      "startTime": 1733124000000
    }
  ]
}

```

### call<!-- -->:answered[​](#call-3 "Direct link to call-3")

JSON

```json
{
  "type": "call:answered",
  "id": "550e8400-e29b-41d4-a716-446655440204",
  "time": 1733124010000,
  "data": [
    {
      "callId": "call_9001",
      "optUserId": "user_001",
      "mediaType": 1,
      "startTime": 1733124000000
    }
  ]
}

```

### call<!-- -->:hangup[​](#call-4 "Direct link to call-4")

JSON

```json
{
  "type": "call:hangup",
  "id": "550e8400-e29b-41d4-a716-446655440205",
  "time": 1733124200000,
  "data": [
    {
      "callId": "call_9001",
      "optUserId": "user_002",
      "mediaType": 1,
      "startTime": 1733124000000,
      "endTime": 1733124200000
    }
  ]
}

```

### call<!-- -->:ended[​](#call-5 "Direct link to call-5")

JSON

```json
{
  "type": "call:ended",
  "id": "550e8400-e29b-41d4-a716-446655440206",
  "time": 1733124201000,
  "data": [
    {
      "callId": "call_9001",
      "mediaType": 1,
      "startTime": 1733124000000,
      "endTime": 1733124201000
    }
  ]
}

```
