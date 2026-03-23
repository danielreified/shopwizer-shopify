import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import { getDistinctTags } from "../../services/products.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const tags = await getDistinctTags(session.shop);
    return { tags };
};
