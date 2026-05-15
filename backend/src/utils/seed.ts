import { prisma } from "../config/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "demo@zebvo.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo Creator",
      passwordHash: await bcrypt.hash("demo1234", 10),
      workspaces: {
        create: [
          {
            name: "Acme Coffee Co.",
            description: "Specialty roaster crafting single-origin coffee for home brewers.",
            targetAudience: "Coffee enthusiasts aged 25-45 in urban areas",
            industry: "Food & Beverage",
            brandVoice: "Warm, knowledgeable, slightly playful",
          },
        ],
      },
    },
  });
  console.log("Seeded demo user:", user.email, "pwd: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
