import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const demoUsers = [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
    { name: "Charlie", email: "charlie@example.com" },
  ];

  const password = await bcrypt.hash("password123", 12);

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    });

    // Seed some scores
    const games = [
      "reaction-time",
      "number-memory",
      "sequence-memory",
      "visual-memory",
    ] as const;
    for (const game of games) {
      const value =
        game === "reaction-time"
          ? 200 + Math.random() * 200
          : Math.floor(Math.random() * 10) + 5;
      await prisma.score.create({ data: { userId: user.id, game, value } });
    }
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
