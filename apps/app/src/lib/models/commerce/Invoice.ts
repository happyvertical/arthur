import { Invoice as InvoiceBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class Invoice extends InvoiceBase {}
