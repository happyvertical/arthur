import { Customer as CustomerBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class Customer extends CustomerBase {}
