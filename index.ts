import { readFileSync } from "fs";
import { Client } from "pg";
import { write as newWrite, Operation } from "./write";
import { read as newRead } from "./read";
import { diff } from "./diff";

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
    const live = await newRead(client, model.application.name);
    const operations = diff(live, model.model);
    log(model, operations);
    await newWrite(client, model.application.name, model.model, operations);
  } finally {
    await client.end();
  }
};

const log = (model: any, operations: Operation[]) => {
  if (operations.length === 0) {
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
};

const main = async () => {
  for (const file of ["./app-alibeez.json", "./app-humeur.json"]) {
    const model = JSON.parse(readFileSync(file).toString());
    await applyModel(model);
  }
};

main();
