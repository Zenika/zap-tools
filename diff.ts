import { Operation } from "./write";
import { isDeepStrictEqual } from "util";
import { ModelDefinition } from "./sql";

const entries = <T>(obj: T): Array<[keyof T, T[keyof T]]> =>
  Object.entries(obj) as any;

const omit = <T>(obj: T, omittedKey: keyof T): Omit<T, typeof omittedKey> => {
  return Object.fromEntries(
    entries(obj).filter(([key]) => key !== omittedKey)
  ) as any;
};

export const diff = (
  source: ModelDefinition,
  target: ModelDefinition
): Operation[] => {
  const operations: Operation[] = [];
  for (const [tableName, table] of Object.entries(source.tables)) {
    if (!target.tables[tableName]) {
      throw new TypeError("table has been removed");
    } else if (
      !isDeepStrictEqual(
        omit(table, "columns"),
        omit(target.tables[tableName], "columns")
      )
    ) {
      throw new TypeError("table has been modified");
    } else {
      for (const [columnName, column] of Object.entries(table.columns)) {
        if (!target.tables[tableName].columns[columnName]) {
          throw new TypeError("column has been removed");
        } else if (
          !isDeepStrictEqual(
            column,
            target.tables[tableName].columns[columnName]
          )
        ) {
          throw new TypeError("column has been modified");
        }
      }
    }
  }
  for (const [tableName, table] of Object.entries(target.tables)) {
    if (!source.tables[tableName]) {
      operations.push({
        type: "createTable",
        name: tableName,
        table
      });
    } else {
      for (const [columnName, column] of Object.entries(
        target.tables[tableName].columns
      )) {
        if (!source.tables[tableName].columns[columnName]) {
          operations.push({
            type: "addColumn",
            name: columnName,
            table: tableName,
            column: {
              type: column.type,
              constraints: column.constraints
            }
          });
        }
      }
    }
  }
  return operations;
};
