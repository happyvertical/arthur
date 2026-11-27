import { smrt } from '@happyvertical/smrt-core';
import { JournalEntry as JournalEntryBase } from '@happyvertical/smrt-ledgers';

@smrt({ replaceParent: true })
export class JournalEntry extends JournalEntryBase {}
