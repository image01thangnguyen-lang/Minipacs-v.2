import { OrganizationTree } from "./organization-tree";

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

console.log("--- organization-tree ---");

run("builds the correct ancestor and descendant relationships", () => {
  const units = [
    { id: "root", type: "CHAIN", parentId: null },
    { id: "h1", type: "HOSPITAL", parentId: "root" },
    { id: "d1", type: "DEPARTMENT", parentId: "h1" },
    { id: "r1", type: "ROOM", parentId: "d1" },
  ];
  
  const tree = new OrganizationTree(units);
  
  assert(tree.getDescendantIds("root").sort().join(",") === ["h1", "d1", "r1"].sort().join(","), "root descendants mismatch");
  assert(tree.getDescendantIds("h1").sort().join(",") === ["d1", "r1"].sort().join(","), "h1 descendants mismatch");
  assert(tree.getDescendantIds("r1").length === 0, "r1 should have no descendants");
  
  assert(tree.getAncestorIds("r1").join(",") === ["d1", "h1", "root"].join(","), "r1 ancestors mismatch");
  assert(tree.getAncestorIds("root").length === 0, "root should have no ancestors");
});

run("detects and prevents cycles", () => {
  const units = [
    { id: "h1", type: "HOSPITAL", parentId: null },
    { id: "d1", type: "DEPARTMENT", parentId: "h1" },
    { id: "d2", type: "DEPARTMENT", parentId: "h1" },
  ];
  
  const tree = new OrganizationTree(units);
  
  assert(tree.wouldCreateCycle("h1", "d1") === true, "h1 -> d1 -> h1 is a cycle");
  assert(tree.wouldCreateCycle("d1", "d2") === false, "d1 -> d2 is not a cycle");
  assert(tree.wouldCreateCycle("h1", "h1") === true, "node cannot be its own parent");
});

run("throws error on existing cycles to prevent silent failure", () => {
  const units = [
    { id: "n1", type: "DEPARTMENT", parentId: "n3" },
    { id: "n2", type: "DEPARTMENT", parentId: "n1" },
    { id: "n3", type: "DEPARTMENT", parentId: "n2" },
  ];
  
  const tree = new OrganizationTree(units);
  
  let didThrowDescendant = false;
  try {
    tree.getDescendantIds("n1");
  } catch (err: any) {
    if (err.name === "OrganizationIntegrityError") didThrowDescendant = true;
  }
  assert(didThrowDescendant, "should throw OrganizationIntegrityError on descendant traversal");
  
  let didThrowAncestor = false;
  try {
    tree.getAncestorIds("n1");
  } catch (err: any) {
    if (err.name === "OrganizationIntegrityError") didThrowAncestor = true;
  }
  assert(didThrowAncestor, "should throw OrganizationIntegrityError on ancestor traversal");
});

run("validates taxonomy rules", () => {
  const tree = new OrganizationTree([]);
  
  assert(tree.validateTaxonomyRule(null, "CHAIN") === true, "root -> CHAIN");
  assert(tree.validateTaxonomyRule(null, "HOSPITAL") === true, "root -> HOSPITAL");
  assert(tree.validateTaxonomyRule(null, "DEPARTMENT") === false, "root -> DEPARTMENT not allowed");
  
  assert(tree.validateTaxonomyRule("CHAIN", "HOSPITAL") === true, "CHAIN -> HOSPITAL");
  assert(tree.validateTaxonomyRule("CHAIN", "DEPARTMENT") === false, "CHAIN -> DEPARTMENT not allowed");
  
  assert(tree.validateTaxonomyRule("ROOM", "ROOM") === false, "ROOM cannot have children");
});
