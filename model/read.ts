import { Client } from "pg";
import { ModelDefinition } from "./sql";
import { MASTER_SCHEMA, MODEL_TABLE, MODEL_TABLE_SCHEMA_COLUMN } from "./prepare";

export const read = async (
  client: Client,
  schema: string
): Promise<ModelDefinition> => {
  await client.query("begin");
  const { rows } = await client.query(
    `
      select model
      from "${MASTER_SCHEMA}"."${MODEL_TABLE}"
      where "${MODEL_TABLE_SCHEMA_COLUMN}" = $1
    `,
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
