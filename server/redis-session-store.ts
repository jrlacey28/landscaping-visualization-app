import net from "net";
import tls from "tls";
import session from "express-session";

type RedisReply = string | number | null | RedisReply[];

interface RedisSessionStoreOptions {
  url: string;
  prefix?: string;
  ttlSeconds?: number;
}

interface ParsedRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls: boolean;
}

function parseRedisUrl(redisUrl: string): ParsedRedisConfig {
  const parsed = new URL(redisUrl);
  const tlsEnabled = parsed.protocol === "rediss:";

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(`Unsupported Redis protocol: ${parsed.protocol}`);
  }

  const dbPath = parsed.pathname.replace("/", "");

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password || undefined,
    db: dbPath ? Number(dbPath) : 0,
    tls: tlsEnabled,
  };
}

function encodeCommand(parts: string[]): Buffer {
  const chunks: string[] = [`*${parts.length}\r\n`];
  for (const part of parts) {
    chunks.push(`$${Buffer.byteLength(part)}\r\n${part}\r\n`);
  }
  return Buffer.from(chunks.join(""), "utf8");
}

function parseResp(buffer: Buffer, offset = 0): { value: RedisReply; offset: number } | null {
  if (offset >= buffer.length) {
    return null;
  }

  const type = String.fromCharCode(buffer[offset]);
  const findCrlf = (start: number) => buffer.indexOf("\r\n", start);

  if (type === "+" || type === "-" || type === ":") {
    const lineEnd = findCrlf(offset + 1);
    if (lineEnd === -1) return null;
    const raw = buffer.slice(offset + 1, lineEnd).toString("utf8");
    if (type === "-") {
      throw new Error(`Redis error: ${raw}`);
    }
    const value: RedisReply = type === ":" ? Number(raw) : raw;
    return { value, offset: lineEnd + 2 };
  }

  if (type === "$") {
    const lineEnd = findCrlf(offset + 1);
    if (lineEnd === -1) return null;
    const length = Number(buffer.slice(offset + 1, lineEnd).toString("utf8"));
    if (length === -1) {
      return { value: null, offset: lineEnd + 2 };
    }
    const bodyStart = lineEnd + 2;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd + 2) return null;
    const value = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    return { value, offset: bodyEnd + 2 };
  }

  if (type === "*") {
    const lineEnd = findCrlf(offset + 1);
    if (lineEnd === -1) return null;
    const count = Number(buffer.slice(offset + 1, lineEnd).toString("utf8"));
    if (count === -1) {
      return { value: null, offset: lineEnd + 2 };
    }
    const values: RedisReply[] = [];
    let cursor = lineEnd + 2;
    for (let i = 0; i < count; i += 1) {
      const parsed = parseResp(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.offset;
    }
    return { value: values, offset: cursor };
  }

  throw new Error(`Unsupported Redis response type: ${type}`);
}

export class RedisSessionStore extends session.Store {
  private readonly config: ParsedRedisConfig;
  private readonly prefix: string;
  private readonly defaultTtlSeconds: number;

  constructor(options: RedisSessionStoreOptions) {
    super();
    this.config = parseRedisUrl(options.url);
    this.prefix = options.prefix ?? "sess:";
    this.defaultTtlSeconds = options.ttlSeconds ?? 24 * 60 * 60;
  }

  private execute(command: string[]): Promise<RedisReply> {
    return new Promise((resolve, reject) => {
      const socket = this.config.tls
        ? tls.connect({ host: this.config.host, port: this.config.port })
        : net.connect({ host: this.config.host, port: this.config.port });

      let pending = Buffer.alloc(0);
      let initialized = false;

      const finalize = (value: RedisReply) => {
        socket.end();
        resolve(value);
      };

      socket.on("connect", () => {
        const commands: string[][] = [];
        if (this.config.password) commands.push(["AUTH", this.config.password]);
        if (this.config.db) commands.push(["SELECT", String(this.config.db)]);
        commands.push(command);

        socket.write(Buffer.concat(commands.map(encodeCommand)));
        initialized = true;
      });

      socket.on("data", (chunk) => {
        pending = Buffer.concat([pending, chunk]);

        try {
          let parserOffset = 0;
          const parsedReplies: RedisReply[] = [];
          while (parserOffset < pending.length) {
            const parsed = parseResp(pending, parserOffset);
            if (!parsed) break;
            parsedReplies.push(parsed.value);
            parserOffset = parsed.offset;
          }

          if (!initialized || parsedReplies.length === 0) {
            return;
          }

          const authAndSelectOffset = (this.config.password ? 1 : 0) + (this.config.db ? 1 : 0);
          if (parsedReplies.length > authAndSelectOffset) {
            finalize(parsedReplies[authAndSelectOffset]);
          }
        } catch (error) {
          socket.destroy();
          reject(error);
        }
      });

      socket.on("error", (error) => {
        reject(error);
      });
    });
  }

  private key(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  private ttl(sess: session.SessionData): number {
    const maxAgeMs = typeof sess.cookie?.maxAge === "number" ? sess.cookie.maxAge : undefined;
    if (!maxAgeMs || maxAgeMs <= 0) {
      return this.defaultTtlSeconds;
    }
    return Math.max(1, Math.ceil(maxAgeMs / 1000));
  }

  override get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void): void {
    this.execute(["GET", this.key(sid)])
      .then((reply) => {
        if (reply === null) {
          callback(undefined, null);
          return;
        }
        const parsed = JSON.parse(String(reply)) as session.SessionData;
        callback(undefined, parsed);
      })
      .catch((error) => callback(error));
  }

  override set(sid: string, sess: session.SessionData, callback?: (err?: any) => void): void {
    const ttlSeconds = this.ttl(sess);
    this.execute(["SETEX", this.key(sid), String(ttlSeconds), JSON.stringify(sess)])
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  override destroy(sid: string, callback?: (err?: any) => void): void {
    this.execute(["DEL", this.key(sid)])
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  override touch(sid: string, sess: session.SessionData, callback?: () => void): void {
    const ttlSeconds = this.ttl(sess);
    this.execute(["EXPIRE", this.key(sid), String(ttlSeconds)])
      .then(() => callback?.())
      .catch(() => callback?.());
  }
}

