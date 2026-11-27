import { smrt } from '@happyvertical/smrt-core';
import { EventParticipant as EventParticipantBase } from '@happyvertical/smrt-events';

@smrt({ replaceParent: true })
export class EventParticipant extends EventParticipantBase {}
