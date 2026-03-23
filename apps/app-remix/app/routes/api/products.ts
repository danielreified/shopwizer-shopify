import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import { listProductsTable } from "../../services/products.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

    const { rows, total } = await listProductsTable({
        shopId: session.shop,
        q,
        take: pageSize,
        skip: (page - 1) * pageSize,
    });

    return { products: rows, total, page, pageSize };
};
