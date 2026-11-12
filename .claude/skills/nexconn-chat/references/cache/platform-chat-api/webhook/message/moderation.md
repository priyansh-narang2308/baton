# Moderation results

Moderation result events fire when automatic moderation reaches a decision on a message. They use the same Webhooks delivery infrastructure as other Chat webhooks, including the Webhooks URL, signing, retry, and delivery behavior.

For the complete webhook setup and signature verification guide, see [Webhooks overview](/platform-chat-api/webhook/overview.md).

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

To receive moderation result events, all of the following must be true:

1. **Auto moderation** is enabled in Nexconn Console under **Chat** > **Chat settings** > **Security & Moderation**.

   ![Enable auto moderation](/assets/images/auto-moderation-af60c18616e243d1de0d449ffd496aa9.png)

2. **Webhooks** is enabled under **Chat** > **Chat settings** > **Webhooks**. Refer to [Webhooks overview](/platform-chat-api/webhook/overview.md) for more information.

3. A valid Webhooks URL is configured. Refer to [Webhooks overview](/platform-chat-api/webhook/overview.md) for more information.

4. The moderation result event types are selected in the Webhooks configuration.

   ![Select moderation result webhook events](/assets/images/select-moderation-events-33e8f5fc25984e5c2d7735e022eb6ca8.png)

Automatic moderation and Webhooks are independent switches. If Webhooks are disabled, Nexconn still applies the moderation decision but does not send moderation result events. If automatic moderation is disabled, no moderation results are produced.

## Event types[​](#event-types "Direct link to Event types")

| Event type                     | When it is sent                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `message_moderation:block`     | A message is rejected by automatic moderation and blocked from delivery.                                             |
| `message_moderation:suspected` | A message is flagged as suspected content. Use your own policy or manual review workflow to decide follow-up action. |

## Payload[​](#payload "Direct link to Payload")

### Envelope[​](#envelope "Direct link to Envelope")

| Field  | Type     | Description                                                                      |
| ------ | -------- | -------------------------------------------------------------------------------- |
| `type` | `String` | Event type. One of `message_moderation:block` or `message_moderation:suspected`. |
| `id`   | `String` | Unique event ID (UUID).                                                          |
| `time` | `Long`   | Time the event was generated, as a Unix timestamp in milliseconds.               |
| `data` | `Array`  | Array containing one moderation result object. See [Data fields](#data-fields).  |

### Data fields[​](#data-fields "Direct link to Data fields")

Each element in `data` contains a `message` object and a `moderationDetail` object.

#### `message` object[​](#message-object "Direct link to message-object")

The `message` object uses the same field structure as the [pre-messaging webhook](/platform-chat-api/webhook/message/pre-messaging.md) message object.

| Field         | Type     | Description                                                                                        |
| ------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `appKey`      | `String` | The App Key for the application.                                                                   |
| `userId`      | `String` | The sender's user ID.                                                                              |
| `channelId`   | `String` | Target channel ID: recipient user ID (direct), group ID, open channel ID, or community channel ID. |
| `channelType` | `Number` | Channel type. See [Channel types](/platform-chat-api/webhook/overview.md#channel-types).           |
| `messageType` | `String` | Message type identifier (e.g., `RC:TxtMsg`, `RC:ImgMsg`).                                          |
| `content`     | `String` | Message content body as a JSON string.                                                             |
| `metadata`    | `Object` | Message metadata key-value pairs. Only present when the message has metadata.                      |
| `os`          | `String` | Sender's platform. One of: `iOS`, `Android`, `Websocket`, `Server`.                                |
| `time`        | `Long`   | Time the server received the message (Unix ms).                                                    |
| `messageId`   | `String` | Unique message identifier.                                                                         |

#### `moderationDetail` object[​](#moderationdetail-object "Direct link to moderationdetail-object")

The `moderationDetail` object contains the raw JSON response from the moderation provider. Nexconn does not normalize this object — different providers and content categories can return different fields.

For text and image messages, `moderationDetail` contains the provider's single synchronous response. For voice and video messages, it contains the provider's single asynchronous response.

The `riskLabel1` field in the provider response identifies the primary reason why the content did not pass or requires review.

## Examples[​](#examples "Direct link to Examples")

### `message_moderation:block`[​](#message_moderationblock "Direct link to message_moderationblock")

JSON

```json
{
  "type": "message_moderation:block",
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "time": 1730192400000,
  "data": [
    {
      "message": {
        "appKey": "c9kqb3urd",
        "userId": "user_001",
        "channelId": "user_002",
        "channelType": 1,
        "messageType": "RC:TxtMsg",
        "content": "{\"content\":\"<original text>\"}",
        "metadata": { "type": "3" },
        "os": "iOS",
        "time": 1730192400000,
        "messageId": "596E-P5PG-4FS2-7OJK"
      },
      "moderationDetail": {
        "code": 1100,
        "requestId": "abc123",
        "riskLevel": "REJECT",
        "riskLabel1": "politics",
        "riskLabel2": "leader",
        "riskDescription": "Political content: national leader",
        "riskDetail": {
          "riskSource": 1000
        }
      }
    }
  ]
}

```

### `message_moderation:suspected`[​](#message_moderationsuspected "Direct link to message_moderationsuspected")

JSON

```json
{
  "type": "message_moderation:suspected",
  "id": "550e8400-e29b-41d4-a716-446655440101",
  "time": 1730192400000,
  "data": [
    {
      "message": {
        "appKey": "c9kqb3urd",
        "userId": "user_001",
        "channelId": "group_001",
        "channelType": 3,
        "messageType": "RC:ImgMsg",
        "content": "{\"imageUri\":\"https://example.com/image.png\"}",
        "os": "Android",
        "time": 1730192400000,
        "messageId": "596E-P5PG-4FS2-7OJL"
      },
      "moderationDetail": {
        "code": 1100,
        "requestId": "abc124",
        "riskLevel": "REVIEW",
        "riskLabel1": "ad",
        "riskLabel2": "ad_suspect",
        "riskDescription": "Advertising: suspected ad",
        "riskDetail": {
          "ocrText": { "text": "Contact me on another platform" }
        }
      }
    }
  ]
}

```
