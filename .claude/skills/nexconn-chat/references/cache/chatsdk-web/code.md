# Status codes

This page lists the status codes returned by the Nexconn Chat SDK. Use these codes to handle errors and troubleshoot issues in your application.

## Connection status codes[​](#connection-status-codes "Direct link to Connection status codes")

| Code    | Description                                                                         |
| ------- | ----------------------------------------------------------------------------------- |
| `0`     | Success                                                                             |
| `-1`    | Timeout                                                                             |
| `30001` | Parameter error                                                                     |
| `30002` | Connection not established. Ensure `connect` succeeds before calling business APIs. |
| `30003` | Not in the open channel                                                             |
| `30004` | Exceeded the message frequency limit                                                |
| `30007` | Sending failed — message was rejected                                               |
| `30009` | Open channel message storage not enabled                                            |
| `30010` | Open channel does not exist                                                         |
| `30014` | User has been kicked from the open channel                                          |
| `30016` | The message has been recalled or does not exist                                     |
| `31004` | Token is incorrect or expired                                                       |
| `31005` | App Key does not match the token                                                    |
| `31009` | User has been blocked                                                               |
| `31010` | User has been kicked. Another device logged in with the same credentials.           |
| `33001` | SDK not initialized                                                                 |
| `33002` | The database is not open                                                            |
| `33003` | The open channel has been destroyed                                                 |
| `33007` | Auto reconnect count exceeded. Manual reconnection required.                        |
| `34001` | Navigation request failed                                                           |
| `34006` | App Key is invalid                                                                  |
