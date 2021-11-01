import { Auth } from "./types";
import { useEffect, useState } from "preact/hooks";
import faunadb, {
  Collection,
  Create,
  Get,
  Map,
  Client,
  Documents,
  Lambda,
  Paginate,
  CurrentIdentity,
  Delete,
  values,
} from "faunadb";
import { formatDistanceToNow } from "date-fns";
import ky from "ky";

export default function Websites({
  auth,
  setAuth,
}: {
  auth: Auth;
  setAuth: any;
}) {
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState<values.Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setLoading(true);
    ky.post("/api/token", {
      json: {
        ...auth.data,
        hash: auth.hash,
      },
    })
      .json()
      .then(({ token }: any) =>
        setClient(
          new faunadb.Client({
            secret: token,
            domain: "db.us.fauna.com",
            port: 443,
            scheme: "https",
          })
        )
      )
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div class="h-screen flex items-center justify-center">
        <svg
          class="animate-spin -ml-1 mr-3 h-10 w-10 text-black"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );

  const logout = () => setAuth({});

  const load = () => {
    client
      ?.query<values.Page<values.Document<any>>>(
        Map(
          Paginate(Documents(Collection("websites"))),
          Lambda((x) => Get(x))
        )
      )
      .then(({ data }) => setWebsites(data));
  };

  const add = async (e: any) => {
    e.preventDefault();
    setAdding(true);
    await client
      ?.query(
        Create(Collection("websites"), {
          data: {
            url,
            owner: await client?.query(CurrentIdentity()),
            last_checked: new Date().getTime(),
          },
        })
      )
      .then(load);
    setAdding(false);
  };

  const remove = async (website: any) => {
    await client?.query(Delete(website.ref)).then(load);
  };

  useEffect(load, [client]);

  return (
    <div class="container mx-auto px-4">
      <div class="flex justify-between border-b py-4">
        <div>
          Logged in as{" "}
          <span class="font-bold">
            {auth.data?.first_name} {auth.data?.last_name}
          </span>{" "}
          <span class="font-bold text-gray-700">(@{auth.data?.username})</span>
        </div>
        <button onClick={logout}>Logout</button>
      </div>
      <form class="flex items-end py-4" onSubmit={add}>
        <label class="block flex-grow">
          <span class="text-gray-700">Website URL</span>
          <input
            type="url"
            required
            name="url"
            value={url}
            onChange={(e: Event) => setUrl((e.target as any).value)}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="https://en.wikipedia.org/wiki/Deaths_in_2021"
          />
        </label>
        <button
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-3 disabled:opacity-50"
          type="submit"
          disabled={adding || !url}
        >
          Monitor
        </button>
      </form>
      {websites.map((website: any) => (
        <div class="border rounded-md border-gray-300 shadow-sm mb-4 p-4 flex">
          <div class="flex-grow">
            <h1>{website.data.url}</h1>
            {website.data.last_checked && (
              <div class="flex mt-2 text-gray-700 text-sm items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Last checked {formatDistanceToNow(website.data.last_checked)}{" "}
                ago
              </div>
            )}
            {website.data.last_changed && (
              <div class="flex mt-2 text-gray-700 text-sm items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Last changed {formatDistanceToNow(website.data.last_changed)}{" "}
                ago
              </div>
            )}
          </div>
          <div>
            <button onClick={() => remove(website)} class="text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
