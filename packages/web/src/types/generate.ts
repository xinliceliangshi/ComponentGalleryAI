export interface ComponentRec { name: string; usage: string }

export interface GenerateResponse {
  components: ComponentRec[];
  explanation: string;
  code: string;
}

export type GenerateStatus = "idle" | "loading" | "success" | "error";
