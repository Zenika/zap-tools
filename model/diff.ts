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

export type DiffResult = {
  operations: Operation[];
  problems: DiffProblem[];
};

export type DiffProblem = {
  entityName: string;
  kind: "table" | "column";
  problem: "removed" | "modified";
};

export const diff = (
  source: ModelDefinition,
  target: ModelDefinition
): DiffResult => {
  const operations: Operation[] = [];
  const problems: DiffProblem[] = [];
  for (const [tableName, table] of Object.entries(source.tables)) {
    if (!target.tables[tableName]) {
      problems.push({
        entityName: tableName,
        kind: "table",
        problem: "removed"
      });
    } else if (
      !isDeepStrictEqual(
        omit(table, "columns"),
        omit(target.tables[tableName], "columns")
      )
    ) {
      problems.push({
        entityName: tableName,
        kind: "table",
        problem: "modified"
      });
    } else {
      for (const [columnName, column] of Object.entries(table.columns)) {
        if (!target.tables[tableName].columns[columnName]) {
          problems.push({
            entityName: columnName,
            kind: "column",
            problem: "removed"
          });
        } else if (
          !isDeepStrictEqual(
            column,
            target.tables[tableName].columns[columnName]
          )
        ) {
          problems.push({
            entityName: columnName,
            kind: "column",
            problem: "modified"
          });
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
  return {
    operations,
    problems
  };
};
