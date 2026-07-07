import { SCOPE_CAPABILITIES, CAPABILITY_TO_GLOBAL_PERMISSION } from "./capability-registry";
import { getAuthorizationMode } from "./authorization-mode";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run(name: string, test: () => void) {
  try {
    test();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

console.log("--- scope-logic ---");

run("capability registry maps to global permission", () => {
  for (const cap of SCOPE_CAPABILITIES) {
    const globalPerm = CAPABILITY_TO_GLOBAL_PERMISSION[cap];
    assert(!!globalPerm, `Capability ${cap} must map to a global permission`);
  }
});

run("authorization modes default to OFF", () => {
  process.env.AUTHORIZATION_MODE = "";
  assert(getAuthorizationMode() === "OFF", "Empty should be OFF");
  
  process.env.AUTHORIZATION_MODE = "SHADOW";
  assert(getAuthorizationMode() === "SHADOW", "Should read SHADOW");
  
  process.env.AUTHORIZATION_MODE = "ENFORCE";
  assert(getAuthorizationMode() === "ENFORCE", "Should read ENFORCE");
});
