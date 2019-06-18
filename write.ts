import { Client } from "pg";
import {
  createTable,
  TableDefinition,
  addColumn,
  ColumnDefinition,
  ModelDefinition
} from "./sql";
import {
  MASTER_SCHEMA,
  MODEL_TABLE,
  MODEL_TABLE_SCHEMA_COLUMN,
  MODEL_TABLE_MODEL_COLUMN
} from "./prepare";

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

export type WriteOptions = { drop?: boolean };

export const write = async (
  client: Client,
  schema: string,
  model: ModelDefinition,
  operations: Operation[],
  options: WriteOptions = {}
): Promise<void> => {
  if (operations.length === 0) {
    return;
  }
  await client.query("begin");
  if (options.drop) {
    await client.query(`drop schema if exists "${schema}" cascade`);
  }
  await client.query(`create schema if not exists "${schema}"`);
  await updateModelTable(client, schema, model, options);
  for (const operation of operations) {
    await applyOperation(client, schema, operation);
  }
  await client.query("commit");
};

const updateModelTable = async (
  client: Client,
  schema: string,
  model: ModelDefinition,
  options: WriteOptions
) => {
  if (options.drop) {
    await client.query(
      `delete from "${MASTER_SCHEMA}"."${MODEL_TABLE}" where "${MODEL_TABLE_SCHEMA_COLUMN}" = $1`,
      [schema]
    );
  }
  await client.query(
    `
      insert into "${MASTER_SCHEMA}"."${MODEL_TABLE}"
      ("${MODEL_TABLE_SCHEMA_COLUMN}", "${MODEL_TABLE_MODEL_COLUMN}")
      values ($1, $2)
      on conflict ("${MODEL_TABLE_SCHEMA_COLUMN}")
        do update
        set "${MODEL_TABLE_MODEL_COLUMN}" = excluded."${MODEL_TABLE_MODEL_COLUMN}"
    `,
    [schema, model]
  );
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
