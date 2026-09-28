import { localDay, secondsToMidnight } from "../../data/habits/calendar";
export function readClockTime(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const remaining = secondsToMidnight(now);
  return {
    day: localDay(now),
    remaining,
    progress: Math.max(0, Math.min(1, (now.getTime() - start) / (end - start))),
    hours: Math.floor(remaining / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    time: [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
      .map(n => String(n).padStart(2, "0")).join(":"),
  };
}
const stops = [
  { day: 0, face: "#F8E4CF", ring: "#A96739", edge: "#DFC09E" },
  { day: 3, face: "#F5E9C7", ring: "#92702C", edge: "#D9C898" },
  { day: 7, face: "#EAF0DB", ring: "#768744", edge: "#C7D3AB" },
  { day: 14, face: "#DCE9D0", ring: "#587843", edge: "#B3CAA2" },
  { day: 30, face: "#D0E4CC", ring: "#386748", edge: "#9FC2A3" },
];
function mix(a:string, b:string, ratio:number) {
  const parts = [1,3,5].map(i => Math.round(parseInt(a.slice(i,i+2),16) * (1-ratio) + parseInt(b.slice(i,i+2),16) * ratio).toString(16).padStart(2,"0"));
  return "#" + parts.join("");
}
export function challengePalette(days:number) {
  const day = Math.max(0, Math.min(30, days));
  const right = stops.findIndex(stop => stop.day >= day);
  const end = stops[right < 0 ? stops.length - 1 : right];
  const start = stops[Math.max(0, right - 1)];
  const ratio = end.day === start.day ? 0 : (day-start.day)/(end.day-start.day);
  return { face: mix(start.face,end.face,ratio), ring: mix(start.ring,end.ring,ratio), edge: mix(start.edge,end.edge,ratio) };
}
