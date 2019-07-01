import fetch from "node-fetch";
import { isArray } from "util";

export type Metadatas = {
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

export const getMetadatas = async (url: string) => {
  const metadatasResponse = await fetch(`${url}/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Role": "admin"
    },
    body: JSON.stringify({
      type: "export_metadata",
      args: {}
    })
  });
  return await metadatasResponse.json();
};

export const isMetadatas = (metadatas: any): metadatas is Metadatas =>
  metadatas &&
  isArray(metadatas.tables) &&
  metadatas.tables.every((table: any) => isTable(table));

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
