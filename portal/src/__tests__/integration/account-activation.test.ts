import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { testDb, createTestUser, isDbReachable } from "../setup";
import {
  activateAccountWithToken,
  createAccountActivationToken,
  consumeDeliveryTokenForEmail,
  issueActivationTokenInTransaction,
} from "@/lib/account-activation";
import * as bcrypt from "bcryptjs";

describe("account activation tokens", () => {
  it("consumes token atomically and invalidates siblings", async () => {
    if (!isDbReachable()) return;
    const user = await createTestUser({ email: "activate-1@test.com", role: "INTERNAL_WORKER" });
    const older = await createAccountActivationToken(user.id);
    const active = await createAccountActivationToken(user.id);

    const url = await consumeDeliveryTokenForEmail(active.tokenId);
    expect(url).toMatch(/activate-account\?token=/);

    const secondConsume = await consumeDeliveryTokenForEmail(active.tokenId);
    expect(secondConsume).toBeNull();

    const password = "new-password-10";
    const result = await activateAccountWithToken(active.plainToken, password);
    expect(result.ok).toBe(true);

    const updated = await testDb.user.findUnique({ where: { id: user.id } });
    expect(updated?.passwordHash).toBeTruthy();
    expect(bcrypt.compareSync(password, updated!.passwordHash)).toBe(true);

    const retry = await activateAccountWithToken(active.plainToken, "another-pass-10");
    expect(retry.ok).toBe(false);

    const olderRow = await testDb.accountActivationToken.findUnique({ where: { id: older.tokenId } });
    expect(olderRow?.usedAt).toBeTruthy();

    const unused = await testDb.accountActivationToken.count({
      where: { userId: user.id, usedAt: null },
    });
    expect(unused).toBe(0);
  });

  it("allows only one concurrent activation claim", async () => {
    if (!isDbReachable()) return;
    const user = await createTestUser({ email: "activate-concurrent@test.com" });
    const { plainToken } = await testDb.$transaction(async (tx) =>
      issueActivationTokenInTransaction(tx, user.id)
    );

    const results = await Promise.all([
      activateAccountWithToken(plainToken, "password-one1"),
      activateAccountWithToken(plainToken, "password-two2"),
    ]);
    const successes = results.filter((r) => r.ok).length;
    expect(successes).toBe(1);
  });
});
