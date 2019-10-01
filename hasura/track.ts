import fetch from "node-fetch";
import { SubCommandArguments } from "..";
import { readFileSync } from "fs";

export const trackTables = async (
  args: SubCommandArguments
) => {
  const model = JSON.parse(
    readFileSync(args.modelFile).toString()
  );
  const schema = model.application.name;
  Promise.all(
    Object.keys(model.model.tables).map(async table => {
      const response = await fetch(`${args.url}/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": args.adminKey
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
