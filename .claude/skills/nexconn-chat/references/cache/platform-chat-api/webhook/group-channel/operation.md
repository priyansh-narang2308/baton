# Group channel operation

The `group_channel:operation` event fires when a member-level or group-level operation occurs: a group is created or dissolved, members join or leave, members are added or removed as administrators, or channel ownership is transferred.

For the complete webhook setup and signature verification guide, see [Webhooks overview](/platform-chat-api/webhook/overview.md).

## Event type[​](#event-type "Direct link to Event type")

`group_channel:operation`

## Payload[​](#payload "Direct link to Payload")

### Envelope[​](#envelope "Direct link to Envelope")

| Field  | Type     | Required | Description                                                                   |
| ------ | -------- | -------- | ----------------------------------------------------------------------------- |
| `type` | `String` | Yes      | `"group_channel:operation"`                                                   |
| `id`   | `String` | Yes      | Unique event ID.                                                              |
| `time` | `Long`   | Yes      | Event generation time (Unix ms).                                              |
| `data` | `Array`  | Yes      | Array containing one group operation object. See [Data fields](#data-fields). |

### Data fields[​](#data-fields "Direct link to Data fields")

| Field      | Type    | Required | Description                                                                                                                        |
| ---------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `profiles` | `Array` | Yes      | List of group operation records. Each element describes one operation on one group. See [profiles\[i\] fields](#profilesi-fields). |

### profiles\[i] fields[​](#profilesi-fields "Direct link to profiles\[i] fields")

| Field           | Type     | Required | Description                                                                                                     |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `channelId`     | `String` | Yes      | The group ID.                                                                                                   |
| `operationType` | `Number` | Yes      | Operation type. See [Operation types](#operation-types).                                                        |
| `time`          | `Long`   | Yes      | Time the operation was performed (Unix ms).                                                                     |
| `userId`        | `String` | No       | The user ID of the person who performed the operation (e.g., the group creator, the admin who kicked a member). |
| `members`       | `Array`  | No       | User IDs of the affected members (e.g., the users who joined, were kicked, or were promoted/demoted).           |

### Operation types[​](#operation-types "Direct link to Operation types")

| Value | Meaning                                                                                  |
| ----- | ---------------------------------------------------------------------------------------- |
| `1`   | **Group created** — A new group was created.                                             |
| `2`   | **Member joined** — One or more users joined or were added to the group.                 |
| `3`   | **Member kicked** — One or more users were removed from the group by an administrator.   |
| `4`   | **Member left** — One or more users voluntarily left the group.                          |
| `5`   | **Group dissolved** — The group was disbanded.                                           |
| `6`   | **Administrator added** — One or more members were promoted to administrator.            |
| `7`   | **Administrator removed** — One or more administrators were demoted to regular member.   |
| `8`   | **Ownership transferred** — Channel ownership was transferred to another channel member. |

## Example[​](#example "Direct link to Example")

JSON

```json
{
  "type": "group_channel:operation",
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "time": 1730192400000,
  "data": [
    {
      "profiles": [
        {
          "channelId": "group_001",
          "operationType": 2,
          "time": 1730192400000,
          "userId": "user_001",
          "members": ["user_002"]
        }
      ]
    }
  ]
}

```
