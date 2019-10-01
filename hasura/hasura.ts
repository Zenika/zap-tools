import { trackTables } from "./track";
import { SubCommandTree } from "..";
import { updateHasuraMetadata } from "./metadata";

const subCommandTree: SubCommandTree = {
  "--track-tables": trackTables,
  "--update-metadatas": updateHasuraMetadata
};

export const handleHasuraCommand = async () => {
  const possibleSubCommands = Object.keys(subCommandTree);
  const subCommands = possibleSubCommands.map(possibleSubCommand =>
    process.argv.includes(possibleSubCommand) ? possibleSubCommand : null
  ).filter(subCommand => subCommand);
  console.log(subCommands);
  // const subCommand = process.argv.includes()
  // if(!subCommand){
  //   console.error("You must provide an agument to the hasura command");
  // }

  const args = {
    modelFile: process.argv[process.argv.length - 3],
    url: process.argv[process.argv.length - 2],
    adminKey: process.argv[process.argv.length - 1]
  };
  // if (!args.modelFile || !args.url || !args.adminKey) {
  //   console.error(`
  //     Please provide path to model file, Hasura server root URL and adminKey as arguments.
  //     Example: zap hasura model.json http://localhost:8080
  //   `);
  // }
  // console.log(subCommand);
  // console.log(subCommandTree[subCommand])
  // subCommandTree[subCommand](args);
};
