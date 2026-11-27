import { Agreement as AgreementBase } from '@happyvertical/smrt-commerce';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class Agreement extends AgreementBase {}
