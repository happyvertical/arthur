import { smrt } from '@happyvertical/smrt-core';
import { Account as AccountBase } from '@happyvertical/smrt-ledgers';

@smrt({ replaceParent: true })
export class Account extends AccountBase {}
