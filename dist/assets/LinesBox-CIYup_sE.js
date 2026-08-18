import{o as i,b as l,d as n,t as c,a3 as d,C as p}from"./main-BzfIGtWR.js";const _={class:"lines-box"},u={class:"lines-gutter","aria-hidden":"true"},h={class:"lines-body"},x={__name:"LinesBox",props:{text:{type:String,default:""}},setup(a){const o=a,r=p(()=>{const e=o.text?o.text.split(`
`).length:0;let s="";for(let t=1;t<=e;t++)s+=(t>1?`
`:"")+t;return s});return(e,s)=>(i(),l("div",_,[n("div",u,c(r.value),1),n("div",h,[d(e.$slots,"default")])]))}};export{x as _};
