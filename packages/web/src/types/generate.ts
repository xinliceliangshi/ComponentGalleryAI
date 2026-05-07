export type ComponentRec = { name: string; usage: string };

export type GenerateResponse = {
  components: ComponentRec[];
  explanation: string;
  code: string;
};

export type GenerateStatus = "idle" | "loading" | "success" | "error";

