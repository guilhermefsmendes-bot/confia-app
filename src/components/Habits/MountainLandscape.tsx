import { memo,useId } from 'react';
// Vector artwork stays outside the ticking subtree; no network image or animation loop.
export default memo(function MountainLandscape({days}:{days:number}) {
 const id=useId().replace(/:/g,''),progress=Math.min(1,Math.max(0,days)/30);
 return <svg className="challenge-mountain" viewBox="0 0 400 400" aria-hidden="true" focusable="false" data-testid="challenge-mountain">
  <defs><clipPath id={id+'clip'}><circle cx="200" cy="200" r="188"/></clipPath><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor="#F4E8D2"/><stop offset="1" stopColor="#E5EEDB"/></linearGradient><radialGradient id={id+'mist'}><stop stopColor="#FFFEF6" stopOpacity=".94"/><stop offset=".72" stopColor="#FFFEF6" stopOpacity=".75"/><stop offset="1" stopColor="#FFFEF6" stopOpacity=".12"/></radialGradient></defs>
  <g clipPath={'url(#'+id+'clip)'}><rect width="400" height="400" fill={'url(#'+id+'sky)'}/><circle cx={295-25*progress} cy={130-55*progress} r={29+7*progress} fill="#FFF8D6" opacity={.5+.4*progress}/><path d="M-25 340 72 151 133 234 219 76 353 267 434 167 444 400H-25Z" fill="var(--challenge-ring)" opacity=".24"/><path d="m177 151 42-75 51 73-30-16-18 10-12-24Z" fill="#FFFFF8" opacity=".75"/><path d="M-20 336 84 250 131 291 260 183 422 341 430 415H-20Z" fill="var(--challenge-ring)" opacity=".26"/><path d="M-20 355Q90 283 189 341T420 324V410H-20Z" fill="var(--challenge-ring)" opacity=".2"/><path d="M156 407C120 367 242 342 226 307S170 276 206 248 261 223 250 203" fill="none" stroke="#FFF8E4" strokeWidth="6" strokeLinecap="round" opacity=".85"/><ellipse cx="194" cy="205" rx="148" ry="153" fill={'url(#'+id+'mist)'}/></g>
 </svg>;
});
