import fetch from "node-fetch";
import { readFileSync } from "fs";

export const trackTables = async (
  modelPath: string,
  url: string,
  adminKey: string
) => {
  const model = JSON.parse(readFileSync(modelPath).toString());
  const schema = model.application.name;
  try {
    await Promise.all(
      Object.keys(model.model.tables).map(async table => {
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
    console.log("Tables tracked sucessfuly");
  } catch (err) {
    throw new Error(`Error trying to track tables ${err}`);
  }
};
