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
      `Users already exist (${existingCount} records). Skipping user seeding.`
    );
  } else {
    for (const email of emails) {
      await prisma.user.create({
        data: { email },
      });
      console.log(`Created user: ${email}`);
    }
  }

  // 初期カテゴリの投入
  const initialCategories = [
    "🍔 食費",
    "🧹 日用品",
    "⛺️ 趣味・娯楽",
    "☕️ 交際費",
    "🏥 健康・医療",
    "👕 衣服・美容",
    "🚃 交通費",
    "🎓 教養・教育",
    "🚙 自動車",
    "🚰 水道光熱費",
    "🛜 通信費",
    "🏠 住宅",
    "💲 税・社会保障",
    "💊 保険",
    "📱 サブスク費",
    "📅 年会費",
    "📠 家具・家電",
    "💵 株式投資",
    "💰 収入",
    "💰 賞与",
    "💰 臨時収入",
  ];
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: initialCategories.map((name, index) => ({ name, seq: index + 1 })),
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
