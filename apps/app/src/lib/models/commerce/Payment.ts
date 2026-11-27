import { Payment as PaymentBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class Payment extends PaymentBase {}
