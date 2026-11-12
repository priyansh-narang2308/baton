# Get channels

Retrieve the current user's channel list from the server. The Web platform does not persist channel data locally — all channel lists are fetched from the server.

## Get the channel list[​](#get-the-channel-list "Direct link to Get the channel list")

Use `BaseChannel.createChannelsQuery` to fetch the channel list with pagination support.

TypeScript

```ts
import { BaseChannel } from '@nexconn/chat';

const query = BaseChannel.createChannelsQuery({ pageSize: 20 });
const { code, data: channelList } = await query.loadNextPage();
if (code === 0) {
  console.log('Channel list:', channelList);
} else {
  console.log('Failed to get channels. Code:', code);
}

```

### Parameters[​](#parameters "Direct link to Parameters")

| Parameter   | Type     | Required | Description                                 |
| ----------- | -------- | -------- | ------------------------------------------- |
| `pageSize`  | `number` | No       | Number of channels per page. Default: `20`. |
| `startTime` | `number` | No       | Timestamp to start from for pagination.     |

### Load more channels[​](#load-more-channels "Direct link to Load more channels")

Call `query.loadNextPage()` again to fetch the next page:

TypeScript

```ts
const nextPage = await query.loadNextPage();
if (nextPage.code === 0) {
  console.log('Next page:', nextPage.data);
}

```

## Listen for channel updates[​](#listen-for-channel-updates "Direct link to Listen for channel updates")

Register a channel handler to receive real-time notifications when channel pin or DND status changes:

TypeScript

```ts
import { NCEngine, ChannelHandler } from '@nexconn/chat';

NCEngine.addChannelHandler('my-handler', new ChannelHandler({
  onChannelPinnedSync({ channelIdentifier, isPinned }) {
    console.log('Channel pin changed:', channelIdentifier, isPinned);
  },
  onChannelNoDisturbLevelSync({ channelIdentifier, level }) {
    console.log('Channel DND changed:', channelIdentifier, level);
  },
}));

```

info

On Web, channel data is not stored locally. Each time you need the channel list, fetch it from the server.
