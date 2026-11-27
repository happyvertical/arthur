import { smrt } from '@happyvertical/smrt-core';
import { InventoryLocation as InventoryLocationBase } from '@happyvertical/smrt-inventory';

@smrt({ replaceParent: true })
export class InventoryLocation extends InventoryLocationBase {}
