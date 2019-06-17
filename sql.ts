export type TableDefinition = {
  name: string;
  columns: ColumnDefinition[];
  constraints: TableConstraintDefinition[];
};

export type TableConstraintDefinition =
  | {
      type: "check";
      expression: string;
    }
  | { type: "unique"; columns: string[] }
  | { type: "primaryKey"; columns: string[] }
  | {
      type: "foreignKey";
      columns: string[];
      references: {
        schema: string;
        table: string;
        columns: string[];
        match?: ForeignKeyMatchType;
      };
    };

export type ColumnDefinition = {
  name: string;
  type: string;
  constraints: {
    notNull?: boolean;
    defaultValue?: string;
    generated?: "always" | "by default";
    unique?: boolean;
    primaryKey?: boolean;
    references?: {
      schema: string;
      table: string;
      column: string;
      match?: ForeignKeyMatchType;
    };
  };
};

type ForeignKeyMatchType = "simple" | "partial" | "full";

export const createTable = (schema: string, table: TableDefinition) => `
  create table "${schema}"."${table.name}" (
    ${[
      table.columns.map(columnDefinition).join(",\n"),
      table.constraints.map(constraintDefinition).join(",\n")
    ]
      .map(s => s.trim())
      .filter(Boolean)
      .join(",\n")}
  )
`;

export const addColumn = (
  schema: string,
  table: string,
  column: ColumnDefinition
): string => {
  return `
    alter table "${schema}"."${table}"
    add column ${columnDefinition(column)}
  `;
};

const columnDefinition = (column: ColumnDefinition): string => {
  const notNull = column.constraints.primaryKey ? ["not null"] : [];
  const defaultValue = column.constraints.defaultValue
    ? [`default ${column.constraints.defaultValue}`]
    : [];
  const generated = column.constraints.generated
    ? [`generated ${column.constraints.generated} as identity`]
    : [];
  const unique = column.constraints.unique ? ["unique"] : [];
  const primaryKey = column.constraints.primaryKey ? ["primary key"] : [];
  const references = column.constraints.references
    ? [
        `references "${column.constraints.references.schema}"."${
          column.constraints.references.table
        }" ("${column.constraints.references.column}") ${
          column.constraints.references.match
            ? `match ${column.constraints.references.match}`
            : ""
        }`
      ]
    : [];
  const constraints = [
    ...notNull,
    ...defaultValue,
    ...generated,
    ...unique,
    ...primaryKey,
    ...references
  ];
  return `"${column.name}" ${column.type} ${constraints.join(" ")}`;
};

const constraintDefinition = (constraint: TableConstraintDefinition) => {
  switch (constraint.type) {
    case "check":
      return `check (${constraint.expression})`;
    case "unique":
      return `unique (${columnNameEnumeraton(constraint.columns)})`;
    case "primaryKey":
      return `primary key (${columnNameEnumeraton(constraint.columns)})`;
    case "foreignKey":
      return `foreign key (${columnNameEnumeraton(
        constraint.columns
      )}) references "${constraint.references.schema}"."${
        constraint.references.table
      }" (${columnNameEnumeraton(constraint.references.columns)})${
        constraint.references.match
          ? ` match ${constraint.references.match}`
          : ""
      }`;
  }
};

const columnNameEnumeraton = (columns: string[]) =>
  columns.map(name => `"${name}"`).join(", ");
