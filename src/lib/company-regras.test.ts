import { test } from "node:test";
import assert from "node:assert/strict";
import { pertenceAoEscopo } from "./company-regras";

test("foto offline só é sincronizada pelo usuário e empresa de origem", () => {
  const origem = { userId: "tecnico-a", companyId: "empresa-a" };
  assert.equal(pertenceAoEscopo("tecnico-a", "empresa-a", origem), true);
  assert.equal(pertenceAoEscopo("tecnico-b", "empresa-a", origem), false);
  assert.equal(pertenceAoEscopo("tecnico-a", "empresa-b", origem), false);
});
test("foto antiga sem empresa não é atribuída à conta atual", () => {
  assert.equal(pertenceAoEscopo("tecnico-a", "empresa-a", {}), false);
  assert.equal(pertenceAoEscopo(undefined, "empresa-a", { companyId: "empresa-a" }), false);
});