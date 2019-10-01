import { handleModelCommand } from "./model/model";
import { handleHasuraCommand } from "./hasura/hasura";

export type SubCommandArguments = {[key: string]: string};
export type SubCommandTree = { [key: string]: (args: SubCommandArguments) => Promise<void> };

const subCommandTree: SubCommandTree = {
  model: handleModelCommand,
  hasura: handleHasuraCommand
};

const main = async () => {
  subCommandTree[process.argv[2]]({});
  console.error("ERROR: unrecognized argument");
};

main();
