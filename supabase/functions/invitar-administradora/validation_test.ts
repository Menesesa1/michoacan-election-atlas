import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { canInvite, validateInvitation } from "./validation.ts";

Deno.test("only persisted administrators may issue admin invitations", () => {
  assertEquals(canInvite([{ role: "admin" }]), true);
  assertEquals(canInvite([{ role: "analista" }, { role: "cliente" }]), false);
  assertEquals(canInvite(null), false);
});

Deno.test("invitation uses Mariana's supplied email", () => {
  assertEquals(validateInvitation({ email: "marianascotops@gmail.com" }), "marianascotops@gmail.com");
  assertEquals(validateInvitation({ email: "invalid" }), null);
});