import { CommanderStatic } from "commander";

export const assertModelArgument = (program: CommanderStatic) => {
  if (!program.model) {
    throw new Error("You must pass a path to the model with the -m command");
  }
  return true;
}

export const assertUrlArgument = (program: CommanderStatic) => {
  if (!program.url) {
    throw new Error("You must pass an url for the Zap server with the -u command");
  }
  return true;
}

export const assertKeyArgument = (program: CommanderStatic) => {
  if (!program.adminKey) {
    console.error("You must pass an admin key with the -k command");
  }
  return true;
}
