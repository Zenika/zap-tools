import { readFileSync } from "fs";
import { Client } from "pg";
import { write } from "./write";
import { read } from "./read";
import { diff, DiffResult } from "./diff";
import { prepare } from "./prepare";
import { getMetadatas, isMetadatas } from "./metadatas";

const applyModel = async (model: any, options: { drop?: boolean } = {}) => {
  const liveDatabaseConfig = {
    client: "pg",
    connection: {
      host: "localhost",
      port: 5433,
      user: "postgres",
      database: "postgres"
    }
  };

  const client = new Client(liveDatabaseConfig.connection);
  await client.connect();
  try {
    await prepare(client);
    const live = await read(client, model.application.name);
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
  } finally {
    await client.end();
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

const setMetadatas = async (model: { [key: string]: any }, url: string) => {
  const metadatas = await getMetadatas(url);
  if (!isMetadatas(metadatas)) {
    console.error("There was in error checking the type of metadatas");
    return;
  }
};

const main = async () => {
  const modelFile = process.argv[process.argv.length - 2];
  const url = process.argv[process.argv.length - 1];
  const drop = process.argv.includes("--drop");
  const model = JSON.parse(readFileSync(modelFile).toString());
  await applyModel(model, { drop });
  await setMetadatas(model, url);
};

main();
