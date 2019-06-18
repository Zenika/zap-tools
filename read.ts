import { Client } from "pg";
import { TableDefinition, ColumnDefinition, ModelDefinition } from "./sql";

export const read = async (
  client: Client,
  schema: string
): Promise<ModelDefinition> => {
  await client.query("begin");
  await client.query(`create schema if not exists "dms"`);
  await client.query(
    `create table if not exists "dms"."models" ("schema" text not null primary key, "model" json not null)`
  );
  const { rows } = await client.query(
    `
      select model from dms.models where "schema" = $1
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
