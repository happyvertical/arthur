import { InvoiceLineItem as InvoiceLineItemBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class InvoiceLineItem extends InvoiceLineItemBase {}
