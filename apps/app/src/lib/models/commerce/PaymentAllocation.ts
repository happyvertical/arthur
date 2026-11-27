import { PaymentAllocation as PaymentAllocationBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class PaymentAllocation extends PaymentAllocationBase {}
