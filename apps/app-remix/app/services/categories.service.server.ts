import prisma from "../db.server";

export type CategoryNode = {
    id: string;
    name: string;
    fullName: string;
    parentId: string | null;
    isLeaf: boolean;
    depth: number;
};

export async function getTopLevelCategories(): Promise<CategoryNode[]> {
    return prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            fullName: true,
            parentId: true,
            isLeaf: true,
            depth: true,
        },
    });
}

export async function getCategoryChildren(parentId: string): Promise<CategoryNode[]> {
    return prisma.category.findMany({
        where: { parentId },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            fullName: true,
            parentId: true,
            isLeaf: true,
            depth: true,
        },
    });
}

export async function searchCategories(q: string): Promise<CategoryNode[]> {
    return prisma.category.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { fullName: { contains: q, mode: "insensitive" } },
            ],
        },
        take: 50,
        orderBy: { depth: "asc" },
        select: {
            id: true,
            name: true,
            fullName: true,
            parentId: true,
            isLeaf: true,
            depth: true,
        },
    });
}

export async function getCategoryById(id: string): Promise<CategoryNode | null> {
    return prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            fullName: true,
            parentId: true,
            isLeaf: true,
            depth: true,
        },
    });
}
