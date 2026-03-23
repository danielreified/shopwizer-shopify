import { type TProductDTO } from '../types/product';

export type ProductTransform = (p: TProductDTO) => TProductDTO;

export function runTransforms(p: TProductDTO, transforms: ProductTransform[]): TProductDTO {
  return transforms.reduce((acc, fn) => fn(acc), p);
}
