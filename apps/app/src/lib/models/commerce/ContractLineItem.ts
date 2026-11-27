import { ContractLineItem as ContractLineItemBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class ContractLineItem extends ContractLineItemBase {}
