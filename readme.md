# pg-schema-json

## Concept

Proof-of-concept for applying JSON-defined data models to an existing Postgres database.

- a model is a collection of table definitions, defined in a JSON file
- each model is applied in their own postgres schema
- models can reference each other

## Limitations

- only possible migrations are creating tables and columns
- deployed model definition is store in db itself, and then used as reference for subsequent diffs
  - if there is a bug in the deployment of a model the stored model definition could become out of sync with the actual deployed model
  - a model expressed as different json but having same db semantics is interpreted as different

## Going further

- allow for migrating a column from non nullable to nullable
- migrate to `pg-promise` for more robust query formatting and nicer transaction syntax
- version stored model definitions instead of updating them in place
- make columns not null by default? makes sense because going from non nullable to nullable is possible but not the reverse
- second model definition "syntax" with slightly higher level of abstraction? (not null by default, id type, reference by model name, auto createdAt/updatedAt)
- write json schema for JSON model definition and derive TypeScript types from it
- find a way to extract a model from postgres introspection facilities? (to fix limitiation 2)
