import { Client } from "pg";
import {
  createTable,
  TableDefinition,
  addColumn,
  ColumnDefinition,
  ModelDefinition
} from "./sql";

export type CreateTableOperation = {
  type: "createTable";
  name: string;
  table: TableDefinition;
};

export type AddColumnOperation = {
  type: "addColumn";
  table: string;
  name: string;
  column: ColumnDefinition;
};

export type Operation = CreateTableOperation | AddColumnOperation;

export const write = async (
  client: Client,
  schema: string,
  model: ModelDefinition,
  operations: Operation[],
  options: { drop?: boolean } = {}
): Promise<void> => {
  if (operations.length === 0) {
    return;
  }
  await client.query("begin");
  if (options.drop) {
    await client.query(`drop schema if exists "${schema}" cascade`);
  }
  await client.query(`create schema if not exists "${schema}"`);
  if (options.drop) {
    await client.query(`delete from "dms"."models" where "schema" = $1`, [
      schema
    ]);
  }
  await client.query(
    `insert into dms.models ("schema", model) values ($1, $2) on conflict ("schema") do update set model = excluded.model`,
    [schema, model]
  );
  for (const operation of operations) {
    await applyOperation(client, schema, operation);
  }
  await client.query("commit");
};

const applyOperation = async (
  client: Client,
  schema: string,
  operation: Operation
): Promise<void> => {
  switch (operation.type) {
    case "createTable":
      return applyCreateTable(client, schema, operation);
    case "addColumn":
      return applyAddColumn(client, schema, operation);
  }
};

const applyCreateTable = async (
  client: Client,
  schema: string,
  operation: CreateTableOperation
): Promise<void> => {
  const sql = createTable(schema, operation.name, operation.table);
  await client.query(sql);
};

const applyAddColumn = async (
  client: Client,
  schema: string,
  operation: AddColumnOperation
): Promise<void> => {
  const sql = addColumn(
    schema,
    operation.table,
    operation.name,
    operation.column
  );
  await client.query(sql);
};
