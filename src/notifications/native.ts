import { Capacitor,registerPlugin,type PluginListenerHandle } from '@capacitor/core';
export const isNativeAndroid=()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
export interface NoticePermissionInfo {deviceId:string;permission:boolean;permissionState?:'granted'|'denied'|'notRequested';communityChannel?:boolean;reminderChannel?:boolean;}
interface ConfiaDevice {
 info():Promise<NoticePermissionInfo>;
 requestNoticePermission():Promise<{granted:boolean}>;
 token():Promise<{token:string}>;
 configure(options:{owner:string;community:boolean;reminder:boolean;time:string;language:string;completedDate:string}):Promise<void>;
 widget(options:{snapshot:Record<string,unknown>}):Promise<void>;
 consumeLink():Promise<{url?:string}>;
 openNoticeSettings():Promise<void>;
 pinWidget():Promise<{supported:boolean}>;
 addListener(event:'tokenChanged'|'openLink',handler:(event:{token?:string;url?:string})=>void):Promise<PluginListenerHandle>;
}
export const ConfiaDevice=registerPlugin<ConfiaDevice>('ConfiaDevice');
