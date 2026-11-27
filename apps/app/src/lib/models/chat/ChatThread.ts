import { ChatThread as ChatThreadBase } from '@happyvertical/smrt-chat';
import { smrt } from '@happyvertical/smrt-core';

@smrt({ replaceParent: true })
export class ChatThread extends ChatThreadBase {}
