import opa from "./opa.js";

export const loadPolicy = opa.loadPolicy;
export const loadPolicySync = opa.loadPolicySync;
export const LoadedPolicy = opa.LoadedPolicy;
export type LoadedPolicy = InstanceType<typeof opa.LoadedPolicy>;
export default opa;
