import { smrt } from '@happyvertical/smrt-core';
import { StockMovement as StockMovementBase } from '@happyvertical/smrt-inventory';

@smrt({ replaceParent: true })
export class StockMovement extends StockMovementBase {}
