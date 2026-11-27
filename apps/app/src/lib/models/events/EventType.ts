import { smrt } from '@happyvertical/smrt-core';
import { EventType as EventTypeBase } from '@happyvertical/smrt-events';

@smrt({ replaceParent: true })
export class EventType extends EventTypeBase {}
