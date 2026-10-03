import { spawnSync } from "node:child_process";

const ZERO_OID = "0".repeat(40);
const OID_PATTERN = /^[0-9a-f]{40}$/;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
// The only message readSnapshot accepts. Exported so every writer of a state
// commit — including the publish-refs reconcile — uses the same bytes; a
// divergent message brands the ref unreadable to the controller.
export const SNAPSHOT_COMMIT_MESSAGE = "factory state snapshot";
const COMMIT_MESSAGE = `${SNAPSHOT_COMMIT_MESSAGE}\n`;

export interface MaterializedSnapshot {
  readonly oid: string;
  readonly files: Readonly<Record<string, string>>;
}

export type CreateResult =
  | { readonly disposition: "created"; readonly oid: string }
  | {
      readonly disposition: "cas_mismatch";
      readonly current: MaterializedSnapshot | null;
    };

export type CompareAndSwapResult =
  | { readonly disposition: "advanced"; readonly oid: string }
  | {
      readonly disposition: "cas_mismatch";
      readonly current: MaterializedSnapshot | null;
    };

export type DeleteResult =
  | { readonly disposition: "deleted" }
  | {
      readonly disposition: "cas_mismatch";
      readonly current: MaterializedSnapshot | null;
    };

export interface GitRefStore {
  create(refName: string, snapshot: unknown): CreateResult;
  read(refName: string): MaterializedSnapshot | null;
  compareAndSwap(
    refName: string,
    expectedOid: string,
    snapshot: unknown,
  ): CompareAndSwapResult;
  delete(refName: string, expectedOid: string): DeleteResult;
}

interface GitResult {
  readonly status: number | null;
  readonly stdout: Buffer;
  readonly stderr: Buffer;
}

interface TreeNode {
  readonly blobs: Map<string, string>;
  readonly trees: Map<string, TreeNode>;
}

interface TreeEntry {
  readonly name: string;
  readonly mode: "100644" | "040000";
  readonly type: "blob" | "tree";
  readonly oid: string;
}

function runGit(
  repositoryPath: string,
  args: readonly string[],
  input?: Buffer,
  environment?: NodeJS.ProcessEnv,
): GitResult {
  const childEnvironment = { ...process.env, ...environment };
  for (const name of Object.keys(childEnvironment)) {
    if (
      name === "GIT_DIR" ||
      name === "GIT_WORK_TREE" ||
      name === "GIT_COMMON_DIR" ||
      name === "GIT_OBJECT_DIRECTORY" ||
      name === "GIT_ALTERNATE_OBJECT_DIRECTORIES" ||
      name === "GIT_NAMESPACE" ||
      name.startsWith("GIT_CONFIG_")
    ) {
      delete childEnvironment[name];
    }
  }
  childEnvironment.GIT_NO_REPLACE_OBJECTS = "1";
  childEnvironment.GIT_CONFIG_NOSYSTEM = "1";
  childEnvironment.GIT_CONFIG_GLOBAL = "/dev/null";
  childEnvironment.LC_ALL = "C";

  const result = spawnSync("git", ["-C", repositoryPath, ...args], {
    encoding: null,
    env: childEnvironment,
    input,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error !== undefined) throw result.error;

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function gitFailure(operation: string, result: GitResult): Error {
  const detail = result.stderr.toString("utf8").trim();
  return new Error(detail.length > 0 ? `${operation}: ${detail}` : `${operation} failed`);
}

function requireSuccess(operation: string, result: GitResult): Buffer {
  if (result.status !== 0) throw gitFailure(operation, result);
  return result.stdout;
}

function decodeUtf8(value: Buffer, description: string): string {
  try {
    return UTF8_DECODER.decode(value);
  } catch {
    throw new Error(`${description} is not valid UTF-8`);
  }
}

function isWellFormedString(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (index + 1 >= value.length || next < 0xdc00 || next > 0xdfff) {
        return false;
      }
      index += 1;
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function assertOid(oid: string, description: string): void {
  if (typeof oid !== "string" || !OID_PATTERN.test(oid)) {
    throw new Error(`${description} is not a valid object ID`);
  }
}

function assertRefName(repositoryPath: string, refName: string): void {
  if (
    typeof refName !== "string" ||
    !isWellFormedString(refName) ||
    !refName.startsWith("refs/factory/") ||
    refName.length === "refs/factory/".length ||
    refName.includes("\0")
  ) {
    throw new Error("Authority ref must be below refs/factory/");
  }

  const checked = runGit(repositoryPath, ["check-ref-format", refName]);
  if (checked.status !== 0) throw new Error("Authority ref name is malformed");

  const symbolic = runGit(repositoryPath, ["symbolic-ref", "-q", refName]);
  if (symbolic.status === 0) throw new Error("Symbolic authority refs are not allowed");
  if (symbolic.status !== 1) throw gitFailure("inspect authority ref", symbolic);
}

function assertRecordPath(path: string): void {
  const parts = path.split("/");
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.includes("\\") ||
    !isWellFormedString(path) ||
    /[\0-\x1f\x7f]/.test(path) ||
    parts.some(
      (part) =>
        part.length === 0 ||
        part === "." ||
        part === ".." ||
        part.toLowerCase() === ".git",
    )
  ) {
    throw new Error(`Unsafe snapshot record path: ${JSON.stringify(path)}`);
  }
}

function setRecordValue(
  record: Record<string, string>,
  path: string,
  value: string,
): void {
  Object.defineProperty(record, path, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function validateSnapshot(snapshot: unknown): Readonly<Record<string, string>> {
  if (
    typeof snapshot !== "object" ||
    snapshot === null ||
    Array.isArray(snapshot) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(snapshot))
  ) {
    throw new Error("Snapshot must be a record of paths to UTF-8 strings");
  }

  const ownKeys = Reflect.ownKeys(snapshot);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw new Error("Snapshot contains a non-string record path");
  }

  const paths = ownKeys as string[];
  const pathSet = new Set(paths);
  const files: Record<string, string> = {};
  for (const path of paths) {
    assertRecordPath(path);
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, path);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string" ||
      !isWellFormedString(descriptor.value)
    ) {
      throw new Error(`Snapshot record ${JSON.stringify(path)} is not valid UTF-8 text`);
    }

    const parts = path.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      if (pathSet.has(parts.slice(0, index).join("/"))) {
        throw new Error(`Snapshot path conflicts with a parent record: ${path}`);
      }
    }
    setRecordValue(files, path, descriptor.value);
  }
  return files;
}

function parseOid(output: Buffer, description: string): string {
  const oid = output.toString("ascii").trim();
  assertOid(oid, description);
  return oid;
}

function readRefOid(repositoryPath: string, refName: string): string | null {
  assertRefName(repositoryPath, refName);
  const result = runGit(repositoryPath, [
    "rev-parse",
    "--verify",
    "--quiet",
    refName,
  ]);
  if (result.status === 1) return null;
  return parseOid(requireSuccess("read authority ref", result), "Authority ref object ID");
}

function readSnapshot(repositoryPath: string, oid: string): MaterializedSnapshot {
  assertOid(oid, "Snapshot object ID");
  const objectType = decodeUtf8(
    requireSuccess(
      "inspect snapshot object",
      runGit(repositoryPath, ["cat-file", "-t", oid]),
    ),
    "Snapshot object type",
  ).trim();
  if (objectType !== "commit") {
    throw new Error("Authority ref does not point to a commit");
  }

  const commit = decodeUtf8(
    requireSuccess(
      "read snapshot commit",
      runGit(repositoryPath, ["cat-file", "commit", oid]),
    ),
    "Snapshot commit",
  );
  const headerEnd = commit.indexOf("\n\n");
  if (headerEnd < 0 || commit.slice(headerEnd + 2) !== COMMIT_MESSAGE) {
    throw new Error("Authority ref does not point to a controller state commit");
  }

  const treeOid = parseOid(
    requireSuccess(
      "resolve snapshot tree",
      runGit(repositoryPath, ["rev-parse", "--verify", `${oid}^{tree}`]),
    ),
    "Snapshot tree object ID",
  );
  const treeType = decodeUtf8(
    requireSuccess(
      "inspect snapshot tree",
      runGit(repositoryPath, ["cat-file", "-t", treeOid]),
    ),
    "Snapshot tree object type",
  ).trim();
  if (treeType !== "tree") throw new Error("Snapshot commit has no verifiable tree");

  const listing = requireSuccess(
    "read snapshot tree",
    runGit(repositoryPath, ["ls-tree", "-r", "-z", "--full-tree", treeOid]),
  );
  if (listing.length > 0 && listing[listing.length - 1] !== 0) {
    throw new Error("Snapshot tree listing is malformed");
  }

  const files: Record<string, string> = {};
  const listingBody = listing.length === 0 ? listing : listing.subarray(0, -1);
  const decodedListing = decodeUtf8(listingBody, "Snapshot tree listing");
  for (const entry of decodedListing.split("\0")) {
    if (entry.length === 0) continue;
    const match = /^100644 blob ([0-9a-f]{40})\t(.+)$/.exec(entry);
    if (match === null) throw new Error("Snapshot tree contains an unsupported entry");
    const [, blobOid, path] = match;
    assertRecordPath(path);
    if (Object.hasOwn(files, path)) {
      throw new Error("Snapshot tree contains duplicate record paths");
    }
    setRecordValue(
      files,
      path,
      decodeUtf8(
        requireSuccess(
          "read snapshot record",
          runGit(repositoryPath, ["cat-file", "blob", blobOid]),
        ),
        `Snapshot record ${JSON.stringify(path)}`,
      ),
    );
  }

  return { oid, files };
}

function compareTreeEntries(left: TreeEntry, right: TreeEntry): number {
  const leftName = Buffer.from(`${left.name}${left.type === "tree" ? "/" : ""}`);
  const rightName = Buffer.from(`${right.name}${right.type === "tree" ? "/" : ""}`);
  return Buffer.compare(leftName, rightName);
}

function writeTree(repositoryPath: string, node: TreeNode): string {
  const entries: TreeEntry[] = [];
  for (const [name, oid] of node.blobs) {
    entries.push({ name, mode: "100644", type: "blob", oid });
  }
  for (const [name, child] of node.trees) {
    entries.push({
      name,
      mode: "040000",
      type: "tree",
      oid: writeTree(repositoryPath, child),
    });
  }
  entries.sort(compareTreeEntries);

  const input = Buffer.from(
    entries
      .map(({ mode, type, oid, name }) => `${mode} ${type} ${oid}\t${name}\0`)
      .join(""),
    "utf8",
  );
  return parseOid(
    requireSuccess(
      "write snapshot tree",
      runGit(repositoryPath, ["mktree", "-z"], input),
    ),
    "Snapshot tree object ID",
  );
}

function writeCommit(
  repositoryPath: string,
  snapshot: unknown,
  parentOid?: string,
): string {
  const files = validateSnapshot(snapshot);
  const root: TreeNode = { blobs: new Map(), trees: new Map() };
  for (const path of Object.keys(files).sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)),
  )) {
    const blobOid = parseOid(
      requireSuccess(
        "write snapshot record",
        runGit(
          repositoryPath,
          ["hash-object", "-w", "--stdin"],
          Buffer.from(files[path], "utf8"),
        ),
      ),
      "Snapshot record object ID",
    );

    const parts = path.split("/");
    const fileName = parts.pop();
    if (fileName === undefined) throw new Error("Snapshot record path is malformed");
    let node = root;
    for (const part of parts) {
      let child = node.trees.get(part);
      if (child === undefined) {
        child = { blobs: new Map(), trees: new Map() };
        node.trees.set(part, child);
      }
      node = child;
    }
    node.blobs.set(fileName, blobOid);
  }

  const treeOid = writeTree(repositoryPath, root);
  const args = ["commit-tree", treeOid];
  if (parentOid !== undefined) {
    assertOid(parentOid, "Parent object ID");
    args.push("-p", parentOid);
  }
  const commitEnvironment = {
    GIT_AUTHOR_NAME: "Factory Controller",
    GIT_AUTHOR_EMAIL: "factory-controller@invalid",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_NAME: "Factory Controller",
    GIT_COMMITTER_EMAIL: "factory-controller@invalid",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
  };
  return parseOid(
    requireSuccess(
      "write snapshot commit",
      runGit(
        repositoryPath,
        args,
        Buffer.from(COMMIT_MESSAGE, "utf8"),
        commitEnvironment,
      ),
    ),
    "Snapshot commit object ID",
  );
}

function updateRef(
  repositoryPath: string,
  refName: string,
  newOid: string,
  expectedOid: string,
): GitResult {
  // The final argument is Git's atomic expected-old-OID check.
  // Ref: https://git-scm.com/docs/git-update-ref/2.53.0
  return runGit(repositoryPath, [
    "update-ref",
    "--no-deref",
    refName,
    newOid,
    expectedOid,
  ]);
}

export function openGitRefStore(repositoryPath: string): GitRefStore {
  if (
    typeof repositoryPath !== "string" ||
    repositoryPath.trim().length === 0 ||
    repositoryPath.includes("\0") ||
    !isWellFormedString(repositoryPath)
  ) {
    throw new Error("Repository path is malformed");
  }
  requireSuccess("open Git repository", runGit(repositoryPath, ["rev-parse", "--git-dir"]));

  const read = (refName: string): MaterializedSnapshot | null => {
    const oid = readRefOid(repositoryPath, refName);
    return oid === null ? null : readSnapshot(repositoryPath, oid);
  };

  return {
    create(refName, snapshot) {
      const current = read(refName);
      if (current !== null) return { disposition: "cas_mismatch", current };

      const oid = writeCommit(repositoryPath, snapshot);
      const result = updateRef(repositoryPath, refName, oid, ZERO_OID);
      if (result.status === 0) return { disposition: "created", oid };

      const reloaded = read(refName);
      if (reloaded !== null) return { disposition: "cas_mismatch", current: reloaded };
      throw gitFailure("create authority ref", result);
    },

    read,

    compareAndSwap(refName, expectedOid, snapshot) {
      assertOid(expectedOid, "Expected object ID");
      const current = read(refName);
      if (current?.oid !== expectedOid) {
        return { disposition: "cas_mismatch", current };
      }

      const oid = writeCommit(repositoryPath, snapshot, expectedOid);
      const result = updateRef(repositoryPath, refName, oid, expectedOid);
      if (result.status === 0) return { disposition: "advanced", oid };

      const reloaded = read(refName);
      if (reloaded?.oid !== expectedOid) {
        return { disposition: "cas_mismatch", current: reloaded };
      }
      throw gitFailure("advance authority ref", result);
    },

    delete(refName, expectedOid) {
      assertOid(expectedOid, "Expected object ID");
      const current = read(refName);
      if (current?.oid !== expectedOid) {
        return { disposition: "cas_mismatch", current };
      }

      const result = runGit(repositoryPath, [
        "update-ref",
        "--no-deref",
        "-d",
        refName,
        expectedOid,
      ]);
      if (result.status === 0) return { disposition: "deleted" };

      const reloaded = read(refName);
      if (reloaded?.oid !== expectedOid) {
        return { disposition: "cas_mismatch", current: reloaded };
      }
      throw gitFailure("delete authority ref", result);
    },
  };
}
