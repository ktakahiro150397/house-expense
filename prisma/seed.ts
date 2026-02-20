import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const emailsEnv = process.env.INIT_USER_EMAILS;
  if (!emailsEnv) {
    console.log("INIT_USER_EMAILS is not set. Skipping user seeding.");
    return;
  }

  const emails = emailsEnv
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log(
      `Users already exist (${existingCount} records). Skipping seeding.`
    );
    return;
  }

  for (const email of emails) {
    await prisma.user.create({
      data: { email },
    });
    console.log(`Created user: ${email}`);
  }

  // 初期カテゴリの投入
  const initialCategories = [
    "食費",
    "日用品",
    "交通費",
    "光熱費",
    "外食",
    "娯楽",
    "医療",
    "通信費",
    "その他",
  ];
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: initialCategories.map((name) => ({ name })),
    });
    console.log(`Seeded ${initialCategories.length} categories.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
