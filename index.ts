import { readFileSync } from "fs";
import { read, write, computeDiff, MigratePlugin } from "graphql-migrate";
import Knex from "knex";
import { Client } from "pg";
import { AbstractDatabase } from "graphql-migrate/src/abstract/AbstractDatabase";
import { Table } from "graphql-migrate/src/abstract/Table";
import { TableColumn } from "graphql-migrate/src/abstract/TableColumn";
import { write as newWrite, CreateTableOperation } from "./write";

const keyBy = <T>(items: T[], key: keyof T) => {
  return Object.fromEntries(items.map(t => [t[key], t]));
};

const modelToAbstractDatabase = (model: any): AbstractDatabase => {
  const tables = Object.entries(model.model.tables).map(
    ([tableName, table]: [string, any]): Table => {
      const columns = Object.entries(table.columns).map(
        ([columnName, column]: [string, any]): TableColumn => {
          return {
            name: columnName,
            type: column.type,
            nullable: Boolean(
              !(column.constraints && column.constraints.notNull) ||
                (table.constraints &&
                  table.constraints.primaryKey &&
                  table.constraints.primaryKey.length > 0 &&
                  table.constraints.primaryKey.includes(columnName))
            ),
            comment: null,
            annotations: null,
            args: [],
            foreign:
              column.constraints && column.constraints.references
                ? {
                    type: null,
                    field: null,
                    tableName: `${column.constraints.references.schema}.${
                      column.constraints.references.table
                    }`,
                    columnName: column.constraints.references.column
                  }
                : null,
            defaultValue: undefined
          };
        }
      );
      return {
        name: tableName,
        columns,
        columnMap: keyBy(columns, "name"),
        comment: null,
        annotations: null,
        indexes: [],
        primaries:
          table.constraints &&
          table.constraints.primaryKey &&
          table.constraints.primaryKey.length > 0
            ? [{ columns: table.constraints.primaryKey, name: null }]
            : [],
        uniques: []
      };
    }
  );
  return {
    tables,
    tableMap: keyBy(tables, "name")
  };
};

/**
 * This plugin avoids "schema does not exists" errors when apply a brand new model.
 */
class EnsureSchemaExistsPlugin extends MigratePlugin {
  constructor(private schemaName: string) {
    super();
  }
  write({ tap }: any) {
    tap(
      "table.create",
      "before",
      async (op: any, transaction: Knex.Transaction) => {
        await transaction.schema.raw(
          `create schema if not exists "${this.schemaName}"`
        );
      }
    );
  }
}

const applyModel = async (model: any) => {
  const liveDatabaseConfig = {
    client: "pg",
    connection: {
      host: "192.168.99.100",
      port: 5433,
      user: "postgres",
      database: "postgres"
    }
  };

  // const modelDatabase = modelToAbstractDatabase(model);
  // const liveDatabase = await read(liveDatabaseConfig, model.application.name);
  // const operations = await computeDiff(liveDatabase, modelDatabase);
  // console.log(operations);

  // await write(
  //   operations,
  //   liveDatabaseConfig,
  //   model.application.name,
  //   /* tablePrefix */ undefined,
  //   /* columnPrefix */ undefined,
  //   [new EnsureSchemaExistsPlugin(model.application.name)]
  // );

  const client = new Client(liveDatabaseConfig.connection);
  await client.connect();
  const operation: CreateTableOperation = {
    type: "createTable",
    table: {
      name: "lol",
      columns: [
        {
          name: "rofl",
          type: "int",
          constraints: {}
        }
      ],
      constraints: []
    }
  };
  await newWrite(client, model.application.name, [operation]);
  await client.end();
};

const main = async () => {
  for (const file of ["./app-alibeez.json", "./app-humeur.json"]) {
    const model = JSON.parse(readFileSync(file).toString());
    await applyModel(model);
  }
};

main();
