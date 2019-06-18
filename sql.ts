export type ModelDefinition = {
  tables: { [tableName: string]: TableDefinition };
};

export type TableDefinition = {
  columns: { [name: string]: ColumnDefinition };
  constraints?: TableConstraintDefinition[];
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
  type: string;
  constraints?: {
    notNull?: boolean;
    defaultValue?: string;
    generated?: "always" | "by default";
    unique?: boolean;
    primaryKey?: boolean;
    references?: {
      schema?: string;
      table?: string;
      column: string;
      match?: ForeignKeyMatchType;
    };
  };
};

type ForeignKeyMatchType = "simple" | "partial" | "full";

export const createTable = (
  schema: string,
  name: string,
  def: TableDefinition
) => `
  create table "${schema}"."${name}" (
    ${[
      Object.entries(def.columns)
        .map(([columnName, column]) =>
          columnDefinition(schema, name, columnName, column)
        )
        .join(",\n"),
      (def.constraints || [])
        .map(constraint => constraintDefinition(schema, name, constraint))
        .join(",\n")
    ]
      .map(s => s.trim())
      .filter(Boolean)
      .join(",\n")}
  )
`;

export const addColumn = (
  schema: string,
  table: string,
  name: string,
  def: ColumnDefinition
): string => {
  return `
    alter table "${schema}"."${table}"
    add column ${columnDefinition(schema, table, name, def)}
  `;
};

const columnDefinition = (
  schema: string,
  table: string,
  name: string,
  def: ColumnDefinition
): string => {
  const constraints = def.constraints || {};
  const notNull = constraints.notNull ? ["not null"] : [];
  const defaultValue = constraints.defaultValue
    ? [`default ${constraints.defaultValue}`]
    : [];
  const generated = constraints.generated
    ? [`generated ${constraints.generated} as identity`]
    : [];
  const unique = constraints.unique ? ["unique"] : [];
  const primaryKey = constraints.primaryKey ? ["primary key"] : [];
  const references = constraints.references
    ? [
        `references "${constraints.references.schema || schema}"."${constraints
          .references.table || table}" ("${constraints.references.column}") ${
          constraints.references.match
            ? `match ${constraints.references.match}`
            : ""
        }`
      ]
    : [];
  const sqlConstraints = [
    ...notNull,
    ...defaultValue,
    ...generated,
    ...unique,
    ...primaryKey,
    ...references
  ];
  return `"${name}" ${def.type} ${sqlConstraints.join(" ")}`;
};

const constraintDefinition = (
  schema: string,
  table: string,
  constraint: TableConstraintDefinition
) => {
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
      )}) references "${constraint.references.schema || schema}"."${constraint
        .references.table || table}" (${columnNameEnumeraton(
        constraint.references.columns
      )})${
        constraint.references.match
          ? ` match ${constraint.references.match}`
          : ""
      }`;
  }
};

const columnNameEnumeraton = (columns: string[]) =>
  columns.map(name => `"${name}"`).join(", ");
