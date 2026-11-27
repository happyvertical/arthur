import { smrt } from '@happyvertical/smrt-core';
import { Journal as JournalBase } from '@happyvertical/smrt-ledgers';

@smrt({ replaceParent: true })
export class Journal extends JournalBase {}
