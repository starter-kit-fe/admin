export declare namespace IApp {
  type asObject = {
    name: string;
    version: string;
    lastVersion: string;
    isNeedUpdate: boolean;
  };
  type Version = {
    version: string;
    now: string;
    environment: string;
  };
}
