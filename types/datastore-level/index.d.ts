declare module "datastore-level" {
  import {BaseDatastore} from "datastore-core";

  export class LevelDatastore extends BaseDatastore {
    constructor(location: string);
    open(): Promise<void>;
    close(): Promise<void>;
    put(key: any, val: Uint8Array): Promise<any>;
    get(key: any): Promise<Uint8Array>;
    has(key: any): Promise<boolean>;
    delete(key: any): Promise<void>;
    batch(): any;
    query(q: any): AsyncIterable<any>;
    queryKeys(q: any): AsyncIterable<any>;
  }
} 