import { Client } from "pg";
import { ModelDefinition } from "./sql";

export const read = async (
  client: Client,
  schema: string
): Promise<ModelDefinition> => {
  await client.query("begin");
  const { rows } = await client.query(
    `select model from dms.models where "schema" = $1`,
    [schema]
  );
  await client.query("commit");
  if (rows.length === 0) {
    return {
      tables: {}
    };
  }
  return rows[0].model;
};
