import { Operation } from "./write";
import { DiffableModel } from "./read";
import { isDeepStrictEqual } from "util";

export const diff = (
  model: any,
  source: DiffableModel,
  target: DiffableModel
): Operation[] => {
  const operations: Operation[] = [];
  for (const [name, table] of Object.entries(source.tables)) {
    if (!target.tables[name]) {
      throw new TypeError("table has been removed");
    } else if (!isDeepStrictEqual(table, target.tables[name])) {
      throw new TypeError("table has been modified");
    }
  }
  for (const [tableName, columns] of Object.entries(source.columns)) {
    for (const [columnName, column] of Object.entries(columns)) {
      if (!target.columns[tableName] || !target.columns[tableName][columnName]) {
        throw new TypeError("column has been removed");
      } else if (
        !isDeepStrictEqual(column, target.columns[tableName][columnName])
      ) {
        throw new TypeError("column has been modified");
      }
    }
  }
  for (const [tableName, table] of Object.entries(target.tables)) {
    if (!source.tables[tableName]) {
      operations.push({
        type: "createTable",
        name: tableName,
        table: {
          columns: model.tables[tableName].columns,
          constraints: table.constraints
        }
      });
    } else {
      for (const [columnName, column] of Object.entries(target.columns[tableName])) {
        if (!source.columns[tableName][columnName]) {
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
