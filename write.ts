import { Client } from "pg";
import {
  createTable,
  TableDefinition,
  addColumn,
  ColumnDefinition
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
  operations: Operation[],
  options: { drop?: boolean } = {}
): Promise<void> => {
  await client.query("begin");
  if (options.drop) {
    await client.query(`drop schema if exists "${schema}" cascade`);
  }
  await client.query(`create schema if not exists "${schema}"`);
  await client.query(`create schema if not exists "dms"`);
  await client.query(
    `create table if not exists "dms"."table_config" ("schema" text not null, "table" text not null, "config" json not null, primary key ("schema", "table"))`
  );
  await client.query(
    `create table if not exists "dms"."column_config" ("schema" text not null, "table" text not null, "column" text not null, "config" json not null, primary key ("schema", "table", "column"))`
  );
  if (options.drop) {
    await client.query(`delete from "dms"."table_config" where "schema" = $1`, [
      schema
    ]);
    await client.query(
      `delete from "dms"."column_config" where "schema" = $1`,
      [schema]
    );
  }
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
  await client.query(
    `insert into "dms"."table_config" ("schema", "table", "config") values ($1, $2, $3)`,
    [
      schema,
      operation.name,
      JSON.stringify({ constraints: operation.table.constraints })
    ]
  );
  for (const [columnName, column] of Object.entries(operation.table.columns)) {
    await client.query(
      `insert into "dms"."column_config" ("schema", "table", "column", "config") values ($1, $2, $3, $4)`,
      [
        schema,
        operation.name,
        columnName,
        JSON.stringify({
          type: column.type,
          constraints: column.constraints
        })
      ]
    );
  }
};

// UNTESTED
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
  await client.query(
    `insert into "dms"."column_config" ("schema", "table", "column", "config") values ($1, $2, $3, $4)`,
    [
      schema,
      operation.table,
      operation.name,
      JSON.stringify({
        type: operation.column.type,
        constraints: operation.column.constraints
      })
    ]
  );
};
