import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? "Sergio";

if (!email || !password) {
  console.error("Uso: tsx scripts/seed-auth-user.ts <email> <password> [nombre]");
  process.exit(1);
}

// Same config as lib/auth.ts but with sign-up enabled, since this script is
// the only intended way to create an account — the deployed app keeps
// disableSignUp: true so nobody else can register through the public API.
const seedAuth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
  emailAndPassword: { enabled: true, disableSignUp: false },
  secret: process.env.BETTER_AUTH_SECRET ?? "seed-only-unused-secret",
});

async function main() {
  const result = await seedAuth.api.signUpEmail({ body: { email, password, name } });
  console.log("Usuario creado:", result.user.email);
}

main();
