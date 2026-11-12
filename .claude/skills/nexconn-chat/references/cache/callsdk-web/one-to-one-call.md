# 1-to-1 call

This page explains the main 1-to-1 calling features, including how to place, answer, manage, and end a call in your app.

## Key classes[​](#classes-introduction "Direct link to Key classes")

### NCCallEngine[​](#nccallengine "Direct link to NCCallEngine")

`NCCallEngine` is the core class in Call SDK for Web. It manages call behavior on the client, including placing calls, answering, hanging up, controlling audio and video devices, and managing call logs.

| Method                         | Description                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| setCallEventHandler            | Register app-level events such as incoming calls, call end, participant state changes, and media type changes                                                                   |
| setConnectionQualityHandler    | Register a listener for call quality, including uplink and downlink quality and volume. See the API documentation for details.                                                  |
| setLocalVideoView              | Bind the local user's video element                                                                                                                                             |
| setRemoteVideoView             | Bind one or more remote users' video elements                                                                                                                                   |
| removeVideoView                | Remove the video player for a specific user when you no longer want to watch that user's video                                                                                  |
| createVideoConfigBuilder       | Create a video configuration builder                                                                                                                                            |
| setVideoConfig                 | Apply the video configuration                                                                                                                                                   |
| createAndroidPushConfigBuilder | Create an Android push configuration builder                                                                                                                                    |
| startCall                      | Start a call. Pass params object containing `calleeIds` (array with one or more user IDs), `callType`, `mediaType`, and optional fields like `pushConfig`, `extra`, `targetId`. |
| joinCall                       | Join an ongoing group call directly                                                                                                                                             |
| inviteToCall                   | Invite other users during a call                                                                                                                                                |
| acceptCall                     | Answer a call                                                                                                                                                                   |
| endCall                        | Hang up a call                                                                                                                                                                  |
| requestChangeMediaType         | Request a media type change during a call                                                                                                                                       |
| cancelChangeMediaType          | Cancel a pending media type change request                                                                                                                                      |
| replyChangeMediaType           | Reply to a media type change request                                                                                                                                            |
| getCurrentCallSession          | Get the current call                                                                                                                                                            |
| getOngoingCallLogs             | Get unfinished call logs from the server                                                                                                                                        |
| getHistoryCallLogs             | Query the current user's call history with pagination                                                                                                                           |
| deleteCallLogsForMe            | Delete call logs in batches by `callId`                                                                                                                                         |
| deleteAllCallLogsForMe         | Delete all call logs                                                                                                                                                            |
| enableCamera                   | Turn the camera on or off by passing `true` or `false`                                                                                                                          |
| selectVideoInputDevice         | Select a video input device (camera)                                                                                                                                            |
| enableMicrophone               | Turn the microphone on or off by passing `true` or `false`                                                                                                                      |
| getAudioInputDevices           | Get the list of audio input devices, such as microphones                                                                                                                        |
| selectAudioInputDevice         | Select a microphone input device                                                                                                                                                |
| getAudioOutputDevices          | Get the list of audio output devices, such as speakers                                                                                                                          |
| selectAudioOutputDevice        | Select an audio output device                                                                                                                                                   |
| getVideoInputDevices           | Get the camera (video input) device list                                                                                                                                        |
| isMicrophoneEnabled            | Check whether the local microphone is enabled                                                                                                                                   |
| getVersion                     | Get the SDK version (static method; reads internal `__VERSION__`)                                                                                                               |

### NCCallSession[​](#nccallsession "Direct link to NCCallSession")

`NCCallSession` represents a call and provides methods for reading call details.

| Method                  | Description                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| getCallId()             | Get the call ID                                                                                                       |
| getCallState()          | Get the call state as `NCCallState`                                                                                   |
| getCallType()           | Get the call type as `NCCallType`                                                                                     |
| getMediaType()          | Get the call media type as `NCCallMediaType`                                                                          |
| getRemoteParticipants() | Get remote participants only. Each item contains `userId`, `userState`, `isCameraEnabled`, and `isMicrophoneEnabled`. |
| getCallerUserId()       | Get the caller user ID                                                                                                |
| getInviterUserId()      | Get the inviter user ID                                                                                               |

### NCCallEventHandler[​](#nccalleventhandler "Direct link to NCCallEventHandler")

`NCCallEventHandler` provides callbacks for incoming calls, call state changes, and call logs.

| Callback                         | Description                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onCallReceived                   | Fired when the local user receives an incoming call. `event.session` is the current call session and `event.extra` is the extra data passed by the caller.                                              |
| onCallEnded                      | Fired when a call ends. In a group call, a local hang-up does not always mean the entire call has ended. `event.reason` is the end reason.                                                              |
| onCallConnected                  | Fired when the call is established. The SDK publishes media internally after this point.                                                                                                                |
| onLocalCallLogReceived           | Fired when the local call log is available in `event.callLog` as `NCCallLog`. This callback applies to 1-to-1 calls only.                                                                               |
| onServerCallLogReceived          | Fired when the server pushes a call log in `event.callLog` as `NCCallLog`.                                                                                                                              |
| onMediaTypeChangeRequestReceived | Fired when a media type change request arrives. This callback is supported only in 1-to-1 calls. The event parameters include the requesting `userId`, the `transactionId`, and the target `mediaType`. |
| onMediaTypeChangeResultReceived  | Fired when the media type change result is available. This callback is supported only in 1-to-1 calls.                                                                                                  |
| onRemoteCameraStateChanged       | Fired when the remote camera state changes. `event.disabled === true` means the camera is off.                                                                                                          |
| onRemoteMicrophoneStateChanged   | Fired when the remote microphone state changes. `event.disabled === true` means the microphone is off.                                                                                                  |
| onRemoteUserInvited              | Fired in group calls when remote users are invited to join                                                                                                                                              |
| onRemoteUserStateChanged         | Fired when a participant state changes during the call                                                                                                                                                  |
| onStartTimeReceived              | Fired when the call start time is available. The callback receives only `startTime`.                                                                                                                    |
| onCallTypeChanged                | Fired when the call type changes (for example, a 1-to-1 call is upgraded to a group call).                                                                                                              |

## Call flow[​](#call-flow "Direct link to Call flow")

A 1-to-1 call in Call SDK is a call between two users. The flow is:

1. The caller starts a call. The SDK creates audio and video resources for the caller. The callee receives `onCallReceived`.
2. After the callee answers, the SDK creates audio and video resources for the callee.
3. When the answer succeeds, the caller's and callee's media resources are published to Nexconn media servers.
4. Nexconn signaling notifies both sides that the other user's media is available.
5. Both sides call `setLocalVideoView` and `setRemoteVideoView` to bind the video they want to watch. Audio and video playback is handled internally by the SDK.

For the caller, `startCall` returns a promise that resolves to `{ code: number, callId?: string, busyLineUserList?: { userId: string; userState: NCCallUserState }[] }`. For the callee, `onCallReceived` provides the `NCCallSession` object. Both sides can call `getCurrentCallSession` on the `NCCallEngine` instance to get the current call.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* Audio and video calling is enabled for your [App Key](https://console.nexconn.ai/agile/apps/km).
* You have initialized the Call SDK and obtained an `NCCallEngine` instance. In this document, `ncCallEngine` refers to that initialized instance.

## Register the listener[​](#setCallEventHandler "Direct link to Register the listener")

Call SDK for Web provides `NCCallEventHandler` so your app can react to events from remote users and the server. For example, you can answer or reject incoming calls, accept or reject media type upgrade requests, or show the call duration after the call start time becomes available.

After you get the `NCCallEngine` instance, call `setCallEventHandler()`:

typescript

```typescript
// Register app-level call events.
ncCallEngine.setCallEventHandler({
  /**
   * Incoming call notification.
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
   * Fired when the call ends.
   * In a group call, a local hang-up does not always mean the entire call has ended.
   * @param event.session Current call session
   * @param event.reason End reason
   */
  onCallEnded(event: NCCallEndedEvent) {
    const { session, reason } = event;
    console.log(
      `Call ended, callId: ${session.getCallId()}, reason: ${reason}`
    );
  },

  /**
   * Fired when the call is established. The SDK publishes media internally after this point.
   * @param event.session Current call session
   */
  onCallConnected(event: NCCallConnectedEvent) {
    console.log(`Call connected, callId: ${event.session.getCallId()}`);
  },

  /**
   * Fired when the local call log is available.
   * @param event.callLog Call log. See `NCCallLog` in the API documentation.
   */
  onLocalCallLogReceived(event: NCCallLocalCallLogReceivedEvent) {
    console.log('Local call log', event.callLog);
  },

  /**
   * Fired when a server call log is delivered.
   * @param event.callLog Call log. See `NCCallLog` in the API documentation.
   */
  onServerCallLogReceived(event: NCCallServerCallLogReceivedEvent) {
    console.log('Server call log', event.callLog);
  },

  /**
   * Fired when a media type change request arrives. Supported only in 1-to-1 calls.
   * @param event.userId User ID that requested the change
   * @param event.transactionId Transaction ID for this request and response pair
   * @param event.mediaType Target media type
   */
  onMediaTypeChangeRequestReceived(
    event: NCCallMediaTypeChangeRequestReceivedEvent
  ) {
    const { userId, transactionId, mediaType } = event;
    console.log(
      `Media type change request, userId: ${userId}, transactionId: ${transactionId}, mediaType: ${mediaType}`
    );
    ncCallEngine.replyChangeMediaType({ transactionId, isAgreed: true });
  },

  /**
   * Fired when the media type change result is available. Supported only in 1-to-1 calls.
   * @param event.userId Related user ID
   * @param event.transactionId Transaction ID that matches the original request
   * @param event.mediaType Negotiated media type
   * @param event.result Change result
   */
  onMediaTypeChangeResultReceived(
    event: NCCallMediaTypeChangeResultReceivedEvent
  ) {
    console.log('Media type change result', event);
  },

  /**
   * Fired when the remote camera state changes.
   * @param event.callId Call ID
   * @param event.userId Remote user ID
   * @param event.disabled `true` means the camera is off
   */
  onRemoteCameraStateChanged(event: NCCallRemoteCameraStateChangedEvent) {
    const { callId, userId, disabled } = event;
    console.log(
      `Remote camera state, callId: ${callId}, userId: ${userId}, disabled: ${disabled}`
    );
  },

  /**
   * Fired when the remote microphone state changes.
   * @param event.callId Call ID
   * @param event.userId Remote user ID
   * @param event.disabled `true` means the microphone is off
   */
  onRemoteMicrophoneStateChanged(
    event: NCCallRemoteMicrophoneStateChangedEvent
  ) {
    const { callId, userId, disabled } = event;
    console.log(
      `Remote microphone state, callId: ${callId}, userId: ${userId}, disabled: ${disabled}`
    );
  },

  /**
   * Fired in a group call when remote users are invited.
   * @param event.inviteeUserList Invited user IDs
   * @param event.inviterUserId User ID that sent the invitation
   * @param event.callId Call ID
   */
  onRemoteUserInvited(event: NCCallRemoteUserInvitedEvent) {
    const { inviteeUserList, inviterUserId, callId } = event;
    console.log(
      `Remote users invited, callId: ${callId}, inviteeUserList: ${inviteeUserList}, inviterUserId: ${inviterUserId}`
    );
  },

  /**
   * Fired when a participant state changes during the call.
   * @param event.callId Call ID
   * @param event.userId User whose state changed
   * @param event.userState New state. See `NCCallUserState`.
   * @param event.reason Optional reason for the state change
   */
  onRemoteUserStateChanged(event: NCCallRemoteUserStateChangedEvent) {
    const { callId, userId, userState, reason } = event;
    console.log(
      `Participant state changed, callId: ${callId}, userId: ${userId}, state: ${NCCallUserState[userState]}, reason: ${reason}`
    );
  },

  /**
   * Fired when the call start time becomes available.
   * @param event.startTime Call start timestamp determined by the server or engine
   */
  onStartTimeReceived(event: NCCallStartTimeReceivedEvent) {
    console.log(`Call timer started, startTime: ${event.startTime}`);
  },

  /**
   * Call type changed (for example, 1-to-1 upgraded to group).
   * @param event.callId Call ID
   * @param event.callType New call type
   */
  onCallTypeChanged(event: NCCallTypeChangedEvent) {
    const { callId, callType } = event;
    console.log(`Call type changed, callId: ${callId}, callType: ${callType}`);
  },
});

```

caution

If you do not register `NCCallEventHandler`, you cannot receive incoming call events such as `onCallReceived`. Register it as soon as possible after you initialize the Call SDK.

## Add media playback elements[​](#add-video "Direct link to Add media playback elements")

A video playback element is an [HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement) `<video>` that displays a video stream. To show local and remote video, add the following two elements to your page. The element with the ID `local_video_element_id` is for local video, and the element with the ID `remote_video_element_id` is for remote video. Audio playback uses an internal `Audio` object created by the SDK, so your app does not need to manage it.

html

```html
<video id="local_video_element_id"></video>

```

html

```html
<video id="remote_video_element_id"></video>

```

After these elements are ready, call `setLocalVideoView` for the local user and `setRemoteVideoView` for remote users. The SDK handles audio and video playback internally.

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

Set the local and remote video players before placing or answering the call:

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
    enableLowResolutionStream: true,
  },
]);

```

tip

You must set the local video player before placing or answering a call. You can set the remote player's view in advance, or only after the remote user reaches `NCCallUserState.ONCALL` in `onRemoteUserStateChanged`. If you want the remote low-resolution stream, set `enableLowResolutionStream` to `true` on that remote item.

## Start a call[​](#startCall "Direct link to Start a call")

tip

The `startCall` method accepts a params object containing `calleeIds`, `callType`, `mediaType`, and optional fields like `pushConfig`, `extra`, and `targetId`. `pushConfig` carries mobile push settings through `NCCallPushConfig`, including `pushTitle`, `pushContent`, and platform-specific push attributes. `extra` carries custom data that is passed through to the callee.

Call `startCall` with the params object. If the call starts successfully, the SDK returns a result with a numeric `code` and, on success, a `callId`.

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

## Answer a call[​](#acceptCall "Direct link to Answer a call")

The callee must register `NCCallEventHandler` before the app can receive `onCallReceived` and other call events.

Use `acceptCall` to answer the call or `endCall` to reject it. If the call is answered, Call SDK establishes the media session automatically.

typescript

```typescript
/**
 * Incoming call notification.
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

Call SDK receives call events through the Chat connection to Nexconn, which is established by `NCEngine.connect()`. If the network disconnects unexpectedly, the SDK reconnects automatically.

## Manage the current call[​](#handleCall "Direct link to Manage the current call")

### Audio[​](#audio "Direct link to Audio")

During the call, both the caller and the callee can turn the microphone on or off by calling `enableMicrophone` with `true` or `false`. If one side changes the microphone state, the other side receives `onRemoteMicrophoneStateChanged`.

typescript

```typescript
/**
 * Turn the microphone on or off.
 * @param enable `true` to turn it on, `false` to turn it off
 * @description This call can fail during an active call if resource propagation fails and the remote side does not receive the local state update.
 */
async enableMicrophone(enable: boolean): Promise<NCCallEnableMicrophoneResult>

/**
 * Select the microphone input device.
 * @param params.deviceId Microphone device ID from the browser. Call `getAudioInputDevices` to get the list.
 * @description You can call this during the call.
 */
async selectAudioInputDevice(params: NCCallSelectAudioInputDeviceParams): Promise<NCCallSelectAudioInputDeviceResult>

/**
 * Select the audio output device, such as a speaker.
 * @param params.deviceId Speaker device ID
 */
async selectAudioOutputDevice(params: NCCallSelectAudioOutputDeviceParams): Promise<NCCallSelectAudioOutputDeviceResult>

```

### Video[​](#video "Direct link to Video")

During the call, both the caller and the callee can turn the camera on or off by calling `enableCamera` with `true` or `false`. If one side changes the camera state, the other side receives `onRemoteCameraStateChanged`.

typescript

```typescript
/**
 * Turn the camera on or off.
 * @param enable `true` to turn it on, `false` to turn it off
 * @description This call can fail during an active call if resource propagation fails and the remote side does not receive the local state update.
 */
async enableCamera(enable: boolean): Promise<NCCallEnableCameraResult>

/**
 * Select the video input device (camera).
 * @param params.deviceId Camera device ID from the browser. Call `getVideoInputDevices` to get the list.
 * @description You can call this during the call.
 */
async selectVideoInputDevice(params: NCCallSelectVideoInputDeviceParams): Promise<NCCallSelectVideoInputDeviceResult>

```

### Change the media type[​](#change-the-media-type "Direct link to Change the media type")

> Only 1-to-1 calls support media type changes during a call.

Call SDK defines `NCCallMediaType.AUDIO_VIDEO` for video calls and `NCCallMediaType.AUDIO` for audio calls. During a 1-to-1 call, either side can call `requestChangeMediaType` to request a media type change.

typescript

```typescript
/**
 * Request a media type change during the call.
 * @param params.mediaType Target media type
 * @returns NCCallRequestChangeMediaTypeResult with code and transactionId. Transaction ID is used in later cancel or reply calls.
 */
async requestChangeMediaType(params: NCCallRequestChangeMediaTypeParams): Promise<NCCallRequestChangeMediaTypeResult>

```

The requesting side can also call `cancelChangeMediaType` to cancel the request.

typescript

```typescript
/**
 * Cancel a pending media type change request.
 * @param params.transactionId Transaction ID returned by the original media type change request
 */
async cancelChangeMediaType(params: NCCallCancelChangeMediaTypeParams): Promise<NCCallCancelChangeMediaTypeResult>

```

The remote user receives the request through `onMediaTypeChangeRequestReceived`. After that, the remote side can call `replyChangeMediaType` on the `NCCallEngine` instance to accept or reject the change.

typescript

```typescript
/**
 * Reply to a media type change request.
 * @param params.transactionId Transaction ID received in `onMediaTypeChangeRequestReceived`
 * @param params.isAgreed Whether to agree to the change
 */
async replyChangeMediaType(params: NCCallReplyChangeMediaTypeParams): Promise<NCCallReplyChangeMediaTypeResult>

```

The final result is delivered to both sides through `onMediaTypeChangeResultReceived`.

typescript

```typescript
/**
 * Media type change result. Supported only in 1-to-1 calls.
 * @param event.userId Related user ID
 * @param event.transactionId Transaction ID that uniquely identifies this request and response
 * @param event.mediaType Final media type
 * @param event.result Change result
 * - The requester canceled the request
 * - The responder rejected the request
 * - The server allowed the media type change
 */
onMediaTypeChangeResultReceived(event: NCCallMediaTypeChangeResultReceivedEvent): void

```

## End the call[​](#endCall "Direct link to End the call")

> **Note**
>
> The `endCall` method accepts a params object with optional `callId` and `pushConfig` fields. `pushConfig` carries mobile push settings through `NCCallPushConfig`, including `pushTitle`, `pushContent`, and platform-specific push attributes.

Use `endCall` to hang up an active call or reject an incoming call. Both the caller and the callee can call `endCall()`. If one side ends the call, the other side receives `NCCallEventHandler.onCallEnded()`.

typescript

```typescript
/**
 * End a call.
 * @param params.callId Optional. If omitted, the SDK ends the current primary session.
 * If provided, it can end either the main call or a ringing call that has not been answered yet.
 * A ringing call that has not been answered means a call that arrives while another call is already active.
 * @param params.pushConfig Optional push configuration
 */
async endCall(params?: NCCallEndCallParams): Promise<NCCallEndCallResult>

```

> In a 1-to-1 call, if either side hangs up, the call ends for both sides and Nexconn stops billing immediately.

## Answer an incoming call while already in a call[​](#busy-accept "Direct link to Answer an incoming call while already in a call")

You can answer a new incoming call while another call is active. Because only one active call is allowed at a time, the SDK ends the current call internally before answering the new one.

> **Note**
>
> Call SDK does not support holding and resuming calls during another active call.

Use `acceptCall` to answer the incoming call. The new call becomes the current active call.

typescript

```typescript
/**
 * Answer a call.
 * @param params.callId Call ID
 */
async acceptCall(params: NCCallAcceptCallParams): Promise<NCCallAcceptCallResult>

```

## Get call logs[​](#get-record "Direct link to Get call logs")

### Get call logs after the call ends[​](#get-call-logs-after-the-call-ends "Direct link to Get call logs after the call ends")

After the call ends, or after the user rejects the call, the engine can deliver the server-side call log through **`onServerCallLogReceived`** as `NCCallLog`. In one-to-one calls, the SDK can also deliver a locally constructed call log through **`onLocalCallLogReceived`**. Both callbacks expose the log in `event.callLog`.

typescript

```typescript
/** Server call log delivered as NCCallLog */
onServerCallLogReceived(event: NCCallServerCallLogReceivedEvent): void

/** Local call log delivered as NCCallLog */
onLocalCallLogReceived(event: NCCallLocalCallLogReceivedEvent): void

```

### Query server-side call logs[​](#query-server-side-call-logs "Direct link to Query server-side call logs")

You can also call `getHistoryCallLogs` on the `NCCallEngine` instance to fetch the user's call history from the Nexconn server.

The `order` parameter uses the **`NCCallLogOrder`** enum: `NCCallLogOrder.ASC` (0) loads records after `startTime`; `NCCallLogOrder.DESC` (1) loads records before `startTime` (for example, paging recent history). For the first request when paging recent calls, pass `-1` for `startTime`. To continue, pass the `syncTime` from **`callLogInfo`** as the next `startTime`.

typescript

```typescript
export enum NCCallLogOrder {
  /**
   * Ascending: records after `startTime`
   */
  ASC = 0,
  /**
   * Descending: records before `startTime`
   */
  DESC = 1,
}

```

typescript

```typescript
/**
 * Query the current user's call history with pagination.
 * @param params.startTime Start timestamp. Pass -1 for the first request.
 * @param params.count Number of records per request. Pass a positive integer.
 * @param params.order Sort order. Use `NCCallLogOrder.ASC` or `NCCallLogOrder.DESC`.
 * @returns NCCallGetHistoryCallLogsResult with code and callLogInfo
 * @returns callLogInfo.hasMore Whether more call logs are available
 * @returns callLogInfo.callLogList Call log list as NCCallLog[]
 * @returns callLogInfo.syncTime When hasMore is true, pass this value as the next `startTime`
 */
async getHistoryCallLogs(params: NCCallGetHistoryCallLogsParams): Promise<NCCallGetHistoryCallLogsResult>

```

## Manage video capture configuration[​](#manage-config "Direct link to Manage video capture configuration")

Call SDK uses the browser's default camera and microphone for the local user. The default video resolution is `RESOLUTION_640X480`, and the default frame rate is `FPS_15`. You can build a custom video capture profile with **`NCVideoConfigBuilder`**, then apply it through **`setVideoConfig`**.

### Set the local video capture configuration[​](#set-the-local-video-capture-configuration "Direct link to Set the local video capture configuration")

Create a `NCVideoConfigBuilder` first. Use it to configure resolution, frame rate, and bitrate bounds.

typescript

```typescript
import { NCCallVideoResolution, NCCallVideoFrameRate } from '@nexconn/call';
/**
 * Create a video configuration builder.
 * @returns NCVideoConfigBuilder Used to configure video capture settings such as
 * frame rate, resolution, and bitrate bounds. Call `build()`, then apply the result through `setVideoConfig`.
 */
const videoConfigBuilder = ncCallEngine.createVideoConfigBuilder();

videoConfigBuilder
  .setResolution(NCCallVideoResolution.RESOLUTION_640X360)
  .setFrameRate(NCCallVideoFrameRate.FPS_24)
  .setMinBitrate(300)
  .setMaxBitrate(1200);

const videoConfig = videoConfigBuilder.build();

```

Apply the video configuration:

typescript

```typescript
/**
 * Apply the video configuration.
 * It takes effect the next time media capture starts, such as after you switch the camera
 * or establish a new call.
 */
ncCallEngine.setVideoConfig(videoConfig);

```

## Manage call quality[​](#manage-quality "Direct link to Manage call quality")

Users can receive notifications when call quality changes so they can check their network connection and reduce call interruptions.

### Set NCCallConnectionQualityHandler[​](#set-nccallconnectionqualityhandler "Direct link to Set NCCallConnectionQualityHandler")

To monitor call quality changes, register `NCCallConnectionQualityHandler`. Call `setConnectionQualityHandler()` on the `NCCallEngine` instance.

typescript

```typescript
/**
 * Register a call quality listener, including send and receive quality and volume.
 * @param handler Type `NCCallConnectionQualityHandler`. See the API documentation for definitions and callback frequency.
 */
setConnectionQualityHandler(handler: NCCallConnectionQualityHandler): void

```

**NCCallConnectionQualityHandler** includes the following callbacks:

| Callback                | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| onSendQualityChanged    | The local send link quality changed                                |
| onReceiveQualityChanged | The receive link quality changed. Data can include multiple users. |
| onAudioVolumeChanged    | The call volume changed                                            |
