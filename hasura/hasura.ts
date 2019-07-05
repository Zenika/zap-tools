import { readFileSync } from "fs";
import {
  isMetadata,
  mergePermissionsFromModel,
  replaceMetadata,
  getMetadata
} from "./metadata";

const updateHasuraMetadata = async (
  model: { [key: string]: any },
  url: string
) => {
  const metadata = await getMetadata(url);
  if (!isMetadata(metadata)) {
    throw new TypeError(
      "metadata retrieved from Hasura does not conform to expected type"
    );
  }
  try {
    await replaceMetadata(url, mergePermissionsFromModel(metadata, model));
  } catch (err) {
    console.error("Error trying to replace metadata", err);
  }
};

const main = async () => {
  const modelFile = process.argv[process.argv.length - 2];
  const url = process.argv[process.argv.length - 1];
  if (!modelFile || !url) {
    console.error(`
      Please provide path to model file and Hasura server root URL as arguments.
      Example: ts-node index.ts model.json http://localhost:8080
    `)
  }
  const model = JSON.parse(readFileSync(modelFile).toString());
  await updateHasuraMetadata(model, url);
};

main();
