import fetch from "node-fetch";
import { isArray } from "util";

export type Metadata = {
  functions: any[]; // anys for now
  remote_schema: any[];
  query_collections: any[];
  allowlist: any[];
  tables: Table[];
  query_template: any[];
};

export type Table = {
  table: { schema: string; name: string };
  object_relationships: any[];
  array_relationships: any[];
  select_permissions: {
    role: string;
    comment: string | null;
    permission: {
      allow_aggregations: boolean;
      columns: string[];
      filter: { id: { _eq?: string } }; // need to type this more precisely
    };
  }[];
};

export const getMetadata = async (url: string, adminSecret: string) => {
  const reponse = await fetch(`${url}/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret
    },
    body: JSON.stringify({
      type: "export_metadata",
      args: {}
    })
  });
  if (!reponse.ok) {
    throw new Error(`${reponse.status} -> ${reponse.statusText}`);
  }
  return await reponse.json();
};

export const computeMetadata = (metadata: Metadata, model: any): Metadata => {
  return {
    ...metadata,
    tables: metadata.tables.map(table => {
      if (!model.model.tables[table.table.name]) return table;
      return {
        ...table,
        insert_permissions:
          model.model.tables[table.table.name].insert_permissions || [],
        select_permissions:
          model.model.tables[table.table.name].select_permissions || [],
        update_permissions:
          model.model.tables[table.table.name].update_permissions || [],
        delete_permissions:
          model.model.tables[table.table.name].delete_permissions || []
      };
    })
  };
};

export const replaceMetadata = async (
  url: string,
  newMetadata: Metadata,
  adminSecret: string
) => {
  const response = await fetch(`${url}/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret
    },
    body: JSON.stringify({
      type: "replace_metadata",
      args: newMetadata
    })
  });
  if (!response.ok) {
    throw new Error(
      `${response.status} -> ${response.statusText} : ${JSON.stringify(
        await response.json()
      )}`
    );
  }
  return await response.json();
};

export const isMetadata = (metadata: any): metadata is Metadata =>
  metadata &&
  isArray(metadata.tables) &&
  metadata.tables.every((table: any) => isTable(table));

export const isTable = (table: any): table is Table =>
  table &&
  table.table &&
  table.table.schema &&
  table.table.name &&
  isArray(table.object_relationships) &&
  isArray(table.array_relationships) &&
  isArray(table.insert_permissions) &&
  isArray(table.select_permissions) &&
  isArray(table.update_permissions) &&
  isArray(table.delete_permissions) &&
  isArray(table.event_triggers);
