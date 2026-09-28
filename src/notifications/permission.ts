import type {NoticePermissionInfo} from './native';
export type NoticeKind='community'|'reminder'|'milestones';
export function permissionStatus(info:NoticePermissionInfo|null,kind:NoticeKind):'granted'|'denied'|'notRequested'|'unknown'{
 if(!info)return 'unknown';
 if(info.permissionState==='notRequested')return 'notRequested';
 if(!info.permission||kind==='community'&&info.communityChannel===false||kind==='reminder'&&info.reminderChannel===false)return 'denied';
 return 'granted';
}
