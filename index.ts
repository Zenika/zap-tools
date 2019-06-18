import { readFileSync } from "fs";
import { Client } from "pg";
import { write as newWrite } from "./write";
import { read as newRead } from "./read";
import { diff, DiffResult } from "./diff";
import { prepare } from "./prepare";

const applyModel = async (model: any) => {
  const liveDatabaseConfig = {
    client: "pg",
    connection: {
      host: "192.168.99.100",
      port: 5433,
      user: "postgres",
      database: "postgres"
    }
  };

  const client = new Client(liveDatabaseConfig.connection);
  await client.connect();
  try {
    await prepare(client);
    const live = await newRead(client, model.application.name);
    const diffResult = diff(live, model.model);
    logDiffResult(model, diffResult);
    if (diffResult.problems.length === 0) {
      await newWrite(
        client,
        model.application.name,
        model.model,
        diffResult.operations
      );
    }
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

const main = async () => {
  for (const file of ["./app-alibeez.json", "./app-humeur.json"]) {
    const model = JSON.parse(readFileSync(file).toString());
    await applyModel(model);
  }
};

main();
