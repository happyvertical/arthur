import { smrt } from '@happyvertical/smrt-core';
import { Profile as ProfileBase } from '@happyvertical/smrt-profiles';

@smrt({ replaceParent: true })
export class Profile extends ProfileBase {}
