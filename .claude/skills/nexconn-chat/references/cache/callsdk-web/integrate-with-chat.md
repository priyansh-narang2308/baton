# Integrate with your Chat workflow

You can integrate Call into an app that already uses `@nexconn/chat` (Chat SDK) so users get a seamless calling and messaging experience.

## Show call end information in the conversation view[​](#show-call-end-information-in-the-conversation-view "Direct link to Show call end information in the conversation view")

Your app can return to the chat view after a call ends and refresh the conversation list or call list UI based on the call result.

To simplify Chat SDK integration, Call SDK provides call-related data after a 1-to-1 call ends. Your app receives the local call log through `onLocalCallLogReceived` in `NCCallEventHandler`. The log is converted to `NCCallLog`. For related details, see [1-to-1 call](/callsdk-web/one-to-one-call.md).

### Get call end information with NCCallLog[​](#get-call-end-information-with-nccalllog "Direct link to Get call end information with NCCallLog")

warning

Call SDK currently returns call log data through `onLocalCallLogReceived` only when a 1-to-1 call with the type `NCCallType.SINGLE` ends. Group calls are not supported at this time.

When a call ends normally, ends unexpectedly, or is hung up before it is answered, the engine fires **`onLocalCallLogReceived(event: NCCallLocalCallLogReceivedEvent)`**. Use this callback to update your UI or write call data into your app-specific call list.

If the callee is offline, Call SDK resends the related data after the next successful connection, after `NCEngine.connect` returns a result where `result.isOk` is `true`. To receive the event as early as possible, register the listener with `setCallEventHandler` before you establish the connection.

typescript

```typescript
/**
 * Local call log as NCCallLog.
 * Add this callback to your existing `NCCallEventHandler`.
 * @param event.callLog Call log. See `NCCallLog` in the API documentation.
 */
onLocalCallLogReceived(event: NCCallLocalCallLogReceivedEvent) {
  console.log(event.callLog);
}

```
