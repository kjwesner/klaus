import { DurableObject } from 'cloudflare:workers';
import { schemaSql } from './schema.mjs';

const isPublicAsset = path => /^\/(?:media|vendor)\/[a-z0-9._-]+$/i.test(path)
  || ['/style.css', '/site.js', '/viewer.js', '/access.js', '/blueprint.svg'].includes(path);

function sqliteAdapter(sql) {
  return {
    rebind(nextSql) {
      sql = nextSql;
    },
    exec(statement) {
      return sql.exec(statement);
    },
    prepare(statement) {
      return {
        get(...values) {
          return sql.exec(statement, ...values).toArray()[0];
        },
        all(...values) {
          return sql.exec(statement, ...values).toArray();
        },
        run(...values) {
          const cursor = sql.exec(statement, ...values);
          return { changes: cursor.rowsWritten };
        },
      };
    },
  };
}

export class KlausApplication extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sqlite = sqliteAdapter(this.sql);
    this.atomicContext = ctx;
    this.ready = ctx.blockConcurrencyWhile(async () => {
      globalThis.__KLAUS_CLOUDFLARE__ = true;
      globalThis.__KLAUS_SCHEMA = schemaSql;
      globalThis.__KLAUS_DB = this.sqlite;
      globalThis.__KLAUS_ATOMIC = callback => this.atomicContext.storage.transactionSync(callback);
      const server = await import('../server.mjs');
      this.handleRequest = server.handleCloudflareRequest;
    });
  }

  async fetch(request) {
    await this.ready;
    this.sqlite.rebind(this.ctx.storage.sql);
    this.atomicContext = this.ctx;
    return this.handleRequest(request);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (isPublicAsset(url.pathname)) return env.ASSETS.fetch(request);

    const instance = env.KLAUS_APPLICATION.idFromName('klaus-production');
    return env.KLAUS_APPLICATION.get(instance).fetch(request);
  },
};
