# pg-schema-json

## Concept

Proof-of-concept for applying JSON-defined data models to an existing Postgres database.

- a model is a collection of table definitions, defined in a JSON file
- each model is applied in their own postgres schema
- models can reference each other

## Limitations

The code makes heavy use of `graphql-migrate`, which is not very mature and has the following issues:
- defining auto-incrementing columns is done through the type `increments` instead of a more postgres-y way, because of the way graphql-migrate leans on the underlying knex module
- making a column auto-incrementing throws off the diff algorithm because postgres automatically assigns a default value (of the form `next_val(...)`), but the input column definition does not have a default value
- there is an inconsistency between reading and writing column definitions to postgres in regards to the default value:
  - if an input column definition has the default to `null`, then the generated SQL has `DEFAULT NULL` even if the column is non nullable
  - columns with no default value are read with a default value set to `null`

## Going further

- Remove graphql-migrate? The reader, writer, and diff algorithm would need to be replaced.
  - The diff algorihm could be a lot simpler because I think we only would allow new tables and new columns. All other modifications would throw an error.
  - The writer is probably simple and could be inspired from the code from Hasura's console (see [here](https://github.com/hasura/graphql-engine/blob/master/console/src/components/Services/Data/Add/AddActions.js#L93))
  - The reader? Maybe OK using postgres built-in `information_schema`
