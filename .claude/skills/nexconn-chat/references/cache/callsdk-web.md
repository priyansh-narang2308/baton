# Make your first call

Call SDK for Web adds 1-to-1 and group voice and video calling to your app.

Call SDK supports [1-to-1 calls](/callsdk-web/one-to-one-call.md) and [group calls](/callsdk-web/group-call.md). Follow this guide to build both flows from scratch.

## Environment requirements[​](#requirement "Direct link to Environment requirements")

Your browser page must use **HTTPS**, or run on the **localhost** domain.

## Prerequisites[​](#prerequisite "Direct link to Prerequisites")

tip

Each app has two separate App Keys, one for the **development** environment and one for the **production** environment. Data is isolated between the two environments. Before you launch your app, switch to the **production** App Key for end-to-end testing and final rollout.

* Go to the [Console](https://console.nexconn.ai/agile/dashboard/workplace) and register a developer account. After registration, the console automatically creates an app in the development environment.
* On the [Key Management](https://console.nexconn.ai/agile/apps/km) page, get your App Key for the development environment. You can also find your App Secret and data center on the same page.
* Enable the **audio and video calling** service.

## Quickstart[​](#quickstart "Direct link to Quickstart")

Follow these steps to integrate audio and video calling.

### Step 1: Install the SDK[​](#step-1-install-the-sdk "Direct link to Step 1: Install the SDK")

Call SDK for Web depends on `@nexconn/engine`, `@nexconn/chat`, and `@nexconn/call`.

#### NPM[​](#npm "Direct link to NPM")

Install the required packages:

shell

```shell
npm install @nexconn/engine @nexconn/chat @nexconn/call

```

Import and initialize them in an ES6 module:

javascript

```javascript
import { NCEngine } from '@nexconn/chat';
import { NCCallEngine } from '@nexconn/call';

```

caution

If you use TypeScript, set `--esModuleInterop` to `true` for default imports, or use named imports based on each package's exports, such as `import { NCCallEngine } from '@nexconn/call'`.

### Step 2: Request access to media devices[​](#step-2-request-access-to-media-devices "Direct link to Step 2: Request access to media devices")

Call SDK for Web needs access to the microphone and camera. Run `navigator.mediaDevices.getUserMedia({ audio: true, video: true })` in the browser console on your integration page. The browser might prompt the user to grant access.

### Step 3: Initialize with your App Key[​](#step-3-initialize-with-your-app-key "Direct link to Step 3: Initialize with your App Key")

Call SDK uses Engine to establish the signaling connection with Nexconn. To integrate and run the SDK, initialize it in this order:

1. Call `NCEngine.initialize` with your app's [App Key](https://console.nexconn.ai/agile/apps/km). If you reinitialize with a different App Key, the client might clear session data for the current environment. The exact behavior depends on the API definition.
2. Call `NCCallEngine.initialize` to initialize the Call engine and get an `NCCallEngine` instance.

javascript

```javascript
import { NCEngine } from '@nexconn/chat';
import { NCCallEngine } from '@nexconn/call';

NCCallEngine.install();

NCEngine.initialize({
  appKey: '<Your-Appkey>',
});

const ncCallEngine = NCCallEngine.initialize({});

```

The optional parameter type for `NCCallEngine.initialize` is `NCCallInitParams`. Optional fields include `logOutputLevel` and `isPubLowResolutionStream`. For details, see the API documentation.

#### Initialize with CDN[​](#initialize-with-cdn "Direct link to Initialize with CDN")

javascript

```javascript
NCEngine.initialize({
  appKey: '<Your-Appkey>',
});

const ncCallEngine = NCCallEngine.initialize({});

```

### Step 4: Get a user token[​](#step-4-get-a-user-token "Direct link to Step 4: Get a user token")

A token is mapped to a user ID and uniquely identifies an app user in Nexconn. Before a client can use Nexconn services, it must connect to Nexconn Chat and provide a token.

For evaluation and debugging, have your app server register or look up a test user and return an access token for the user whose **userId** is `1`. Copy the token string from your app server's response body.

HTTP

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "code": 200,
  "userId": "1",
  "token": "gxld6GHx3t1eDxof1qtxxYrQcjkbhl1V@sgyu.cn.example.com;sgyu.cn.example.com"
}

```

tip

Nexconn client SDKs do not provide an API for getting tokens. In production, call the Nexconn Server API to register a user and obtain an access token. For details, see the Server API documentation for [Register user](/platform-chat-api/user/register.md).

### Step 5: Connect to Nexconn[​](#step-5-connect-to-nexconn "Direct link to Step 5: Connect to Nexconn")

Before you can place or answer a 1-to-1 call or start a group call, you must connect to Nexconn and authenticate with the user token.

After you get the token, call `NCEngine.connect` and check `isOk` in the result:

javascript

```javascript
const result = await NCEngine.connect({
  token: '<Your-Token>',
});
if (result.isOk) {
  console.log('connect success');
} else {
  console.log('connect failed');
}

```

### Step 6: Add event handlers[​](#step-6-add-event-handlers "Direct link to Step 6: Add event handlers")

Call SDK provides `NCCallEventHandler` for handling call-related events. For example, you can answer or hang up when an incoming call arrives, accept or reject a media type upgrade request, or display the call duration after the call start time is available.

Use `setCallEventHandler` on the `NCCallEngine` instance to register the listener:

typescript

```typescript
// Register app-level call event handlers.
ncCallEngine.setCallEventHandler({
  /**
   * Incoming call notification.
   * When a call comes in, you can answer or hang up.
   * @param event.session Current call session
   * @param event.extra Extra data passed by the caller when the call was started
   */
  async onCallReceived(event: NCCallReceivedEvent) {
    const { session, extra } = event;
    const callId = session.getCallId();
    console.log(`Incoming call, callId: ${callId}`);
    const { code } = await ncCallEngine.acceptCall({ callId });
    console.log(`Accept call result, code: ${code}`);
  },
  /**
   * Participant state changed.
   * @param event.callId Call ID
   * @param event.userId User whose state changed
   * @param event.userState New state
   * @param event.reason Optional reason for the state change
   */
  onRemoteUserStateChanged(event: NCCallRemoteUserStateChangedEvent) {
    const { callId, userId, userState, reason } = event;
    console.log(
      `Participant state changed, callId: ${callId}, userId: ${userId}, userState: ${userState}, reason: ${reason}`
    );
  },
  /**
   * Call connected successfully.
   * @param event.session Current call session
   */
  onCallConnected(event: NCCallConnectedEvent) {
    console.log(`Call connected, callId: ${event.session.getCallId()}`);
  },
  /**
   * Call ended. In a group call, a local hang-up does not always
   * mean the entire call has ended.
   * @param event.session Current call session
   * @param event.reason End reason
   */
  onCallEnded(event: NCCallEndedEvent) {
    const { session, reason } = event;
    console.log(
      `Call ended, callId: ${session.getCallId()}, reason: ${reason}`
    );
  },
});

```

tip

If you do not register `NCCallEventHandler`, the user cannot receive incoming call events such as `onCallReceived`. Register the listener as soon as possible after `NCCallEngine.initialize` returns.

### Step 7: Add video elements for media playback[​](#step-7-add-video-elements-for-media-playback "Direct link to Step 7: Add video elements for media playback")

A video playback element is an [HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) `<video>` that displays a video stream. To show local and remote video, add these two elements to your page. The `video` element with the ID `local_video_element_id` is used for the local stream, and the element with the ID `remote_video_element_id` is used for the remote stream. Audio playback uses an internal `Audio` object created by the SDK, so you do not need to manage it yourself.

html

```html
<video id="local_video_element_id"></video>

```

html

```html
<video id="remote_video_element_id"></video>

```

After the page contains these two elements, call `setLocalVideoView` for the local user and `setRemoteVideoView` for remote users. The SDK handles audio and video playback internally.

typescript

```typescript
/**
 * Bind the local preview.
 * @param localVideoView.videoElement A video element mounted in your page
 */
setLocalVideoView(localVideoView: NCCallLocalVideoView): NCCallSetLocalVideoViewResult

/**
 * Bind remote users' video elements.
 * @param remoteVideoViews Remote bindings
 * @param remoteVideoViews[].userId User ID
 * @param remoteVideoViews[].videoElement A video element mounted in your page
 * @param remoteVideoViews[].enableLowResolutionStream Whether to subscribe to that remote user's low-resolution stream
 */
setRemoteVideoView(remoteVideoViews: NCCallRemoteVideoView[]): NCCallSetRemoteVideoViewResult

```

Set the local and remote video views before placing or answering a call:

typescript

```typescript
ncCallEngine.setLocalVideoView({
  videoElement: document.getElementById(
    'local_video_element_id'
  ) as HTMLVideoElement,
});

ncCallEngine.setRemoteVideoView([
  {
    userId: '<remote-userId>',
    videoElement: document.getElementById(
      'remote_video_element_id'
    ) as HTMLVideoElement,
  },
]);

```

tip

You must set the local video view before placing or answering a call. You can set the remote user's video view in advance, or only after the remote user reaches `NCCallUserState.ONCALL` in the `onRemoteUserStateChanged` callback. If you want the remote low-resolution stream, set `enableLowResolutionStream` to `true` on that remote item.

## Make a 1-to-1 call[​](#one-by-one "Direct link to Make a 1-to-1 call")

Call SDK for Web supports 1-to-1 calls through `NCCallType.SINGLE` and group calls through `NCCallType.MULTI`. This section uses a 1-to-1 call as the example. For a 1-to-1 call, pass only one callee user ID. The call is connected only after the callee answers.

### Step 8: Start a call[​](#step-8-start-a-call "Direct link to Step 8: Start a call")

tip

The `startCall` method accepts a params object containing `calleeIds`, `callType`, `mediaType`, and optional fields like `pushConfig`, `extra`, and `targetId`. `pushConfig` carries mobile push settings through `NCCallPushConfig`, including `pushTitle`, `pushContent`, and platform-specific push attributes. `extra` carries custom data that is passed through to the callee.

You can now call `startCall` with the target user ID to place your first audio or video call. After the call starts successfully, the SDK returns a `callId`.

After `startCall` succeeds, the callee receives the call in the `onCallReceived` listener that you added in step 6. The callee can then complete step 9 to establish the call.

typescript

```typescript
/**
 * Start a call.
 * @param params.calleeIds Callee user id(s). An array with one user ID for one-to-one calls, and multiple user IDs for group calls.
 * @param params.callType Call type: single or group
 * @param params.mediaType Call media type: audio or video
 * @param params.pushConfig Optional push configuration
 * @param params.extra Optional extra data
 * @param params.targetId Optional target ID
 * @returns NCCallStartCallResult with code and callId
 */
const { code, callId } = await ncCallEngine.startCall({
  calleeIds: ['<userId>'],
  callType: NCCallType.SINGLE,
  mediaType: NCCallMediaType.AUDIO_VIDEO,
});

```

### Step 9: Answer the call[​](#step-9-answer-the-call "Direct link to Step 9: Answer the call")

After the callee receives an incoming call through `onCallReceived` in `NCCallEventHandler`, the app can call `acceptCall` on the `NCCallEngine` instance:

typescript

```typescript
/**
 * Incoming call notification.
 * When a call comes in, you can answer or hang up.
 * @param event.session Current call session
 * @param event.extra Extra data passed by the caller when the call was started
 */
async onCallReceived(event: NCCallReceivedEvent) {
  const { session, extra } = event;
  const callId = session.getCallId();
  const { code } = await ncCallEngine.acceptCall({ callId });
  console.log(`Accept call result, code: ${code}`);
}

```

After the call is answered successfully, Call SDK establishes the media session automatically.

## Start a group call[​](#group-call "Direct link to Start a group call")

Call SDK for Web supports group calling through `NCCallType.MULTI`. Starting a group call uses the same method as a 1-to-1 call, but you must set the call type to `NCCallType.MULTI`. Billing starts as soon as the group call is created successfully.

tip

You can invite more users during a 1-to-1 call. After the invitation succeeds, the call type changes to a group call automatically. For details, see [group calls](/callsdk-web/group-call.md).

### Step 10: Place a group call[​](#step-10-place-a-group-call "Direct link to Step 10: Place a group call")

When you call `ncCallEngine.startCall` for a group call, pass the remote user IDs and the media type, and set the call type to `NCCallType.MULTI`. A video call supports up to 16 participants. An audio call supports up to 32 participants.

javascript

```javascript
/**
 * Start a call.
 * @param params.calleeIds Callee user id(s). An array with one user ID for one-to-one calls, and multiple user IDs for group calls.
 * @param params.callType Call type: single or multi-party
 * @param params.mediaType Call media type: audio or video
 * @returns NCCallStartCallResult with code and callId
 */
const { code, callId } = await ncCallEngine.startCall({
  calleeIds: ['<userId1>', '<userId2>'],
  callType: NCCallType.MULTI,
  mediaType: NCCallMediaType.AUDIO_VIDEO,
});

```

The answer flow for a group call is the same as for a 1-to-1 call.

tip

For full implementation guidance, see the [1-to-1 call](/callsdk-web/one-to-one-call.md) and [group call](/callsdk-web/group-call.md) documents. Build the complete 1-to-1 flow first, then add the steps that are specific to group calls.
