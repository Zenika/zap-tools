import program from "commander";
import { applyModel } from "./model/model";
import { trackTables } from "./hasura/track";
import {
  assertModelArgument,
  assertUrlArgument,
  assertKeyArgument
} from "./argument-checking";
import { updateMetadata } from "./hasura/metadata";

const main = async () => {
  program
    .option(
      "--apply-model",
      "Apply model of the json file passed as argument in the -m command"
    )
    .option(
      "--drop",
      "Specify wether to drop the database before applying the model"
    )
    .option("--track-tables", "Track tables from the model json file")
    .option(
      "--update-metadatas",
      "Updates metadatas of the Zap server with permissions defined in the model json file"
    )
    .option("-m, --model <path>", "Path to the model json file")
    .option("-u, --url <url>", "URL of the Zap server")
    .option(
      "-k, --admin-key <key>",
      "Admin key used to update the Zap server"
    );
  try {
    program.parse(process.argv);
    if (program.applyModel) {
      if (!assertModelArgument(program)) {
        return;
      }
      await applyModel(program.model, { drop: program.drop });
    }
    if (program.updateMetadatas) {
      if (
        !assertModelArgument(program) ||
        !assertUrlArgument(program) ||
        !assertKeyArgument(program)
      ) {
        return;
      }
      await updateMetadata(program.model, program.url, program.adminKey);
    }
    if (program.trackTables) {
      if (
        !assertModelArgument(program) ||
        !assertUrlArgument(program) ||
        !assertKeyArgument(program)
      ) {
        return;
      }
      await trackTables(program.model, program.url, program.adminKey);
    }
    console.log("All done")
  } catch (err) {
    console.error(err);
  }
};

main();
