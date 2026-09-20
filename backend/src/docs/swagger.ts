import path from "node:path";
import YAML from "yamljs";

// openapi.yaml lives at the repo root of `backend/`.
// Resolve from process.cwd() so it works identically under
// tsx (dev) and node dist/ (prod), since both are invoked from `backend/`.
// OPENAPI_YAML_PATH overrides for Docker/custom WORKDIR layouts.
const specPath =
  process.env.OPENAPI_YAML_PATH ?? path.resolve(process.cwd(), "openapi.yaml");

export const openApiSpec = YAML.load(specPath);
