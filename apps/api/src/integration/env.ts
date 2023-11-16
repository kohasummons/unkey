import { z } from "zod";

import { describe, test, expect, afterAll } from "bun:test";
import { step } from "@/pkg/testutil/step";
import { testEnv } from "./env";
import type { V1ApisCreateApiRequest, V1ApisCreateApiResponse } from "@/routes/v1_apis_createApi";
import type { V1KeysCreateKeyRequest, V1KeysCreateKeyResponse } from "@/routes/v1_keys_createKey";
import { V1KeysVerifyKeyRequest, V1KeysVerifyKeyResponse } from "@/routes/v1_keys_verifyKey";

const env = testEnv();
test("update a key's remaining limit", async () => {
  const createApiResponse = await step<V1ApisCreateApiRequest, V1ApisCreateApiResponse>({
    url: `${env.UNKEY_BASE_URL}/v1/apis.createApi`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.UNKEY_ROOT_KEY}`,
    },
    body: {
      name: "scenario-test-pls-delete",
    },
  });
  expect(createApiResponse.status).toEqual(200);
  expect(createApiResponse.body.apiId).toBeDefined();
  expect(createApiResponse.headers).toHaveProperty("unkey-request-id");

  afterAll(async () => {
    await step({
      url: `${env.UNKEY_BASE_URL}/v1/apis.deleteApi`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.UNKEY_ROOT_KEY}`,
      },
      body: {
        apiId: createApiResponse.body.apiId,
      },
    });
  });

  const key = await step<V1KeysCreateKeyRequest, V1KeysCreateKeyResponse>({
    url: `${env.UNKEY_BASE_URL}/v1/keys.createKey`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.UNKEY_ROOT_KEY}`,
    },
    body: {
      apiId: createApiResponse.body.apiId,
      byteLength: 16,
      remaining: 5,
    },
  });
  expect(key.status).toEqual(200);
  expect(key.body.key).toBeDefined();
  expect(key.body.keyId).toBeDefined();

  for (let i = 4; i >= 0; i--) {
    const valid = await step<V1KeysVerifyKeyRequest, V1KeysVerifyKeyResponse>({
      url: `${env.UNKEY_BASE_URL}/v1/keys.verifyKey`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        key: key.body.key,
        apiId: createApiResponse.body.apiId,
      },
    });
    expect(valid.status).toEqual(200);
    expect(valid.body.valid).toEqual(true);
    expect(valid.body.remaining).toEqual(i);
  }
  const invalid = await step<V1KeysVerifyKeyRequest, V1KeysVerifyKeyResponse>({
    url: `${env.UNKEY_BASE_URL}/v1/keys.verifyKey`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      key: key.body.key,
      apiId: createApiResponse.body.apiId,
    },
  });
  expect(invalid.status).toEqual(200);
  expect(invalid.body.valid).toEqual(false);
  expect(invalid.body.remaining).toEqual(0);

  const updated = await step<V1KeysUpdate, V1KeysDeleteKeyResponse>({
    url: `${env.UNKEY_BASE_URL}/v1/keys.deleteKey`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.UNKEY_ROOT_KEY}`,
    },
    body: {
      keyId: key.body.keyId,
    },
  });
  expect(revoked.status).toEqual(200);

  const validAfterRevoke = await step<V1KeysVerifyKeyRequest, V1KeysVerifyKeyResponse>({
    url: `${env.UNKEY_BASE_URL}/v1/keys.verifyKey`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      key: key.body.key,
      apiId: createApiResponse.body.apiId,
    },
  });
  expect(validAfterRevoke.status).toEqual(200);
  expect(validAfterRevoke.body.valid).toEqual(false);
});
const requiredEnv = z.object({
  UNKEY_BASE_URL: z.string().url().default("https://dev.api.unkey.app"),
  UNKEY_ROOT_KEY: z.string(),
});

export function testEnv() {
  const res = requiredEnv.safeParse(process.env);
  if (!res.success) {
    throw new Error(`Missing required environment variables: ${res.error.message}`);
  }
  return res.data;
}
