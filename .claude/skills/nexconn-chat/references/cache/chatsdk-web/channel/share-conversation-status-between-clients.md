# Multi-device channel status sync

The Nexconn Chat SDK automatically syncs channel status (pin, DND level) across all connected devices when changes occur.

## How it works[​](#how-it-works "Direct link to How it works")

When a user pins a channel or changes DND settings on one device, all other connected devices receive real-time sync notifications through the `ChannelHandler`.

## Listen for sync events[​](#listen-for-sync-events "Direct link to Listen for sync events")

TypeScript

```ts
import { NCEngine, ChannelHandler } from '@nexconn/chat';

NCEngine.addChannelHandler('sync-handler', new ChannelHandler({
  // Called when a channel's pin status changes
  onChannelPinnedSync({ channelIdentifier, isPinned }) {
    console.log('Pin synced:', channelIdentifier, 'pinned:', isPinned);
    // Update your channel list UI accordingly
  },

  // Called when a channel's DND level changes
  onChannelNoDisturbLevelSync({ channelIdentifier, level }) {
    console.log('DND synced:', channelIdentifier, 'level:', level);
    // Update your DND settings UI accordingly
  },
}));

```

## `ChannelNoDisturbLevel` values[​](#channelnodisturblevel-values "Direct link to channelnodisturblevel-values")

| Value                                 | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `ChannelNoDisturbLevel.ALL_MESSAGE`   | Notify for all messages                              |
| `ChannelNoDisturbLevel.DEFAULT`       | Default notification level (follows global settings) |
| `ChannelNoDisturbLevel.MENTION`       | Notify on any @mention                               |
| `ChannelNoDisturbLevel.MENTION_USERS` | Notify only when mentioned by name                   |
| `ChannelNoDisturbLevel.MENTION_ALL`   | Notify only on @all mentions                         |
| `ChannelNoDisturbLevel.MUTED`         | Fully muted — no notifications                       |

## Remove the handler[​](#remove-the-handler "Direct link to Remove the handler")

TypeScript

```ts
NCEngine.removeChannelHandler('sync-handler');

```
