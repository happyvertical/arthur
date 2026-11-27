import { smrt } from '@happyvertical/smrt-core';
import { StockLevel as StockLevelBase } from '@happyvertical/smrt-inventory';

@smrt({ replaceParent: true })
export class StockLevel extends StockLevelBase {}
