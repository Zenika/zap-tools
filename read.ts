import { Client } from "pg";
import { TableDefinition, ColumnDefinition } from "./sql";

export type DiffableModel = {
  tables: { [tableName: string]: Pick<TableDefinition, "constraints"> };
  columns: {
    [tableName: string]: {
      [columnName: string]: Pick<ColumnDefinition, "type" | "constraints">;
    };
  };
};

export const makeDiffable = (model: {
  [tableName: string]: TableDefinition;
}): DiffableModel => {
  return {
    tables: Object.fromEntries(
      Object.entries(model).map(([tableName, table]) => [
        tableName,
        { constraints: table.constraints || [] }
      ])
    ),
    columns: Object.fromEntries(
      Object.entries(model).map(([tableName, table]) => [
        tableName,
        Object.fromEntries(
          Object.entries(table.columns).map(([columnName, column]) => [
            columnName,
            {
              type: column.type,
              constraints: column.constraints || {}
            }
          ])
        )
      ])
    )
  };
};

export const read = async (
  client: Client,
  schema: string
): Promise<DiffableModel> => {
  await client.query("begin");
  const { rows } = await client.query(
    // `
    //   select
    //     "table_config"."table",
    //     json_agg("table_config"."config")->0 as "model",
    //     jsonb_object_agg("column_config"."column", "column_config"."config") as "columns"
    //   from "dms"."table_config"
    //   join "dms"."column_config" on
    //     "column_config"."schema" = "table_config"."schema"
    //     and "column_config"."table" = "table_config"."table"
    //   where "table_config"."schema" = $1
    //   group by "table_config"."table"
    // `,
    `
      select
        json_build_object(
          'tables',
          "table_config"."tables",
          'columns',
          "column_config"."columns"
        ) as "entities"
      from
        (
          select
            coalesce(
              json_object_agg(
                "table",
                "config"
              ),
              json_build_object()
            ) as "tables"
          from "dms"."table_config"
          where "schema" = $1
        ) as "table_config",
        (
          select
            coalesce(
              json_object_agg(
                "table",
                "columns"
              ),
              json_build_object()
            ) as "columns"
            from (
              select
                "table",
                json_object_agg(
                  "column",
                  "config"
                ) as "columns"
              from "dms"."column_config"
              where "schema" = $1
              group by "table"
            ) as "table_column_config"
        ) as "column_config";
    `,
    [schema]
  );
  await client.query("commit");
  return rows[0].entities;
};
