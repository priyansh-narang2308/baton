import type { NexconnConfig } from "../env";
import { signedHeaders } from "./sign";

export class NexconnApiError extends Error {
  constructor(
    readonly path: string,
    readonly httpStatus: number,
    readonly code: number | undefined,
    message: string,
  ) {
    super(`Nexconn ${path} failed (http ${httpStatus}, code ${code ?? "n/a"}): ${message}`);
  }
}

type ApiResponse<T> = { code: number; result?: T; msg?: string; message?: string };

const TIMEOUT_MS = 5_000; // docs: switch to backup domain after a 5 s timeout

/**
 * Minimal signed client for the Nexconn Platform Chat API (all endpoints are POST + JSON).
 * Fails over from the primary to the backup domain on timeouts, network errors and 5xx.
 */
export class NexconnApi {
  private domainIndex = 0;
  constructor(private readonly cfg: NexconnConfig) {}

  async call<T>(path: string, body: unknown): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.cfg.domains.length; attempt++) {
      const domain = this.cfg.domains[(this.domainIndex + attempt) % this.cfg.domains.length];
      try {
        const res = await fetch(`https://${domain}${path}`, {
          method: "POST",
          headers: signedHeaders(this.cfg.appKey, this.cfg.appSecret),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
        if (res.status >= 500) throw new NexconnApiError(path, res.status, undefined, await res.text());
        const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
        if (!res.ok || json.code !== 0) {
          throw new NexconnApiError(path, res.status, json.code, json.msg ?? json.message ?? JSON.stringify(json));
        }
        this.domainIndex = (this.domainIndex + attempt) % this.cfg.domains.length;
        return json.result as T;
      } catch (err) {
        lastError = err;
        const retryable = !(err instanceof NexconnApiError) || err.httpStatus >= 500;
        if (!retryable) throw err;
      }
    }
    throw lastError;
  }

  // POST /v4/auth/access-token/issue — rate limit 200/s
  issueToken(userId: string, name: string) {
    return this.call<{ userId: string; accessToken: string }>("/v4/auth/access-token/issue", { userId, name });
  }

  // POST /v4/group-channel/create — `owner` joins automatically; ≤30 userIds per request.
  // Default joinPerm (0 = owner approval) keeps clients from self-joining; members are added server-side.
  createGroup(channelId: string, name: string, owner: string, userIds: string[] = []) {
    return this.call<unknown>("/v4/group-channel/create", { channelId, name, owner, userIds });
  }

  // POST /v4/group-channel/join — ≤100 users per request
  joinGroup(channelId: string, userIds: string[]) {
    return this.call<unknown>("/v4/group-channel/join", { channelId, userIds });
  }

  // POST /v4/group-channel/leave — ≤100 users per request
  leaveGroup(channelId: string, userIds: string[]) {
    return this.call<unknown>("/v4/group-channel/leave", { channelId, userIds });
  }

  // POST /v4/group-channel/message/send — 20 msg/s; metadata only when exactly one group and not targeted
  async sendGroupMessage(input: {
    fromUserId: string;
    groupId: string;
    messageType: string;
    content: Record<string, unknown>;
    metadata?: Record<string, string>;
    toUserIds?: string[];
    pushContent?: string;
    isEchoToSender?: boolean;
  }) {
    const targeted = Boolean(input.toUserIds?.length);
    const result = await this.call<{ messageIds: { channelId: string; messageId: string }[] }>("/v4/group-channel/message/send", {
      fromUserId: input.fromUserId,
      toChannelIds: [input.groupId],
      ...(targeted ? { toUserIds: input.toUserIds } : {}),
      messageType: input.messageType,
      content: JSON.stringify(input.content),
      ...(input.pushContent ? { pushContent: input.pushContent } : {}),
      isEchoToSender: input.isEchoToSender ? 1 : 0,
      ...(!targeted && input.metadata ? { hasMetadata: true, metadata: input.metadata } : {}),
    });
    return result.messageIds[0]?.messageId;
  }

  // POST /v4/direct-channel/message/send — 6,000 msg/min
  async sendDirectMessage(input: {
    fromUserId: string;
    toUserIds: string[];
    messageType: string;
    content: Record<string, unknown>;
    pushContent?: string;
  }) {
    const result = await this.call<{ messageIds: { userId: string; messageId: string }[] }>("/v4/direct-channel/message/send", {
      fromUserId: input.fromUserId,
      toUserIds: input.toUserIds,
      messageType: input.messageType,
      content: JSON.stringify(input.content),
      ...(input.pushContent ? { pushContent: input.pushContent } : {}),
    });
    return result.messageIds;
  }

  // POST /v4/channel-type/message/metadata/set — shares the group-send quota (20/s) for group messages
  setMessageMetadata(input: { messageId: string; operatorUserId: string; groupId: string; metadata: Record<string, string> }) {
    return this.call<unknown>("/v4/channel-type/message/metadata/set", {
      messageId: input.messageId,
      userId: input.operatorUserId,
      channelType: 3,
      channelId: input.groupId,
      metadata: input.metadata,
      isEchoToSender: 1,
    });
  }
}
