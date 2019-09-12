import fetch from "node-fetch";

export const trackTables = async (
  schema: string,
  tables: string[],
  url: string,
  adminKey: string
) => {
  return Promise.all(
    tables.map(async table => {
      const response = await fetch(`${url}/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": adminKey
        },
        body: JSON.stringify({
          type: "track_table",
          args: {
            schema: schema,
            name: table
          }
        })
      });
      if (!response.ok) {
        throw new Error(
          `${response.status} -> ${response.statusText} : ${JSON.stringify(
            await response.json()
          )}`
        );
      }
      return await response.json();
    })
  );
};
