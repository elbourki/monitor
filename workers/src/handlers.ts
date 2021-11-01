import faunadb, { Collection, Create, Documents, Get, Index, Lambda, Match, Paginate, Tokens, Map, values, Update } from "faunadb";
const { createHash, createHmac } = require('crypto-browserify');

declare var TELEGRAM_BOT_SECRET: string;
declare var FAUNA_SECRET: string;
declare var SOURCES: KVNamespace;

const client = new faunadb.Client({
  secret: FAUNA_SECRET,
  domain: 'db.us.fauna.com',
  port: 443,
  scheme: 'https',
});


export async function handleRequest(request: Request): Promise<Response> {
  const { hash, ...data } = await request.json();
  const string = Object.keys(data).sort().map(k => (`${k}=${data[k]}`)).join('\n');
  const secret = createHash('sha256').update(TELEGRAM_BOT_SECRET).digest();

  if (createHmac('sha256', secret).update(string).digest('hex') !== hash)
    return new Response('Unauthorized', {
      status: 401
    });

  const user = await client.query<values.Document<any>>(Get(Match(Index('users_by_id'), data.id))).catch(() => client.query<values.Document<any>>(Create(Collection('users'),
    {
      data: {
        id: data.id
      }
    }
  )));

  return new Response(JSON.stringify({
    token: (await client.query(Create(Tokens(), {
      instance: user.ref
    })) as any).secret
  }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "content-type": "application/json"
    }
  });
}

export function handleOptions(request: Request) {
  let headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    let respHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") as string,
    };

    return new Response(null, {
      headers: respHeaders,
    });
  }
  else {
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
      },
    });
  }
}

export async function handleScheduled() {
  const { data } = await client
    ?.query<values.Page<values.Document<any>>>(
      Map(
        Paginate(Documents(Collection("websites"))),
        Lambda((x) => Get(x))
      )
    );

  for (const website of data) {
    const previous = await SOURCES.get(website.ref.id);
    const current = await (await fetch(website.data.url)).text();
    const changed = previous && previous !== current;
    if (changed) {
      const user = await client.query<values.Document<any>>(Get(website.data.owner));
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_SECRET}/sendMessage`, {
        body: JSON.stringify({
          chat_id: user.data.id,
          text: `New content change detected for ${website.data.url}`
        }),
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });
    }

    if (changed || !previous)
      await SOURCES.put(website.ref.id, current);

    await client.query(Update(website.ref, {
      data: {
        last_checked: new Date().getTime(),
        last_changed: changed ? new Date().getTime() : null
      }
    }));
  }
}