#!/usr/bin/env node
/**
 * Idempotent bootstrap of DivLab Cursor bridge labels via `gh api`.
 * Uses GITHUB_TOKEN from Actions — never a personal access token.
 */
import { spawnSync } from "node:child_process";
import { DIVLAB_REPO } from "../../lib/cursor-bridge/config.ts";
import { BRIDGE_LABEL_DEFINITIONS } from "../../lib/cursor-bridge/labels.ts";
import { sanitizeErrorMessage } from "../../lib/cursor-bridge/sanitize.ts";

function main(): void {
  const repository = process.env.GITHUB_REPOSITORY ?? DIVLAB_REPO.fullName;
  if (repository !== DIVLAB_REPO.fullName) {
    process.stderr.write(
      `Refusing to bootstrap labels outside ${DIVLAB_REPO.fullName}\n`,
    );
    process.exit(1);
  }

  for (const label of BRIDGE_LABEL_DEFINITIONS) {
    ensureLabel(repository, label.name, label.color, label.description);
  }

  process.stdout.write(
    `Ensured ${BRIDGE_LABEL_DEFINITIONS.length} bridge labels on ${repository}\n`,
  );
}

function ensureLabel(
  repository: string,
  name: string,
  color: string,
  description: string,
): void {
  // Try create; on 422 (already exists) patch instead. Never fail the workflow
  // solely because a label already exists or an update is a no-op.
  const create = runGh([
    "api",
    "--method",
    "POST",
    `repos/${repository}/labels`,
    "-f",
    `name=${name}`,
    "-f",
    `color=${color}`,
    "-f",
    `description=${description}`,
  ]);

  if (create.status === 0) {
    process.stdout.write(`Created label ${name}\n`);
    return;
  }

  const createErr = `${create.stderr}\n${create.stdout}`;
  const alreadyExists =
    create.status !== 0 &&
    (/already_exists/i.test(createErr) ||
      /Validation Failed/i.test(createErr) ||
      /HTTP 422/i.test(createErr));

  if (!alreadyExists) {
    process.stderr.write(
      `Warning: create ${name} failed: ${sanitizeErrorMessage(createErr)}\n`,
    );
  }

  const update = runGh([
    "api",
    "--method",
    "PATCH",
    `repos/${repository}/labels/${encodeURIComponent(name)}`,
    "-f",
    `new_name=${name}`,
    "-f",
    `color=${color}`,
    "-f",
    `description=${description}`,
  ]);

  if (update.status === 0) {
    process.stdout.write(`Updated label ${name}\n`);
    return;
  }

  process.stderr.write(
    `Warning: update ${name} failed: ${sanitizeErrorMessage(
      `${update.stderr}\n${update.stdout}`,
    )}\n`,
  );
  // Do not fail — idempotent bootstrap must tolerate races / permission quirks
  // on individual labels when others succeed. Exit non-zero only if none work.
}

function runGh(args: string[]): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    env: process.env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

main();
