import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shimPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "server-only.js");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveWithServerOnlyShim(request, parent, isMain, options) {
  if (request === "server-only") {
    return shimPath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
