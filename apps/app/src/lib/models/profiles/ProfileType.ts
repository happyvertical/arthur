import { smrt } from '@happyvertical/smrt-core';
import { ProfileType as ProfileTypeBase } from '@happyvertical/smrt-profiles';

@smrt({ replaceParent: true })
export class ProfileType extends ProfileTypeBase {}
