# Message deleted

The `message:delete` event fires when a message is deleted for one user or for all participants. The `operationType` field in the event payload distinguishes between the two operations.

For the complete webhook setup and signature verification guide, see [Webhooks overview](/platform-chat-api/webhook/overview.md).

For the corresponding client SDK operations, see the delete message guide for your platform:

* Android
* iOS
* Flutter
* Web

[Delete messages in the Android SDK](/chatsdk-android/message/delete.md)

[Delete messages in the iOS SDK](/chatsdk-ios/message/delete.md)

[Delete messages in the Flutter SDK](/chatsdk-flutter/message/delete.md)

[Delete messages in the Web SDK](/chatsdk-web/message/delete.md)

## Event type[​](#event-type "Direct link to Event type")

`message:delete`

## Payload[​](#payload "Direct link to Payload")

### Envelope[​](#envelope "Direct link to Envelope")

| Field  | Type     | Required | Description                                                                  |
| ------ | -------- | -------- | ---------------------------------------------------------------------------- |
| `type` | `String` | Yes      | `"message:delete"`                                                           |
| `id`   | `String` | Yes      | Unique event ID.                                                             |
| `time` | `Long`   | Yes      | Event generation time (Unix ms).                                             |
| `data` | `Array`  | Yes      | Array containing one deletion event object. See [Data fields](#data-fields). |

### Data fields[​](#data-fields "Direct link to Data fields")

| Field             | Type     | Required | Description                                                                                                                                                                                  |
| ----------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operationType`   | `Number` | Yes      | Operation type. `1` = delete for all — the message is deleted for all participants. `2` = delete for me — the message is removed only from the history of the user who performed the action. |
| `userId`          | `String` | Yes      | The user ID of the person who performed the operation.                                                                                                                                       |
| `optTime`         | `Long`   | Yes      | Time the operation was performed (Unix ms).                                                                                                                                                  |
| `os`              | `String` | Yes      | Platform where the action originated.                                                                                                                                                        |
| `channelInfo`     | `Object` | Yes      | Information about the channel containing the message. See [channelInfo fields](#channelinfo-fields).                                                                                         |
| `originalMsgInfo` | `Object` | Yes      | Information about the original message. See [originalMsgInfo fields](#originalmsginfo-fields).                                                                                               |
| `deleteForAll`    | `Object` | No       | Delete-for-all details. Present only when `operationType` is `1`. See [deleteForAll fields](#deleteforall-fields).                                                                           |
| `deleteForMe`     | `Object` | No       | Delete-for-me details. Present only when `operationType` is `2`. See [deleteForMe fields](#deleteforme-fields).                                                                              |

### channelInfo fields[​](#channelinfo-fields "Direct link to channelInfo fields")

| Field          | Type     | Required | Description                                                             |
| -------------- | -------- | -------- | ----------------------------------------------------------------------- |
| `channelType`  | `Number` | Yes      | Channel type. See [Channel types](/platform-chat-api.md#channel-types). |
| `channelId`    | `String` | Yes      | The channel ID.                                                         |
| `subchannelId` | `String` | No       | Subchannel ID. Only present in community channels.                      |

### originalMsgInfo fields[​](#originalmsginfo-fields "Direct link to originalMsgInfo fields")

| Field         | Type     | Required | Description                                              |
| ------------- | -------- | -------- | -------------------------------------------------------- |
| `messageId`   | `String` | Yes      | The unique ID of the deleted message.                    |
| `messageTime` | `Long`   | Yes      | The original send time of the deleted message (Unix ms). |

### deleteForAll fields[​](#deleteforall-fields "Direct link to deleteForAll fields")

Present only when `operationType` is `1` (delete for all).

| Field     | Type     | Required | Description                                                                                  |
| --------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| `isAdmin` | `Number` | No       | Whether the delete-for-all operation was performed by an administrator. `0` = no. `1` = yes. |
| `extra`   | `String` | No       | Extended data attached to the delete-for-all operation.                                      |

### deleteForMe fields[​](#deleteforme-fields "Direct link to deleteForMe fields")

Present only when `operationType` is `2` (delete for me).

| Field        | Type     | Required | Description                                                                                 |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------- |
| `deleteType` | `Number` | Yes      | Deletion scope. `1` = delete specific message. `2` = delete all messages up to a timestamp. |
| `time`       | `Long`   | No       | Cutoff timestamp (Unix ms). Present only when `deleteType` is `2`.                          |

## Examples[​](#examples "Direct link to Examples")

### Delete for all (`operationType: 1`)[​](#delete-for-all-operationtype-1 "Direct link to delete-for-all-operationtype-1")

JSON

```json
{
  "type": "message:delete",
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "time": 1730192400000,
  "data": [
    {
      "operationType": 1,
      "userId": "user_001",
      "optTime": 1730192400000,
      "os": "Android",
      "channelInfo": {
        "channelType": 3,
        "channelId": "group_001"
      },
      "originalMsgInfo": {
        "messageId": "msg_abc123",
        "messageTime": 1730192300000
      },
      "deleteForAll": {
        "isAdmin": 0
      }
    }
  ]
}

```

### Delete for me (`operationType: 2`)[​](#delete-for-me-operationtype-2 "Direct link to delete-for-me-operationtype-2")

JSON

```json
{
  "type": "message:delete",
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "time": 1730192400000,
  "data": [
    {
      "operationType": 2,
      "userId": "user_001",
      "optTime": 1730192400000,
      "os": "Server",
      "channelInfo": {
        "channelType": 3,
        "channelId": "group_001"
      },
      "originalMsgInfo": {
        "messageId": "msg_abc123",
        "messageTime": 1730192300000
      },
      "deleteForMe": {
        "deleteType": 1
      }
    }
  ]
}

```
