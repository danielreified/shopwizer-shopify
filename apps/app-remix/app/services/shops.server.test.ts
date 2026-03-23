import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";

vi.mock("../db.server", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { default: mockDeep<PrismaClient>() };
});

import prisma from "../db.server";
import { getShopPlan, getTrialDaysLeft, getOrdersThisMonth, getProductCount } from "./shops.server";

describe("getShopPlan", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns FREE when shop not found", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);
    const plan = await getShopPlan("shop-001");
    expect(plan).toBe("FREE");
  });

  it("returns plan name when active subscription exists", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({
      id: "shop-001",
      subscriptions: [{ name: "Pro Plan", status: "ACTIVE" }],
    } as any);
    const plan = await getShopPlan("shop-001");
    expect(plan).toBe("Pro Plan");
  });

  it("returns PAID when subscription has no name", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({
      id: "shop-001",
      subscriptions: [{ name: null, status: "ACTIVE" }],
    } as any);
    const plan = await getShopPlan("shop-001");
    expect(plan).toBe("PAID");
  });

  it("returns FREE when no active subscriptions", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({
      id: "shop-001",
      subscriptions: [],
    } as any);
    const plan = await getShopPlan("shop-001");
    expect(plan).toBe("FREE");
  });
});

describe("getTrialDaysLeft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 0 when shop not found", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue(null);
    const days = await getTrialDaysLeft("shop-001");
    expect(days).toBe(0);
  });

  it("returns 0 when trialEndsAt is null", async () => {
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({ trialEndsAt: null } as any);
    const days = await getTrialDaysLeft("shop-001");
    expect(days).toBe(0);
  });

  it("returns positive days when trial is active", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({ trialEndsAt: futureDate } as any);
    const days = await getTrialDaysLeft("shop-001");
    expect(days).toBe(10);
  });

  it("returns 0 when trial has expired", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    vi.mocked(prisma.shop.findUnique).mockResolvedValue({ trialEndsAt: pastDate } as any);
    const days = await getTrialDaysLeft("shop-001");
    expect(days).toBe(0);
  });
});

describe("getOrdersThisMonth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns count of billable orders", async () => {
    vi.mocked(prisma.order.count).mockResolvedValue(42);
    const count = await getOrdersThisMonth("shop-001");
    expect(count).toBe(42);
    expect(prisma.order.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shopId: "shop-001",
          isBillable: true,
          isBulk: false,
        }),
      })
    );
  });
});

describe("getProductCount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns product count for shop", async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(100);
    const count = await getProductCount("shop-001");
    expect(count).toBe(100);
  });
});
