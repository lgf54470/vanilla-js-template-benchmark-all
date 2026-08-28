// ESM re-export shim for the vendored CommonJS source (index.cjs).
// Upstream promise-limit@2.7.0 ships CommonJS only; see ./VENDOR.md.
import promiseLimit from "./index.cjs";
export default promiseLimit;
