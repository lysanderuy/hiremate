import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { companies, type Company } from "@/db/schema";

export const companyService = {
  async getByOwner(userId: string): Promise<Company | undefined> {
    return db.query.companies.findFirst({
      where: eq(companies.ownerId, userId),
    });
  },

  async setName(userId: string, name: string): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({ ownerId: userId, name })
      .onConflictDoUpdate({ target: companies.ownerId, set: { name } })
      .returning();

    return company;
  },
};
