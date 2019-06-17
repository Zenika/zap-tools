export type TableDefinition = {
  columns: { [name: string]: ColumnDefinition };
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

export const createTable = (
  schema: string,
  name: string,
  def: TableDefinition
) => `
  create table "${schema}"."${name}" (
    ${[
      Object.entries(def.columns)
        .map(([columnName, column]) => columnDefinition(columnName, column))
        .join(",\n"),
      def.constraints.map(constraintDefinition).join(",\n")
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
    add column ${columnDefinition(name, def)}
  `;
};

const columnDefinition = (name: string, def: ColumnDefinition): string => {
  const notNull = def.constraints.primaryKey ? ["not null"] : [];
  const defaultValue = def.constraints.defaultValue
    ? [`default ${def.constraints.defaultValue}`]
    : [];
  const generated = def.constraints.generated
    ? [`generated ${def.constraints.generated} as identity`]
    : [];
  const unique = def.constraints.unique ? ["unique"] : [];
  const primaryKey = def.constraints.primaryKey ? ["primary key"] : [];
  const references = def.constraints.references
    ? [
        `references "${def.constraints.references.schema}"."${
          def.constraints.references.table
        }" ("${def.constraints.references.column}") ${
          def.constraints.references.match
            ? `match ${def.constraints.references.match}`
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
  return `"${name}" ${def.type} ${constraints.join(" ")}`;
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
