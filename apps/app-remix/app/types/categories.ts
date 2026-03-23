export type CategoryNode = {
    id: string;
    name: string;
    fullName: string;
    parentId: string | null;
    isLeaf: boolean;
    depth: number;
};
