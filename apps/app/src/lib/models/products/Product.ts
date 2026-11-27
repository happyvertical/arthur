import { smrt } from '@happyvertical/smrt-core';
import { Product as ProductBase } from '@happyvertical/smrt-products/models';

@smrt({ replaceParent: true })
export class Product extends ProductBase {}
