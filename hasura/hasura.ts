import { readFileSync } from "fs";
import {
  isMetadata,
  mergePermissionsFromModel,
  replaceMetadata,
  getMetadata
} from "./metadata";
import { trackTables } from "./track";

const updateHasuraMetadata = async (
  model: { [key: string]: any },
  url: string,
  adminKey: string
) => {
  const metadata = await getMetadata(url, adminKey);
  if (!isMetadata(metadata)) {
    throw new TypeError(
      "metadata retrieved from Hasura does not conform to expected type"
    );
  }
  try {
    console.log(
      await replaceMetadata(
        url,
        mergePermissionsFromModel(metadata, model),
        adminKey
      )
    );
  } catch (err) {
    console.error("Error trying to replace metadata", err);
  }
};

const main = async () => {
  const modelFile = process.argv[process.argv.length - 3];
  const url = process.argv[process.argv.length - 2];
  const adminKey = process.argv[process.argv.length - 1];
  if (!modelFile || !url) {
    console.error(`
      Please provide path to model file and Hasura server root URL as arguments.
      Example: ts-node index.ts model.json http://localhost:8080
    `);
  }
  const model = JSON.parse(readFileSync(modelFile).toString());

  try {
    await trackTables(
      model.application.name,
      Object.keys(model.model.tables),
      url,
      adminKey
    );
    console.log("Tables tracked");
  } catch (err) {
    console.error("Error tracking tables: ", err);
  }
  try {
    await updateHasuraMetadata(model, url, adminKey);
    console.log("Metadatas updated");
  } catch (err) {
    console.error("Error updating metadatas: ", err);
  }
};

main();
