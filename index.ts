import { readFileSync } from "fs";
import { Client } from "pg";
import { write as newWrite, CreateTableOperation } from "./write";
import { read as newRead, makeDiffable } from "./read";
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
  // empty right to ensure dms schema is available
  // dms schema scaffolding should be done separatly instead
  await newWrite(client, model.application.name, []);
  const live = await newRead(client, model.application.name);
  const target = makeDiffable(model.model.tables);
  const operations = diff(model.model, live, target);
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
  await newWrite(client, model.application.name, operations);
  await client.end();
};

const main = async () => {
  for (const file of ["./app-alibeez.json", "./app-humeur.json"]) {
    const model = JSON.parse(readFileSync(file).toString());
    await applyModel(model);
  }
};

main();
