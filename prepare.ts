import { Client } from "pg";

export const MASTER_SCHEMA = "dms";
export const MODEL_TABLE = "models";
export const MODEL_TABLE_SCHEMA_COLUMN = "schema";
export const MODEL_TABLE_MODEL_COLUMN = "model";

export const prepare = async (client: Client): Promise<void> => {
  await client.query("begin");
  await client.query(`create schema if not exists "${MASTER_SCHEMA}"`);
  await client.query(
    `
      create table if not exists "${MASTER_SCHEMA}"."${MODEL_TABLE}" (
        "${MODEL_TABLE_SCHEMA_COLUMN}" text not null primary key,
        "${MODEL_TABLE_MODEL_COLUMN}" json not null
      )
    `
  );
  await client.query("commit");
};
