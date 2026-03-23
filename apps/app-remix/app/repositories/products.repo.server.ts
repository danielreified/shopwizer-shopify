type TxClient = Pick<any, "product">;

export const makeProductRepo = (db: TxClient) => ({
  async findByIdForShop(shopId: string, productId: string | number | bigint) {
    return db.product.findFirst({
      where: { id: BigInt(productId), shopId },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        attributesEmbeddings: true,
        variants: {
          orderBy: { position: "asc" },
        },
        category: true
      },
    });
  },
});
