import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import {
    getTopLevelCategories,
    getCategoryChildren,
    searchCategories,
} from "../../services/categories.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const url = new URL(request.url);
    const parentId = url.searchParams.get("parentId");
    const q = url.searchParams.get("q");

    if (q) {
        const categories = await searchCategories(q);
        return { categories };
    }

    if (parentId) {
        const categories = await getCategoryChildren(parentId);
        return { categories };
    }

    const categories = await getTopLevelCategories();
    return { categories };
};
