import test from "tape";
import { createTable, TableDefinition } from "./sql";

const squeezeWhitespace = (s: string) => s.replace(/\s+/g, " ");

test("", t => {
  const table: TableDefinition = {
    columns: {
      column1: {
        type: "int",
        constraints: {
          defaultValue: "1",
          generated: "by default",
          notNull: true,
          unique: true,
          primaryKey: true,
          references: {
            schema: "other_schema",
            table: "other_table",
            column: "other_column",
            match: "full"
          }
        }
      }
    },
    constraints: [
      {
        type: "check",
        expression: "check_expression"
      },
      {
        type: "foreignKey",
        columns: ["column42"],
        references: {
          schema: "schema2",
          table: "table2",
          columns: ["column2"]
        }
      },
      {
        type: "primaryKey",
        columns: ["primaryKeyColumn"]
      },
      {
        type: "unique",
        columns: ["uniqueColumn1", "uniqueColumn2"]
      }
    ]
  };
  const expected = `
    create table "schema"."table" (
      "column1" int not null default 1 generated by default as identity unique primary key references "other_schema"."other_table" ("other_column") match full,
      check (check_expression),
      foreign key ("column42") references "schema2"."table2" ("column2"),
      primary key ("primaryKeyColumn"),
      unique ("uniqueColumn1", "uniqueColumn2")
    )
  `;
  const actual = createTable("schema", "table", table);
  t.equal(squeezeWhitespace(actual), squeezeWhitespace(expected));
  t.end();
});
