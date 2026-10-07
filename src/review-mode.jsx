import React,{useCallback,useEffect,useState} from 'react';

export const REVIEW_STOPS=[0,.20,.45,.55,.70,.85,1];
export function readReviewLocation(search){
 const params=new URLSearchParams(search),raw=params.get('p');
 const value=raw===null||raw.trim()===''?0:Number(raw);
 return {enabled:params.get('review')==='1',progress:Number.isFinite(value)?Math.max(0,Math.min(1,value)):0};
}
export function useReviewMode(){
 const [state,setState]=useState(()=>readReviewLocation(location.search));
 useEffect(()=>{const sync=()=>setState(readReviewLocation(location.search));addEventListener('popstate',sync);return()=>removeEventListener('popstate',sync)},[]);
 const select=useCallback(progress=>{
  const url=new URL(location.href);url.searchParams.set('review','1');url.searchParams.set('p',String(progress));
  history.replaceState(history.state,'',url);setState({enabled:true,progress});
 },[]);
 return {...state,select};
}
export function ReviewControls({progress,select}){
 return <>
  <div className="review-frame-label" role="status">GATE 02 — {Math.round(progress*100)}%<br/>REVIEW FRAME</div>
  <div className="review-frame-index" role="group" aria-label="Gate 02 review frames">
   {REVIEW_STOPS.map(value=><button key={value} type="button" aria-pressed={progress===value} onClick={()=>select(value)}>{Math.round(value*100)}%</button>)}
  </div>
 </>;
}
