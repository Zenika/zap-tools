import { readFileSync } from "fs";
import { Client } from "pg";
import { write } from "./write";
import { read } from "./read";
import { diff, DiffResult } from "./diff";
import { prepare } from "./prepare";
import { ModelDefinition } from "./sql";

export const applyModel = async (
  modelPath: string,
  options: { drop?: boolean } = {}
) => {
  const model = JSON.parse(readFileSync(modelPath).toString());
  const liveDatabaseConfig = {
    client: "pg",
    connection: {
      host: process.env.PGHOST || "",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || "",
      password: process.env.PASSWORD || "",
      database: process.env.PGDATABASE || ""
    }
  };
  const client = new Client(liveDatabaseConfig.connection);
  try {
    await client.connect();
    await prepare(client);
    const live: ModelDefinition = options.drop
      ? { tables: {} }
      : await read(client, model.application.name);
    const diffResult = diff(live, model.model);
    logDiffResult(model, diffResult);
    if (diffResult.problems.length > 0) {
      return;
    }
    await write(
      client,
      model.application.name,
      model.model,
      diffResult.operations,
      { drop: options.drop }
    );
    await client.end();
    console.log("Model successfuly applied");
  } catch (err) {
    throw new Error(`Error trying to apply model ${err}`);
  }
};

const logDiffResult = (model: any, { operations, problems }: DiffResult) => {
  if (operations.length === 0 && problems.length === 0) {
    console.log(model.application.name, "no operations to apply");
  }
  for (const operation of operations) {
    console.log(
      model.application.name,
      operation.type,
      operation.type === "createTable"
        ? operation.name
        : `${operation.table}.${operation.name}`
    );
  }
  for (const problem of problems) {
    console.error(
      model.application.name,
      "problem",
      problem.kind,
      problem.entityName,
      problem.problem
    );
  }
};
