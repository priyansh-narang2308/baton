# Status codes

## NCCallCode[​](#nccallcode "Direct link to NCCallCode")

The following error codes can be returned by APIs on `ncCallEngine`, the Call engine instance:

0

SUCCESS

Request succeeded.

**Troubleshooting:** The request completed successfully.

80001

PARAM\_ERROR

A method parameter is invalid.

**Troubleshooting:** Check the parameter types in the API documentation.

80002

ON\_CALLING

The current user is already in a call and cannot start or join another call.

**Troubleshooting:** Call [endCall](/callsdk-web/one-to-one-call.md#endCall) in your app if needed, then start or join the new call.

80003

NOT\_IN\_CALL

No active call exists.

**Troubleshooting:**

1. The user has not joined a call but a call-related API was invoked.
2. Call `getCurrentCallSession` to get the current session. If it returns `null`, no call has been established.

80004

MEDIA\_TYPE\_INVALID

Changing the media type is not allowed.

**Troubleshooting:**

1. The requested target media type is the same as the current media type.
2. Call `session.getMediaType()` to confirm the current media type.

80005

NOT\_VIDEO\_CALL

The current call is not a video call.

**Troubleshooting:**

1. Confirm that the current session media type is `NCCallMediaType.AUDIO_VIDEO`.
2. If the call is audio-only, do not invoke video-related APIs until the media type changes to video.

80006

VOIP\_SERVICE\_UNAVAILABLE

The RTC service has not taken effect yet, or the RTC service is disabled.

**Troubleshooting:**

1. Check the RTC service purchase page in the Nexconn console and confirm that the **Real-time audio and video** service is enabled.
2. If the service is already enabled and more than 15 minutes have passed, clear the browser cache, including localStorage, refresh the page, and try again.

80007

USER\_LIST\_INVAILD

The user list passed to the method is empty.

**Troubleshooting:** The parameter must be an `Array` and its length must be greater than `0`.

80008

CALL\_ID\_INVALID

The call ID passed to the method is empty.

**Troubleshooting:** Make sure the parameter is not empty and its length is greater than `0`.

80009

TRANSACTION\_ID\_INVALID

The transaction ID passed to the method is empty.

**Troubleshooting:** Make sure the parameter is not empty and its length is greater than `0`.

80010

USER\_ID\_INVALID

The user ID passed to the method is empty.

**Troubleshooting:** Make sure the parameter is not empty and its length is greater than `0`.

80011

SINGLE\_CALL\_NOT\_SUPPORT\_MULTI\_PERSON

A 1-to-1 call can include only one user in the participant list.

**Troubleshooting:** Check that the participant list passed to [startCall](/callsdk-web/one-to-one-call.md#startCall) contains exactly one user.

80012

CHAT\_DISCONNECTED

IM is not connected.

**Troubleshooting:**

1. Make sure you already called `NCEngine.connect({ token })` and that `result.isOk` is `true`.
2. See the Engine or Chat API documentation and use connection-state-related APIs to confirm that the client is online.
3. Call SDK asynchronous APIs must be invoked only after the connection succeeds. For details, see [Quickstart](/callsdk-web.md#quickstart).

80100

CAMERA\_CLOSED

The camera is not enabled.

**Troubleshooting:**

1. Check whether the microphone and camera work correctly on the current device.
2. Check whether the browser has permission to access the microphone and camera.
3. Use [this online page](https://webrtc.github.io/samples/src/content/devices/input-output/) to test whether media devices can be accessed correctly.
4. Call [enableCamera](/callsdk-web/one-to-one-call.md#handleCall) with `true` if you need to turn on the camera in your app.

80101

MICROPHONE\_CLOSED

The microphone is not enabled.

**Troubleshooting:**

1. Check whether the microphone and camera work correctly on the current device.
2. Check whether the browser has permission to access the microphone and camera.
3. Use [this online page](https://webrtc.github.io/samples/src/content/devices/input-output/) to test whether media devices can be accessed correctly.
4. Call [enableMicrophone](/callsdk-web/one-to-one-call.md#handleCall) with `true` if you need to turn on the microphone in your app.

80102

MEDIA\_RESOURCE\_INVALIED

No media resource is available.

**Troubleshooting:**

1. Before playing video, make sure you already called [setLocalVideoView](/callsdk-web/one-to-one-call.md#add-video) or [setRemoteVideoView](/callsdk-web/one-to-one-call.md#add-video) to bind the video view.
2. If playback for the local user fails, use [this online page](https://webrtc.github.io/samples/src/content/devices/input-output/) to verify that the local media devices can be accessed correctly.

80104

PLAY\_MEDIA\_FAILED

Media playback failed.

**Troubleshooting:**

1. Before playing video, make sure you already bound the user's `HTMLVideoElement` with [setLocalVideoView](/callsdk-web/one-to-one-call.md#add-video) or [setRemoteVideoView](/callsdk-web/one-to-one-call.md#add-video).

80105

VIDEO\_VIEW\_NOT\_SET

A video element must be bound before video playback starts.

**Troubleshooting:** Call [setLocalVideoView](/callsdk-web/one-to-one-call.md#add-video) or [setRemoteVideoView](/callsdk-web/one-to-one-call.md#add-video) first and provide a valid `HTMLVideoElement` for the target user.
