import { smrt } from '@happyvertical/smrt-core';
import { EventSeries as EventSeriesBase } from '@happyvertical/smrt-events';

@smrt({ replaceParent: true })
export class EventSeries extends EventSeriesBase {}
