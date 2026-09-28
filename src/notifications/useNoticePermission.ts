import {useEffect,useState,useCallback,useRef} from 'react';
import {App} from '@capacitor/app';
import {ConfiaDevice,isNativeAndroid,type NoticePermissionInfo} from './native';
export function useNoticePermission(){
 const [info,setInfo]=useState<NoticePermissionInfo|null>(null);const mounted=useRef(false),request=useRef(0);
 const refresh=useCallback(async()=>{const id=++request.current;if(!isNativeAndroid())return;try{const next=await ConfiaDevice.info();if(mounted.current&&id===request.current)setInfo(next);}catch{if(mounted.current&&id===request.current)setInfo(null);}},[]);
 useEffect(()=>{mounted.current=true;void refresh();const resume=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);const listener=isNativeAndroid()?App.addListener('appStateChange',({isActive})=>{if(isActive)void refresh();}):null;return()=>{mounted.current=false;request.current++;document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);void listener?.then(handle=>handle.remove());};},[refresh]);
 return {info,refresh};
}
