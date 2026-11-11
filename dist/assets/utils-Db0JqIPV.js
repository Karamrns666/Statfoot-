import{i as e,t}from"./rolldown-runtime-COiEfhsA.js";import{At as n,Bt as r,D as i,E as a,F as o,I as s,N as c,Ot as l,Qt as u,Rt as d,bt as f,in as p,j as m,k as h,kt as g,nn as _,p as v,rn as y,wt as b,xt as x,y as S}from"./format-ph-bWruf.js";import{a as ee}from"./fileStore-YUoD9KVu.js";var C=t((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.for(`react.view_transition`),m=Symbol.iterator;function h(e){return typeof e!=`object`||!e?null:(e=m&&e[m]||e[`@@iterator`],typeof e==`function`?e:null)}var g={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},_=Object.assign,v={};function y(e,t,n){this.props=e,this.context=t,this.refs=v,this.updater=n||g}y.prototype.isReactComponent={},y.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},y.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function b(){}b.prototype=y.prototype;function x(e,t,n){this.props=e,this.context=t,this.refs=v,this.updater=n||g}var S=x.prototype=new b;S.constructor=x,_(S,y.prototype),S.isPureReactComponent=!0;var ee=Array.isArray;function C(){}var w={H:null,A:null,T:null,S:null},T=Object.prototype.hasOwnProperty;function E(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function D(e,t){return E(e.type,t,e.props)}function te(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function ne(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var O=/\/+/g;function k(e,t){return typeof e==`object`&&e&&e.key!=null?ne(``+e.key):t.toString(36)}function A(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(C,C):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function j(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,j(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+k(e,0):a,ee(o)?(i=``,c!=null&&(i=c.replace(O,`$&/`)+`/`),j(o,r,i,``,function(e){return e})):o!=null&&(te(o)&&(o=D(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(O,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(ee(e))for(var u=0;u<e.length;u++)a=e[u],s=l+k(a,u),c+=j(a,r,i,s,o);else if(u=h(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+k(a,u++),c+=j(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return j(A(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function M(e,t,n){if(e==null)return e;var r=[],i=0;return j(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function N(e){if(e._status===-1){var t=e._result,n=t();n.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t,n.status===void 0&&(n.status=`fulfilled`,n.value=t))},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t,n.status===void 0&&(n.status=`rejected`,n.reason=t))}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var re=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)};function P(e){var t=w.T,n={};n.types=t===null?null:t.types,w.T=n;try{var r=e(),i=w.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(C,re)}catch(e){re(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),w.T=t}}function F(e){var t=w.T;if(t!==null){var n=t.types;n===null?t.types=[e]:n.indexOf(e)===-1&&n.push(e)}else P(F.bind(null,e))}var ie={map:M,forEach:function(e,t,n){M(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return M(e,function(){t++}),t},toArray:function(e){return M(e,function(e){return e})||[]},only:function(e){if(!te(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=ie,e.Component=y,e.Fragment=r,e.Profiler=a,e.PureComponent=x,e.StrictMode=i,e.Suspense=l,e.ViewTransition=p,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=w,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return w.H.useMemoCache(e)}},e.addTransitionType=F,e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=_({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!T.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return E(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)T.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return E(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=te,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:N}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=P,e.unstable_useCacheRefresh=function(){return w.H.useCacheRefresh()},e.use=function(e){return w.H.use(e)},e.useActionState=function(e,t,n){return w.H.useActionState(e,t,n)},e.useCallback=function(e,t){return w.H.useCallback(e,t)},e.useContext=function(e){return w.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return w.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return w.H.useEffect(e,t)},e.useEffectEvent=function(e){return w.H.useEffectEvent(e)},e.useId=function(){return w.H.useId()},e.useImperativeHandle=function(e,t,n){return w.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return w.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return w.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return w.H.useMemo(e,t)},e.useOptimistic=function(e,t){return w.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return w.H.useReducer(e,t,n)},e.useRef=function(e){return w.H.useRef(e)},e.useState=function(e){return w.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return w.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return w.H.useTransition()},e.version=`19.3.1`})),w=t(((e,t)=>{t.exports=C()})),T=e(w(),1),E=/^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i,D=/^[\\/]{2}/;function te(e,t){return t+e.replace(/\\/g,`/`)}var ne=`popstate`;function O(e){return typeof e==`object`&&!!e&&`pathname`in e&&`search`in e&&`hash`in e&&`state`in e&&`key`in e}function k(e={}){function t(e,t){let n=t.state?.masked,{pathname:r,search:i,hash:a}=n||e.location;return re(``,{pathname:r,search:i,hash:a},t.state&&t.state.usr||null,t.state&&t.state.key||`default`,n?{pathname:e.location.pathname,search:e.location.search,hash:e.location.hash}:void 0)}function n(e,t){return typeof t==`string`?t:P(t)}return ie(t,n,null,e)}function A(e,t){if(e===!1||e==null)throw Error(t)}function j(e,t){if(!e){typeof console<`u`&&console.warn(t);try{throw Error(t)}catch{}}}function M(){return Math.random().toString(36).substring(2,10)}function N(e,t){return{usr:e.state,key:e.key,idx:t,masked:e.mask?{pathname:e.pathname,search:e.search,hash:e.hash}:void 0}}function re(e,t,n=null,r,i){return{pathname:typeof e==`string`?e:e.pathname,search:``,hash:``,...typeof t==`string`?F(t):t,state:n,key:t&&t.key||r||M(),mask:i}}function P({pathname:e=`/`,search:t=``,hash:n=``}){return t&&t!==`?`&&(e+=t.charAt(0)===`?`?t:`?`+t),n&&n!==`#`&&(e+=n.charAt(0)===`#`?n:`#`+n),e}function F(e){let t={};if(e){let n=e.indexOf(`#`);n>=0&&(t.hash=e.substring(n),e=e.substring(0,n));let r=e.indexOf(`?`);r>=0&&(t.search=e.substring(r),e=e.substring(0,r)),e&&(t.pathname=e)}return t}function ie(e,t,n,r={}){let{window:i=document.defaultView,v5Compat:a=!1}=r,o=i.history,s=`POP`,c=null,l=u();l??(l=0,o.replaceState({...o.state,idx:l},``));function u(){return(o.state||{idx:null}).idx}function d(){s=`POP`;let e=u(),t=e==null?null:e-l;l=e,c&&c({action:s,location:h.location,delta:t})}function f(e,t){s=`PUSH`;let r=O(e)?e:re(h.location,e,t);n&&n(r,e),l=u()+1;let d=N(r,l),f=h.createHref(r.mask||r);try{o.pushState(d,``,f)}catch(e){if(e instanceof DOMException&&e.name===`DataCloneError`)throw e;i.location.assign(f)}a&&c&&c({action:s,location:h.location,delta:1})}function p(e,t){s=`REPLACE`;let r=O(e)?e:re(h.location,e,t);n&&n(r,e),l=u();let i=N(r,l),d=h.createHref(r.mask||r);o.replaceState(i,``,d),a&&c&&c({action:s,location:h.location,delta:0})}function m(e){return I(i,e)}let h={get action(){return s},get location(){return e(i,o)},listen(e){if(c)throw Error(`A history only accepts one active listener`);return i.addEventListener(ne,d),c=e,()=>{i.removeEventListener(ne,d),c=null}},createHref(e){return t(i,e)},createURL:m,encodeLocation(e){let t=m(e);return{pathname:t.pathname,search:t.search,hash:t.hash}},push:f,replace:p,go(e){return o.go(e)}};return h}function I(e,t,n=!1){let r=`http://localhost`;e&&(r=e.location.origin===`null`?e.location.href:e.location.origin),A(r,`No window.location.(origin|href) available to create URL`);let i=typeof t==`string`?t:P(t);return i=i.replace(/ $/,`%20`),!n&&D.test(i)&&(i=r+i),new URL(i,r)}function L(e,t,n=`/`){return ae(e,t,n,!1)}function ae(e,t,n,r,i){let a=z((typeof t==`string`?F(t):t).pathname||`/`,n);if(a==null)return null;let o=i??oe(e),s=null,c=Se(a);for(let e=0;s==null&&e<o.length;++e)s=ve(o[e],c,r);return s}function oe(e){let t=R(e);return ce(t),t}function R(e,t=[],n=[],r=``,i=!1){let a=(e,a,o=i,s)=>{let c={relativePath:s===void 0?e.path||``:s,caseSensitive:e.caseSensitive===!0,childrenIndex:a,route:e};if(c.relativePath.startsWith(`/`)){if(!c.relativePath.startsWith(r)&&o)return;A(c.relativePath.startsWith(r),`Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),c.relativePath=c.relativePath.slice(r.length)}let l=B([r,c.relativePath]),u=n.concat(c);e.children&&e.children.length>0&&(A(e.index!==!0,`Index routes must not have child routes. Please remove all child routes from route path "${l}".`),R(e.children,t,u,l,o)),(e.path!=null||e.index)&&t.push({path:l,score:ge(l,e.index),routesMeta:u.map((e,t)=>{let[n,r]=xe(e.relativePath,e.caseSensitive,t===u.length-1);return{...e,matcher:n,compiledParams:r}})})};return e.forEach((e,t)=>{if(e.path===``||!e.path?.includes(`?`))a(e,t);else for(let n of se(e.path))a(e,t,!0,n)}),t}function se(e){let t=e.split(`/`);if(t.length===0)return[];let[n,...r]=t,i=n.endsWith(`?`),a=n.replace(/\?$/,``);if(r.length===0)return i?[a,``]:[a];let o=se(r.join(`/`)),s=[];return s.push(...o.map(e=>e===``?a:[a,e].join(`/`))),i&&s.push(...o),s.map(t=>e.startsWith(`/`)&&t===``?`/`:t)}function ce(e){e.sort((e,t)=>e.score===t.score?_e(e.routesMeta.map(e=>e.childrenIndex),t.routesMeta.map(e=>e.childrenIndex)):t.score-e.score)}var le=/^:[\w-]+$/,ue=3,de=2,fe=1,pe=10,me=-2,he=e=>e===`*`;function ge(e,t){let n=e.split(`/`),r=n.length;return n.some(he)&&(r+=me),t&&(r+=de),n.filter(e=>!he(e)).reduce((e,t)=>e+(le.test(t)?ue:t===``?fe:pe),r)}function _e(e,t){return e.length===t.length&&e.slice(0,-1).every((e,n)=>e===t[n])?e[e.length-1]-t[t.length-1]:0}function ve(e,t,n=!1){let{routesMeta:r}=e,i={},a=`/`,o=[];for(let e=0;e<r.length;++e){let s=r[e],c=e===r.length-1,l=a===`/`?t:t.slice(a.length)||`/`,u={path:s.relativePath,caseSensitive:s.caseSensitive,end:c},d=s.matcher&&s.compiledParams?be(u,l,s.matcher,s.compiledParams):ye(u,l),f=s.route;if(!d&&c&&n&&!r[r.length-1].route.index&&(d=ye({path:s.relativePath,caseSensitive:s.caseSensitive,end:!1},l)),!d)return null;Object.assign(i,d.params),o.push({params:i,pathname:B([a,d.pathname]),pathnameBase:je(B([a,d.pathnameBase])),route:f}),d.pathnameBase!==`/`&&(a=B([a,d.pathnameBase]))}return o}function ye(e,t){typeof e==`string`&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=xe(e.path,e.caseSensitive,e.end);return be(e,t,n,r)}function be(e,t,n,r){let i=t.match(n);if(!i)return null;let a=i[0],o=Ae(a,1),s=i.slice(1);return{params:r.reduce((e,{paramName:t,isOptional:n},r)=>{if(t===`*`){let e=s[r]||``;o=Ae(a.slice(0,a.length-e.length),1)}let i=s[r];return e[t]=n&&!i?void 0:(i||``).replace(/%2F/g,`/`),e},{}),pathname:a,pathnameBase:o,pattern:e}}function xe(e,t=!1,n=!0){j(e===`*`||!e.endsWith(`*`)||e.endsWith(`/*`),`Route path "${e}" will be treated as if it were "${e.replace(/\*$/,`/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/,`/*`)}".`);let r=[],i=`^`+e.replace(/\/*\*?$/,``).replace(/^\/*/,`/`).replace(/[\\.*+^${}|()[\]]/g,`\\$&`).replace(/\/:([\w-]+)(\?)?/g,(e,t,n,i,a)=>{if(r.push({paramName:t,isOptional:n!=null}),n){let t=a.charAt(i+e.length);return t&&t!==`/`?`/([^\\/]*)`:`(?:/([^\\/]*))?`}return`/([^\\/]+)`}).replace(/\/([\w-]+)\?(\/|$)/g,`(/$1)?$2`);return e.endsWith(`*`)?(r.push({paramName:`*`}),i+=e===`*`||e===`/*`?`(.*)$`:`(?:\\/(.+)|\\/*)$`):n?i+=`\\/*$`:e!==``&&e!==`/`&&(i+=`(?:(?=\\/|$))`),[new RegExp(i,t?void 0:`i`),r]}function Se(e){try{return e.split(`/`).map(e=>decodeURIComponent(e).replace(/\//g,`%2F`)).join(`/`)}catch(t){return j(!1,`The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`),e}}function z(e,t){if(t===`/`)return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith(`/`)?t.length-1:t.length,r=e.charAt(n);return r&&r!==`/`?null:e.slice(n)||`/`}function Ce(e,t=`/`){let{pathname:n,search:r=``,hash:i=``}=typeof e==`string`?F(e):e,a;return n?(n=ke(n),a=n.startsWith(`/`)||n.startsWith(`\\`)?we(n.substring(1),`/`):we(n,t)):a=t,{pathname:a,search:Me(r),hash:Ne(i)}}function we(e,t){let n=Ae(t).split(`/`);return e.split(`/`).forEach(e=>{e===`..`?n.length>1&&n.pop():e!==`.`&&n.push(e)}),n.length>1?n.join(`/`):`/`}function Te(e,t,n,r){return`Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`}function Ee(e){return e.filter((e,t)=>t===0||e.route.path&&e.route.path.length>0)}function De(e){let t=Ee(e);return t.map((e,n)=>n===t.length-1?e.pathname:e.pathnameBase)}function Oe(e,t,n,r=!1){let i;typeof e==`string`?i=F(e):(i={...e},A(!i.pathname||!i.pathname.includes(`?`),Te(`?`,`pathname`,`search`,i)),A(!i.pathname||!i.pathname.includes(`#`),Te(`#`,`pathname`,`hash`,i)),A(!i.search||!i.search.includes(`#`),Te(`#`,`search`,`hash`,i)));let a=e===``||i.pathname===``,o=a?`/`:i.pathname,s;if(o==null)s=n;else{let e=t.length-1;if(!r&&o.startsWith(`..`)){let t=o.split(`/`);for(;t[0]===`..`;)t.shift(),--e;i.pathname=t.join(`/`)}s=e>=0?t[e]:`/`}let c=Ce(i,s),l=o&&o!==`/`&&o.endsWith(`/`),u=(a||o===`.`)&&n.endsWith(`/`);return!c.pathname.endsWith(`/`)&&(l||u)&&(c.pathname+=`/`),c}var ke=e=>e.replace(/[\\/]{2,}/g,`/`),B=e=>ke(e.join(`/`));function Ae(e,t=0){let n=e.length;for(;n>t&&e.charCodeAt(n-1)===47;)n--;return n===e.length?e:e.slice(0,n)}var je=e=>Ae(e).replace(/^\/*/,`/`),Me=e=>!e||e===`?`?``:e.startsWith(`?`)?e:`?`+e,Ne=e=>!e||e===`#`?``:e.startsWith(`#`)?e:`#`+e,Pe=class{constructor(e,t,n,r=!1){this.status=e,this.statusText=t||``,this.internal=r,n instanceof Error?(this.data=n.toString(),this.error=n):this.data=n}};function Fe(e){return e!=null&&typeof e.status==`number`&&typeof e.statusText==`string`&&typeof e.internal==`boolean`&&`data`in e}function Ie(e){return B(e.map(e=>e.route.path).filter(Boolean))||`/`}var Le=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0;function Re(e,t){let n=e;if(typeof n!=`string`||!E.test(n))return{absoluteURL:void 0,isExternal:!1,to:n};let r=n,i=!1;if(Le)try{let e=new URL(window.location.href),r=D.test(n)?new URL(te(n,e.protocol)):new URL(n),a=z(r.pathname,t);r.origin===e.origin&&a!=null?n=a+r.search+r.hash:i=!0}catch{j(!1,`<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)}return{absoluteURL:r,isExternal:i,to:n}}Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);var ze=new URL(`http://localhost`);function Be(e){if(e.createURL)return e.createURL(`/`);try{return new URL(e.createHref(`/`),ze)}catch{return ze}}function Ve(e,t){return e.origin===t.origin&&(e.origin!==`null`||e.protocol===t.protocol&&e.host===t.host)}function He(e,t){if(e.startsWith(`//`))return!0;let n=t.protocol.toLowerCase();return e.toLowerCase().startsWith(n)?t.host===``||e.slice(n.length).startsWith(`//`):!1}function Ue(e,t,n,r){let i=null;try{i=e==null?null:new URL(e,n)}catch{}let a=new URL(t,n),o=i!=null&&!Ve(i,n),s=!Ve(a,n);if(r===`reject`){if(o||s)throw Error(`External navigation is not allowed`)}else if(s&&(i==null||!He(e,i)||!Ve(i,a)))throw Error(`External navigation is not allowed`)}var We=[`POST`,`PUT`,`PATCH`,`DELETE`];new Set(We);var Ge=[`GET`,...We];new Set(Ge);var Ke=[`about:`,`blob:`,`chrome:`,`chrome-untrusted:`,`content:`,`data:`,`devtools:`,`file:`,`filesystem:`,`javascript:`];function qe(e){try{return Ke.includes(new URL(e).protocol)}catch{return!1}}var Je=T.createContext(null);Je.displayName=`DataRouter`;var Ye=T.createContext(null);Ye.displayName=`DataRouterState`;var Xe=T.createContext(!1);function Ze(){return T.useContext(Xe)}var Qe=T.createContext({isTransitioning:!1});Qe.displayName=`ViewTransition`;var $e=T.createContext(new Map);$e.displayName=`Fetchers`;var et=T.createContext(null);et.displayName=`Await`;var V=T.createContext(null);V.displayName=`Navigation`;var tt=T.createContext(null);tt.displayName=`Location`;var H=T.createContext({outlet:null,matches:[],isDataRoute:!1});H.displayName=`Route`;var nt=T.createContext(null);nt.displayName=`RouteError`;var rt=`REACT_ROUTER_ERROR`,it=`REDIRECT`,at=`ROUTE_ERROR_RESPONSE`;function ot(e){if(e.startsWith(`${rt}:${it}:{`))try{let t=JSON.parse(e.slice(28));if(typeof t==`object`&&t&&typeof t.status==`number`&&typeof t.statusText==`string`&&typeof t.location==`string`&&typeof t.reloadDocument==`boolean`&&typeof t.replace==`boolean`)return t}catch{}}function st(e){if(e.startsWith(`${rt}:${at}:{`))try{let t=JSON.parse(e.slice(40));if(typeof t==`object`&&t&&typeof t.status==`number`&&typeof t.statusText==`string`)return new Pe(t.status,t.statusText,t.data)}catch{}}function ct(e,{relative:t}={}){A(lt(),`useHref() may be used only in the context of a <Router> component.`);let{basename:n,navigator:r}=T.useContext(V),{hash:i,pathname:a,search:o}=_t(e,{relative:t}),s=a;return n!==`/`&&(s=a===`/`?n:B([n,a])),r.createHref({pathname:s,search:o,hash:i})}function lt(){return T.useContext(tt)!=null}function U(){return A(lt(),`useLocation() may be used only in the context of a <Router> component.`),T.useContext(tt).location}var ut=`You should call navigate() in a React.useEffect(), not when your component is first rendered.`;function dt(e){T.useContext(V).static||T.useLayoutEffect(e)}function ft(){let{isDataRoute:e}=T.useContext(H);return e?Pt():pt()}function pt(){A(lt(),`useNavigate() may be used only in the context of a <Router> component.`);let e=T.useContext(Je),{basename:t,navigator:n}=T.useContext(V),{matches:r}=T.useContext(H),{pathname:i}=U(),a=JSON.stringify(De(r)),o=T.useRef(!1);return dt(()=>{o.current=!0}),T.useCallback((r,s={})=>{if(j(o.current,ut),!o.current)return;if(typeof r==`number`){n.go(r);return}let c=Oe(r,JSON.parse(a),i,s.relative===`path`);e==null&&t!==`/`&&(c.pathname=c.pathname===`/`?t:B([t,c.pathname])),Ue(typeof r==`string`?r:P(r),n.createHref(c),Be(n),`reject`),(s.replace?n.replace:n.push)(c,s.state,s)},[t,n,a,i,e])}var mt=T.createContext(null);function ht(e){let t=T.useContext(H).outlet;return T.useMemo(()=>t&&T.createElement(mt.Provider,{value:e},t),[t,e])}function gt(){let{matches:e}=T.useContext(H);return e[e.length-1]?.params??{}}function _t(e,{relative:t}={}){let{matches:n}=T.useContext(H),{pathname:r}=U(),i=JSON.stringify(De(n));return T.useMemo(()=>Oe(e,JSON.parse(i),r,t===`path`),[e,i,r,t])}function vt(e,t){return yt(e,t)}function yt(e,t,n){A(lt(),`useRoutes() may be used only in the context of a <Router> component.`);let{navigator:r}=T.useContext(V),{matches:i}=T.useContext(H),a=i[i.length-1],o=a?a.params:{},s=a?a.pathname:`/`,c=a?a.pathnameBase:`/`,l=a&&a.route;{let e=l&&l.path||``;It(s,!l||e.endsWith(`*`)||e.endsWith(`*?`),`You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e===`/`?`*`:`${e}/*`}">.`)}let u=U(),d;if(t){let e=typeof t==`string`?F(t):t;A(c===`/`||e.pathname?.startsWith(c),`When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`),d=e}else d=u;let f=d.pathname||`/`,p=f;if(c!==`/`){let e=c.replace(/^\//,``).split(`/`);p=`/`+f.replace(/^\//,``).split(`/`).slice(e.length).join(`/`)}let m=n&&n.state.matches.length?n.state.matches.map(e=>Object.assign(e,{route:n.manifest[e.route.id]||e.route})):L(e,{pathname:p});j(l||m!=null,`No routes matched location "${d.pathname}${d.search}${d.hash}" `),j(m==null||m[m.length-1].route.element!==void 0||m[m.length-1].route.Component!==void 0||m[m.length-1].route.lazy!==void 0,`Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);let h=Et(m&&m.map(e=>Object.assign({},e,{params:Object.assign({},o,e.params),pathname:B([c,r.encodeLocation?r.encodeLocation(e.pathname.replace(/%/g,`%25`).replace(/\?/g,`%3F`).replace(/#/g,`%23`)).pathname:e.pathname]),pathnameBase:e.pathnameBase===`/`?c:B([c,r.encodeLocation?r.encodeLocation(e.pathnameBase.replace(/%/g,`%25`).replace(/\?/g,`%3F`).replace(/#/g,`%23`)).pathname:e.pathnameBase])})),i,n);return t&&h?T.createElement(tt.Provider,{value:{location:{pathname:`/`,search:``,hash:``,state:null,key:`default`,mask:void 0,...d},navigationType:`POP`}},h):h}function bt(){let e=Nt(),t=Fe(e)?`${e.status} ${e.statusText}`:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,r=`rgba(200,200,200, 0.5)`,i={padding:`0.5rem`,backgroundColor:r},a={padding:`2px 4px`,backgroundColor:r},o=null;return console.error(`Error handled by React Router default ErrorBoundary:`,e),o=T.createElement(T.Fragment,null,T.createElement(`p`,null,`💿 Hey developer 👋`),T.createElement(`p`,null,`You can provide a way better UX than this when your app throws errors by providing your own `,T.createElement(`code`,{style:a},`ErrorBoundary`),` or`,` `,T.createElement(`code`,{style:a},`errorElement`),` prop on your route.`)),T.createElement(T.Fragment,null,T.createElement(`h2`,null,`Unexpected Application Error!`),T.createElement(`h3`,{style:{fontStyle:`italic`}},t),n?T.createElement(`pre`,{style:i},n):null,o)}var xt=T.createElement(bt,null),St=class extends T.Component{constructor(e){super(e),this.state={location:e.location,revalidation:e.revalidation,error:e.error}}static getDerivedStateFromError(e){return{error:e}}static getDerivedStateFromProps(e,t){return t.location!==e.location||t.revalidation!==`idle`&&e.revalidation===`idle`?{error:e.error,location:e.location,revalidation:e.revalidation}:{error:e.error===void 0?t.error:e.error,location:t.location,revalidation:e.revalidation||t.revalidation}}componentDidCatch(e,t){this.props.onError?this.props.onError(e,t):console.error(`React Router caught the following error during render`,e)}render(){let e=this.state.error;if(this.context&&typeof e==`object`&&e&&`digest`in e&&typeof e.digest==`string`){let t=st(e.digest);t&&(e=t)}let t=e===void 0?this.props.children:T.createElement(H.Provider,{value:this.props.routeContext},T.createElement(nt.Provider,{value:e,children:this.props.component}));return this.context?T.createElement(wt,{error:e},t):t}};St.contextType=Xe;var Ct=new WeakMap;function wt({children:e,error:t}){let{basename:n,navigator:r}=T.useContext(V);if(typeof t==`object`&&t&&`digest`in t&&typeof t.digest==`string`){let e=ot(t.digest);if(e){let i=Ct.get(t);if(i)throw i;let a=Re(e.location,n),o=a.absoluteURL||a.to;if(Ue(e.location,o,Be(r),`allow-explicit`),qe(o))throw Error(`Invalid redirect location`);if(Le&&!Ct.get(t)){if(a.isExternal||e.reloadDocument)window.location.href=o;else{let n=Promise.resolve().then(()=>window.__reactRouterDataRouter.navigate(a.to,{replace:e.replace}));throw Ct.set(t,n),n}}return T.createElement(`meta`,{httpEquiv:`refresh`,content:`0;url=${o}`})}}return e}function Tt({routeContext:e,match:t,children:n}){let r=T.useContext(Je);return r&&r.static&&r.staticContext&&(t.route.errorElement||t.route.ErrorBoundary)&&(r.staticContext._deepestRenderedBoundaryId=t.route.id),T.createElement(H.Provider,{value:e},n)}function Et(e,t=[],n){let r=n?.state;if(e==null){if(!r)return null;if(r.errors)e=r.matches;else if(t.length===0&&!r.initialized&&r.matches.length>0)e=r.matches;else return null}let i=e,a=r?.errors;if(a!=null){let e=i.findIndex(e=>e.route.id&&a?.[e.route.id]!==void 0);A(e>=0,`Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`),i=i.slice(0,Math.min(i.length,e+1))}let o=!1,s=-1;if(n&&r){o=r.renderFallback;for(let e=0;e<i.length;e++){let t=i[e];if((t.route.HydrateFallback||t.route.hydrateFallbackElement)&&(s=e),t.route.id){let{loaderData:e,errors:a}=r,c=t.route.loader&&!e.hasOwnProperty(t.route.id)&&(!a||a[t.route.id]===void 0);if(t.route.lazy||c){n.isStatic&&(o=!0),i=s>=0?i.slice(0,s+1):[i[0]];break}}}}let c=n?.onError,l=r&&c?(e,t)=>{c(e,{location:r.location,params:r.matches?.[0]?.params??{},pattern:Ie(r.matches),errorInfo:t})}:void 0;return i.reduceRight((e,n,c)=>{let u,d=!1,f=null,p=null;r&&(u=a&&n.route.id?a[n.route.id]:void 0,f=n.route.errorElement||xt,o&&(s<0&&c===0?(It(`route-fallback`,!1,"No `HydrateFallback` element provided to render during initial hydration"),d=!0,p=null):s===c&&(d=!0,p=n.route.hydrateFallbackElement||null)));let m=t.concat(i.slice(0,c+1)),h=()=>{let t;return t=u?f:d?p:n.route.Component?T.createElement(n.route.Component,null):n.route.element?n.route.element:e,T.createElement(Tt,{match:n,routeContext:{outlet:e,matches:m,isDataRoute:r!=null},children:t})};return r&&(n.route.ErrorBoundary||n.route.errorElement||c===0)?T.createElement(St,{location:r.location,revalidation:r.revalidation,component:f,error:u,children:h(),routeContext:{outlet:null,matches:m,isDataRoute:!0},onError:l}):h()},null)}function Dt(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function Ot(e){let t=T.useContext(Je);return A(t,Dt(e)),t}function kt(e){let t=T.useContext(Ye);return A(t,Dt(e)),t}function At(e){let t=T.useContext(H);return A(t,Dt(e)),t}function jt(e){let t=At(e),n=t.matches[t.matches.length-1];return A(n.route.id,`${e} can only be used on routes that contain a unique "id"`),n.route.id}function Mt(){return jt(`useRouteId`)}function Nt(){let e=T.useContext(nt),t=kt(`useRouteError`),n=jt(`useRouteError`);return e===void 0?t.errors?.[n]:e}function Pt(){let{router:e}=Ot(`useNavigate`),t=jt(`useNavigate`),n=T.useRef(!1);return dt(()=>{n.current=!0}),T.useCallback(async(r,i={})=>{j(n.current,ut),n.current&&(typeof r==`number`?await e.navigate(r):await e.navigate(r,{fromRouteId:t,...i}))},[e,t])}var Ft={};function It(e,t,n){!t&&!Ft[e]&&(Ft[e]=!0,j(!1,n))}T.memo(Lt);function Lt({routes:e,manifest:t,future:n,state:r,isStatic:i,onError:a}){return yt(e,void 0,{manifest:t,state:r,isStatic:i,onError:a,future:n})}function Rt({to:e,replace:t,state:n,relative:r}){A(lt(),`<Navigate> may be used only in the context of a <Router> component.`);let{static:i,navigator:a}=T.useContext(V);j(!i,`<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.`);let{matches:o}=T.useContext(H),{pathname:s}=U(),c=ft(),l=Oe(e,De(o),s,r===`path`);Ue(typeof e==`string`?e:P(e),a.createHref(l),Be(a),`reject`);let u=JSON.stringify(l);return T.useEffect(()=>{c(JSON.parse(u),{replace:t,state:n,relative:r})},[c,u,r,t,n]),null}function zt(e){return ht(e.context)}function Bt(e){A(!1,`A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.`)}function Vt({basename:e=`/`,children:t=null,location:n,navigationType:r=`POP`,navigator:i,static:a=!1,useTransitions:o}){A(!lt(),`You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`);let s=e.replace(/^\/*/,`/`),c=T.useMemo(()=>({basename:s,navigator:i,static:a,useTransitions:o,future:{}}),[s,i,a,o]);typeof n==`string`&&(n=F(n));let{pathname:l=`/`,search:u=``,hash:d=``,state:f=null,key:p=`default`,mask:m}=n,h=T.useMemo(()=>{let e=z(l,s);return e==null?null:{location:{pathname:e,search:u,hash:d,state:f,key:p,mask:m},navigationType:r}},[s,l,u,d,f,p,r,m]);return j(h!=null,`<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`),h==null?null:T.createElement(V.Provider,{value:c},T.createElement(tt.Provider,{children:t,value:h}))}function Ht({children:e,location:t}){return vt(Ut(e),t)}T.Component;function Ut(e,t=[]){let n=[];return T.Children.forEach(e,(e,r)=>{if(!T.isValidElement(e))return;let i=[...t,r];if(e.type===T.Fragment){n.push.apply(n,Ut(e.props.children,i));return}A(e.type===Bt,`[${typeof e.type==`string`?e.type:e.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`),A(!e.props.index||!e.props.children,`An index route cannot have child routes.`);let a={id:e.props.id||i.join(`-`),caseSensitive:e.props.caseSensitive,element:e.props.element,Component:e.props.Component,index:e.props.index,path:e.props.path,middleware:e.props.middleware,loader:e.props.loader,action:e.props.action,hydrateFallbackElement:e.props.hydrateFallbackElement,HydrateFallback:e.props.HydrateFallback,errorElement:e.props.errorElement,ErrorBoundary:e.props.ErrorBoundary,hasErrorBoundary:e.props.hasErrorBoundary===!0||e.props.ErrorBoundary!=null||e.props.errorElement!=null,shouldRevalidate:e.props.shouldRevalidate,handle:e.props.handle,lazy:e.props.lazy};e.props.children&&(a.children=Ut(e.props.children,i)),n.push(a)}),n}var Wt=`get`,Gt=`application/x-www-form-urlencoded`;function Kt(e){return typeof HTMLElement<`u`&&e instanceof HTMLElement}function qt(e){return Kt(e)&&e.tagName.toLowerCase()===`button`}function Jt(e){return Kt(e)&&e.tagName.toLowerCase()===`form`}function Yt(e){return Kt(e)&&e.tagName.toLowerCase()===`input`}function Xt(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}function Zt(e,t){return e.button===0&&(!t||t===`_self`)&&!Xt(e)}function Qt(e=``){return new URLSearchParams(typeof e==`string`||Array.isArray(e)||e instanceof URLSearchParams?e:Object.keys(e).reduce((t,n)=>{let r=e[n];return t.concat(Array.isArray(r)?r.map(e=>[n,e]):[[n,r]])},[]))}function $t(e,t){let n=Qt(e);return t&&t.forEach((e,r)=>{n.has(r)||t.getAll(r).forEach(e=>{n.append(r,e)})}),n}var en=null;function tn(){if(en===null)try{new FormData(document.createElement(`form`),0),en=!1}catch{en=!0}return en}var nn=new Set([`application/x-www-form-urlencoded`,`multipart/form-data`,`text/plain`]);function rn(e){return e!=null&&!nn.has(e)?(j(!1,`"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Gt}"`),null):e}function an(e,t){let n,r,i,a,o;if(Jt(e)){let o=e.getAttribute(`action`);r=o?z(o,t):null,n=e.getAttribute(`method`)||Wt,i=rn(e.getAttribute(`enctype`))||Gt,a=new FormData(e)}else if(qt(e)||Yt(e)&&(e.type===`submit`||e.type===`image`)){let o=e.form;if(o==null)throw Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);let s=e.getAttribute(`formaction`)||o.getAttribute(`action`);if(r=s?z(s,t):null,n=e.getAttribute(`formmethod`)||o.getAttribute(`method`)||Wt,i=rn(e.getAttribute(`formenctype`))||rn(o.getAttribute(`enctype`))||Gt,a=new FormData(o,e),!tn()){let{name:t,type:n,value:r}=e;if(n===`image`){let e=t?`${t}.`:``;a.append(`${e}x`,`0`),a.append(`${e}y`,`0`)}else t&&a.append(t,r)}}else if(Kt(e))throw Error(`Cannot submit element that is not <form>, <button>, or <input type="submit|image">`);else n=Wt,r=null,i=Gt,o=e;return a&&i===`text/plain`&&(o=a,a=void 0),{action:r,method:n.toLowerCase(),encType:i,formData:a,body:o}}Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);function on(e,t){if(e===!1||e==null)throw Error(t)}function sn(e,t,n,r){let i=typeof e==`string`?new URL(e,typeof window>`u`?`server://singlefetch/`:window.location.origin):e;return i.pathname=n?i.pathname.endsWith(`/`)?`${i.pathname}_.${r}`:`${i.pathname}.${r}`:i.pathname===`/`?`_root.${r}`:t&&z(i.pathname,t)===`/`?`${Ae(t)}/_root.${r}`:`${Ae(i.pathname)}.${r}`,i}async function cn(e,t){if(e.id in t)return t[e.id];try{let n=await import(e.module);return t[e.id]=n,n}catch(t){return console.error(`Error loading route module \`${e.module}\`, reloading page...`),console.error(t),window.__reactRouterContext&&window.__reactRouterContext.isSpaMode,window.location.reload(),new Promise(()=>{})}}function ln(e){return e!=null&&typeof e.page==`string`}function un(e){return e==null?!1:e.href==null?e.rel===`preload`&&typeof e.imageSrcSet==`string`&&typeof e.imageSizes==`string`:typeof e.rel==`string`&&typeof e.href==`string`}async function dn(e,t,n){return gn((await Promise.all(e.map(async e=>{let r=t.routes[e.route.id];if(r){let e=await cn(r,n);return e.links?e.links():[]}return[]}))).flat(1).filter(un).filter(e=>e.rel===`stylesheet`||e.rel===`preload`).map(e=>e.rel===`stylesheet`?{...e,rel:`prefetch`,as:`style`}:{...e,rel:`prefetch`}))}function fn(e,t,n,r,i,a){let o=(e,t)=>!n[t]||e.route.id!==n[t].route.id,s=(e,t)=>n[t].pathname!==e.pathname||n[t].route.path?.endsWith(`*`)&&n[t].params[`*`]!==e.params[`*`];return a===`assets`?t.filter((e,t)=>o(e,t)||s(e,t)):a===`data`?t.filter((t,a)=>{let c=r.routes[t.route.id];if(!c||!c.hasLoader)return!1;if(o(t,a)||s(t,a))return!0;if(t.route.shouldRevalidate){let r=t.route.shouldRevalidate({currentUrl:new URL(i.pathname+i.search+i.hash,window.origin),currentParams:n[0]?.params||{},nextUrl:new URL(e,window.origin),nextParams:t.params,defaultShouldRevalidate:!0});if(typeof r==`boolean`)return r}return!0}):[]}function pn(e,t,{includeHydrateFallback:n}={}){return mn(e.map(e=>{let r=t.routes[e.route.id];if(!r)return[];let i=[r.module];return r.clientActionModule&&(i=i.concat(r.clientActionModule)),r.clientLoaderModule&&(i=i.concat(r.clientLoaderModule)),n&&r.hydrateFallbackModule&&(i=i.concat(r.hydrateFallbackModule)),r.imports&&(i=i.concat(r.imports)),i}).flat(1))}function mn(e){return[...new Set(e)]}function hn(e){let t={},n=Object.keys(e).sort();for(let r of n)t[r]=e[r];return t}function gn(e,t){let n=new Set,r=new Set(t);return e.reduce((e,i)=>{if(t&&!ln(i)&&i.as===`script`&&i.href&&r.has(i.href))return e;let a=JSON.stringify(hn(i));return n.has(a)||(n.add(a),e.push({key:a,link:i})),e},[])}function _n(){let e=T.useContext(Je);return on(e,`You must render this element inside a <DataRouterContext.Provider> element`),e}function vn(){let e=T.useContext(Ye);return on(e,`You must render this element inside a <DataRouterStateContext.Provider> element`),e}var yn=T.createContext(void 0);yn.displayName=`FrameworkContext`;function bn(){let e=T.useContext(yn);return on(e,`You must render this element inside a <HydratedRouter> element`),e}function xn(e,t){let n=T.useContext(yn),[r,i]=T.useState(!1),[a,o]=T.useState(!1),{onFocus:s,onBlur:c,onMouseEnter:l,onMouseLeave:u,onTouchStart:d}=t,f=T.useRef(null);T.useEffect(()=>{if(e===`render`&&o(!0),e===`viewport`){let e=new IntersectionObserver(e=>{e.forEach(e=>{o(e.isIntersecting)})},{threshold:.5});return f.current&&e.observe(f.current),()=>{e.disconnect()}}},[e]),T.useEffect(()=>{if(r){let e=setTimeout(()=>{o(!0)},100);return()=>{clearTimeout(e)}}},[r]);let p=()=>{i(!0)},m=()=>{i(!1),o(!1)};return n?e===`intent`?[a,f,{onFocus:Sn(s,p),onBlur:Sn(c,m),onMouseEnter:Sn(l,p),onMouseLeave:Sn(u,m),onTouchStart:Sn(d,p)}]:[a,f,{}]:[!1,f,{}]}function Sn(e,t){return n=>{e&&e(n),n.defaultPrevented||t(n)}}function Cn({page:e,...t}){let n=Ze(),{nonce:r}=bn(),{router:i}=_n(),a=T.useMemo(()=>L(i.routes,e,i.basename),[i.routes,e,i.basename]);return a?(t.nonce==null&&r&&(t={...t,nonce:r}),n?T.createElement(Tn,{page:e,matches:a,...t}):T.createElement(En,{page:e,matches:a,...t})):null}function wn(e){let{manifest:t,routeModules:n}=bn(),[r,i]=T.useState([]);return T.useEffect(()=>{let r=!1;return dn(e,t,n).then(e=>{r||i(e)}),()=>{r=!0}},[e,t,n]),r}function Tn({page:e,matches:t,...n}){let r=U(),{future:i}=bn(),{basename:a}=_n(),o=T.useMemo(()=>{if(e===r.pathname+r.search+r.hash)return[];let n=sn(e,a,i.v8_trailingSlashAwareDataRequests,`rsc`),o=!1,s=[];for(let e of t)typeof e.route.shouldRevalidate==`function`?o=!0:s.push(e.route.id);return o&&s.length>0&&n.searchParams.set(`_routes`,s.join(`,`)),[n.pathname+n.search]},[a,i.v8_trailingSlashAwareDataRequests,e,r,t]);return T.createElement(T.Fragment,null,o.map(e=>T.createElement(`link`,{key:e,rel:`prefetch`,as:`fetch`,href:e,...n})))}function En({page:e,matches:t,...n}){let r=U(),{future:i,manifest:a,routeModules:o}=bn(),{basename:s}=_n(),{loaderData:c,matches:l}=vn(),u=T.useMemo(()=>fn(e,t,l,a,r,`data`),[e,t,l,a,r]),d=T.useMemo(()=>fn(e,t,l,a,r,`assets`),[e,t,l,a,r]),f=T.useMemo(()=>{if(e===r.pathname+r.search+r.hash)return[];let n=new Set,l=!1;if(t.forEach(e=>{let t=a.routes[e.route.id];t&&t.hasLoader&&(!u.some(t=>t.route.id===e.route.id)&&e.route.id in c&&o[e.route.id]?.shouldRevalidate||t.hasClientLoader?l=!0:n.add(e.route.id))}),n.size===0)return[];let d=sn(e,s,i.v8_trailingSlashAwareDataRequests,`data`);return l&&n.size>0&&d.searchParams.set(`_routes`,t.filter(e=>n.has(e.route.id)).map(e=>e.route.id).join(`,`)),[d.pathname+d.search]},[s,i.v8_trailingSlashAwareDataRequests,c,r,a,u,t,e,o]),p=T.useMemo(()=>pn(d,a),[d,a]),m=wn(d);return T.createElement(T.Fragment,null,f.map(e=>T.createElement(`link`,{key:e,rel:`prefetch`,as:`fetch`,href:e,...n})),p.map(e=>T.createElement(`link`,{key:e,rel:`modulepreload`,href:e,...n})),m.map(({key:e,link:t})=>T.createElement(`link`,{key:e,nonce:n.nonce,...t,crossOrigin:t.crossOrigin??n.crossOrigin})))}function Dn(...e){return t=>{e.forEach(e=>{typeof e==`function`?e(t):e!=null&&(e.current=t)})}}T.Component;var On=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0;try{On&&(window.__reactRouterVersion=`7.18.5`)}catch{}function kn({basename:e,children:t,useTransitions:n,window:r}){let i=T.useRef();i.current??=k({window:r,v5Compat:!0});let a=i.current,[o,s]=T.useState({action:a.action,location:a.location}),c=T.useCallback(e=>{n===!1?s(e):T.startTransition(()=>s(e))},[n]);return T.useLayoutEffect(()=>a.listen(c),[a,c]),T.createElement(Vt,{basename:e,children:t,location:o.location,navigationType:o.action,navigator:a,useTransitions:n})}var An=T.forwardRef(function({onClick:e,discover:t=`render`,prefetch:n=`none`,relative:r,reloadDocument:i,replace:a,mask:o,state:s,target:c,to:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f,...p},m){let{basename:h,navigator:g,useTransitions:_}=T.useContext(V),v=typeof l==`string`&&E.test(l),y=Re(l,h);l=y.to;let b=ct(l,{relative:r}),x=U(),S=null;if(o){let e=Oe(o,[],x.mask?x.mask.pathname:`/`,!0);h!==`/`&&(e.pathname=e.pathname===`/`?h:B([h,e.pathname])),S=g.createHref(e)}let[ee,C,w]=xn(n,p),D=Fn(l,{replace:a,mask:o,state:s,target:c,preventScrollReset:u,relative:r,viewTransition:d,defaultShouldRevalidate:f,useTransitions:_});function te(t){e&&e(t),t.defaultPrevented||D(t)}let ne=!(y.isExternal||i),O=T.createElement(`a`,{...p,...w,href:(ne?S:void 0)||y.absoluteURL||b,onClick:ne?te:e,ref:Dn(m,C),target:c,"data-discover":!v&&t===`render`?`true`:void 0});return ee&&!v?T.createElement(T.Fragment,null,O,T.createElement(Cn,{page:b})):O});An.displayName=`Link`;var jn=T.forwardRef(function({"aria-current":e=`page`,caseSensitive:t=!1,className:n=``,end:r=!1,style:i,to:a,viewTransition:o,children:s,...c},l){let u=_t(a,{relative:c.relative}),d=U(),f=T.useContext(Ye),{navigator:p,basename:m}=T.useContext(V),h=f!=null&&Vn(u)&&o===!0,g=p.encodeLocation?p.encodeLocation(u).pathname:u.pathname,_=d.pathname,v=f&&f.navigation&&f.navigation.location?f.navigation.location.pathname:null;t||(_=_.toLowerCase(),v=v?v.toLowerCase():null,g=g.toLowerCase()),v&&m&&(v=z(v,m)||v);let y=g!==`/`&&g.endsWith(`/`)?g.length-1:g.length,b=_===g||!r&&_.startsWith(g)&&_.charAt(y)===`/`,x=v!=null&&(v===g||!r&&v.startsWith(g)&&v.charAt(g.length)===`/`),S={isActive:b,isPending:x,isTransitioning:h},ee=b?e:void 0,C;C=typeof n==`function`?n(S):[n,b?`active`:null,x?`pending`:null,h?`transitioning`:null].filter(Boolean).join(` `);let w=typeof i==`function`?i(S):i;return T.createElement(An,{...c,"aria-current":ee,className:C,ref:l,style:w,to:a,viewTransition:o},typeof s==`function`?s(S):s)});jn.displayName=`NavLink`;var Mn=T.forwardRef(({discover:e=`render`,fetcherKey:t,navigate:n,reloadDocument:r,replace:i,state:a,method:o=Wt,action:s,onSubmit:c,relative:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f,...p},m)=>{let{useTransitions:h}=T.useContext(V),g=zn(),_=Bn(s,{relative:l}),v=o.toLowerCase()===`get`?`get`:`post`,y=typeof s==`string`&&E.test(s);return T.createElement(`form`,{ref:m,method:v,action:_,onSubmit:r?c:e=>{if(c&&c(e),e.defaultPrevented)return;e.preventDefault();let r=e.nativeEvent.submitter,s=r?.getAttribute(`formmethod`)||o,p=()=>g(r||e.currentTarget,{fetcherKey:t,method:s,navigate:n,replace:i,state:a,relative:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f});h&&n!==!1?T.startTransition(()=>p()):p()},...p,"data-discover":!y&&e===`render`?`true`:void 0})});Mn.displayName=`Form`;function Nn(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function Pn(e){let t=T.useContext(Je);return A(t,Nn(e)),t}function Fn(e,{target:t,replace:n,mask:r,state:i,preventScrollReset:a,relative:o,viewTransition:s,defaultShouldRevalidate:c,useTransitions:l}={}){let u=ft(),d=U(),f=_t(e,{relative:o});return T.useCallback(p=>{if(Zt(p,t)){p.preventDefault();let t=n===void 0?P(d)===P(f):n,m=()=>u(e,{replace:t,mask:r,state:i,preventScrollReset:a,relative:o,viewTransition:s,defaultShouldRevalidate:c});l?T.startTransition(()=>m()):m()}},[d,u,f,n,r,i,t,e,a,o,s,c,l])}function In(e){j(typeof URLSearchParams<`u`,"You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");let t=T.useRef(Qt(e)),n=T.useRef(!1),r=U(),i=T.useMemo(()=>$t(r.search,n.current?null:t.current),[r.search]),a=ft();return[i,T.useCallback((e,t)=>{let r=Qt(typeof e==`function`?e(new URLSearchParams(i)):e);n.current=!0,a(`?`+r,t)},[a,i])]}var Ln=0,Rn=()=>`__${String(++Ln)}__`;function zn(){let{router:e}=Pn(`useSubmit`),{basename:t}=T.useContext(V),n=Mt(),r=e.fetch,i=e.navigate;return T.useCallback(async(e,a={})=>{let{action:o,method:s,encType:c,formData:l,body:u}=an(e,t);if(a.navigate===!1){let e=a.fetcherKey||Rn();await r(e,n,a.action||o,{defaultShouldRevalidate:a.defaultShouldRevalidate,preventScrollReset:a.preventScrollReset,formData:l,body:u,formMethod:a.method||s,formEncType:a.encType||c,flushSync:a.flushSync})}else await i(a.action||o,{defaultShouldRevalidate:a.defaultShouldRevalidate,preventScrollReset:a.preventScrollReset,formData:l,body:u,formMethod:a.method||s,formEncType:a.encType||c,replace:a.replace,state:a.state,fromRouteId:n,flushSync:a.flushSync,viewTransition:a.viewTransition})},[r,i,t,n])}function Bn(e,{relative:t}={}){let{basename:n}=T.useContext(V),r=T.useContext(H);A(r,`useFormAction must be used inside a RouteContext`);let[i]=r.matches.slice(-1),a={..._t(e||`.`,{relative:t})},o=U();if(e==null){a.search=o.search;let e=new URLSearchParams(a.search),t=e.getAll(`index`);if(t.some(e=>e===``)){e.delete(`index`),t.filter(e=>e).forEach(t=>e.append(`index`,t));let n=e.toString();a.search=n?`?${n}`:``}}return(!e||e===`.`)&&i.route.index&&(a.search=a.search?a.search.replace(/^\?/,`?index&`):`?index`),n!==`/`&&(a.pathname=a.pathname===`/`?n:B([n,a.pathname])),P(a)}function Vn(e,{relative:t}={}){let n=T.useContext(Qe);A(n!=null,"`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");let{basename:r}=Pn(`useViewTransitionState`),i=_t(e,{relative:t});if(!n.isTransitioning)return!1;let a=z(n.currentLocation.pathname,r)||n.currentLocation.pathname,o=z(n.nextLocation.pathname,r)||n.nextLocation.pathname;return ye(i.pathname,o)!=null||ye(i.pathname,a)!=null}var Hn=e=>e?.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase();function Un(e,t,n=[]){if(t==null)throw Error(`[lucide]: iconNode is required when icon name is used`);return{name:Hn(e),size:24,node:t,...n.length>0?{aliases:n}:{}}}var Wn=e=>{let t=``,n=!1;for(let r of e)r===`-`||r===`_`||r<=` `?n=t.length>0:(t.length===0?t+=r.toLowerCase():t+=n?r.toUpperCase():r,n=!1);return t},Gn=e=>{let t=Wn(e);return t.charAt(0).toUpperCase()+t.slice(1)},Kn=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),qn={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":2,"stroke-linecap":`round`,"stroke-linejoin":`round`};function Jn(e){return e!=null}function Yn(e,t={}){let n=t.attributeNames??{},r=e=>n[e]??e,i=e.size??e.width??qn.width,a=e.size??e.height??qn.height,o=e.aliases?.filter(e=>typeof e==`string`&&e.trim()!==``).map(e=>`lucide-${e}`)??[],s=[...e.name?[`lucide-${e.name}`]:[],...o],c=t.className?.split(` `).filter(Boolean)??[],l=t.includeDefaultClasses===!1?Kn(...c):Kn(`lucide`,...s,...c),u=t.absoluteStrokeWidth?Number(t.strokeWidth??qn[`stroke-width`])*Number(e.size??e.width??qn.width)/Number(t.size??t.width??qn.width):t.strokeWidth??qn[`stroke-width`];return[`svg`,{...Object.entries(qn).reduce((e,[t,n])=>(e[r(t)]=n,e),{}),...`color`in t&&t.color&&{[r(`stroke`)]:t.color},...`size`in t&&Jn(t.size)&&{[r(`width`)]:t.size,[r(`height`)]:t.size},...`width`in t&&Jn(t.width)&&{[r(`width`)]:t.width},...`height`in t&&Jn(t.height)&&{[r(`height`)]:t.height},[r(`stroke-width`)]:u,...l&&{[r(`class`)]:l},[r(`viewBox`)]:`0 0 ${i} ${a}`,...t.hasA11yProp===!1?{[r(`aria-hidden`)]:`true`}:{},...`attributes`in t&&t.attributes},e.node.map(e=>{let[n,i,a]=e,o=t.nonScalingStroke?{[r(`vector-effect`)]:`non-scaling-stroke`,...i}:i;return a?[n,o,a]:[n,o]})]}function Xn(e,t={}){return Yn(e,{...t,attributeNames:{...t.attributeNames,class:`className`,"stroke-width":`strokeWidth`,"stroke-linecap":`strokeLinecap`,"stroke-linejoin":`strokeLinejoin`,"vector-effect":`vectorEffect`}})}var Zn=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},Qn=(0,T.createContext)({}),$n=()=>(0,T.useContext)(Qn),er=(0,T.forwardRef)(({color:e,size:t,width:n,height:r,strokeWidth:i,absoluteStrokeWidth:a,nonScalingStroke:o,className:s=``,children:c,iconNode:l=[],icon:u={node:l,aliases:[],size:24},...d},f)=>{let{size:p=24,strokeWidth:m=2,absoluteStrokeWidth:h=!1,nonScalingStroke:g=!1,color:_=`currentColor`,className:v=``}=$n()??{},y=!!c||Zn(d),[b,x,S=[]]=Xn(u,{color:e??_,width:n??t??p,height:r??t??p,strokeWidth:i??m,absoluteStrokeWidth:a??h,nonScalingStroke:o??g,className:Kn(v,s),hasA11yProp:y,attributes:d});return(0,T.createElement)(b,{ref:f,...x},[...S.map(([e,t])=>(0,T.createElement)(e,t)),...Array.isArray(c)?c:[c]])});function tr(e,t=[],n=[]){let r=typeof e==`string`?Un(e,t,n):e,i=(0,T.forwardRef)(({className:e,...t},n)=>(0,T.createElement)(er,{ref:n,icon:r,className:e,...t}));return r.name&&(i.displayName=Gn(r.name)),i}var nr=t((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.fragment`);function r(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.Fragment=n,e.jsx=r,e.jsxs=r})),rr=t(((e,t)=>{t.exports=nr()})),ir=`statfoot:v1:`,ar=typeof window<`u`&&window.localStorage!==void 0,or=new Map,sr=new Set;function cr(e){if(!or.has(e)){let t=[];if(ar)try{t=JSON.parse(window.localStorage.getItem(ir+e)||`[]`)}catch{t=[]}or.set(e,t)}return or.get(e)}function lr(e,t){if(or.set(e,t),ar)try{window.localStorage.setItem(ir+e,JSON.stringify(t))}catch(e){console.error(`localStorage plein ?`,e)}fr(e)}var ur=0,dr=new Set;function fr(e){ur>0?dr.add(e):sr.forEach(t=>t(e))}var W={all(e){return cr(e)},replace(e,t){lr(e,t)},subscribe(e){return sr.add(e),()=>{sr.delete(e)}},batch(e){ur++;try{return e()}finally{if(ur--,ur===0){let e=[...dr];dr.clear(),e.forEach(fr)}}},getFlag(e){return ar?window.localStorage.getItem(ir+e):null},setFlag(e,t){ar&&(t===null?window.localStorage.removeItem(ir+e):window.localStorage.setItem(ir+e,t))},clearAll(){or.clear(),ar&&Object.keys(window.localStorage).filter(e=>e.startsWith(ir)).forEach(e=>window.localStorage.removeItem(e))}};ar&&window.addEventListener(`storage`,e=>{if(!e.key||!e.key.startsWith(ir))return;let t=e.key.slice(12);or.delete(t),sr.forEach(e=>e(t))});function pr(){return Date.now().toString(36)+Math.random().toString(36).slice(2,10)}var mr=`Season.Competition.Division.Group.Venue.Team.Player.Match.MatchEvent.Lineup.LiveState.MatchTeamStats.XPRule.Suspension.MonthlyAward.Award.Draw.Media.MotmVote.TeamOfWeek.Settings.Page.AuditLog.AdminUser.Rulebook.Club.CaptainTeam.CaptainMatch`.split(`.`);function hr(){let e=W.getFlag(`session`);return e?W.all(`AdminUser`).find(t=>t.id===e)??null:null}function gr(e){W.setFlag(`session`,e)}function _r(e,t,n){W.replace(`AuditLog`,[{id:pr(),created_date:new Date().toISOString(),action:e,entity:`AdminUser`,entity_id:t.id,entity_label:t.email,author_email:t.email,author_name:t.full_name??t.email,details:n},...W.all(`AuditLog`)])}function vr(e,t={}){let n=new Date().toISOString(),r={...e,...t,last_login:n,status:`active`,activated_at:e.activated_at??n};return W.replace(`AdminUser`,W.all(`AdminUser`).map(t=>t.id===e.id?r:t)),gr(e.id),_r(`login`,r),r}var yr=e=>W.all(`AdminUser`).find(t=>t.email.toLowerCase()===e.trim().toLowerCase()),br={async me(){let e=hr();if(!e||e.status===`disabled`)return null;let{password:t,...n}=e;return n},async login(e,t){let n=yr(e);if(!n)throw Error(`Ce compte n'existe pas. Les comptes sont créés uniquement par un administrateur.`);if(n.status===`disabled`)throw Error(`Ce compte est désactivé.`);if(n.status===`invited`)return vr(n,{password:t});if(n.password!==t)throw Error(`Mot de passe incorrect.`);return vr(n)},async loginWithGoogle(e){let t=yr(e);if(!t)throw Error(`Email non autorisé : demandez une invitation à un administrateur.`);if(t.status===`disabled`)throw Error(`Ce compte est désactivé.`);return vr(t)},async logout(){gr(null)}};async function xr(e){if(`createImageBitmap`in window)try{return await createImageBitmap(e)}catch{}let t=URL.createObjectURL(e);try{return await new Promise((e,n)=>{let r=new Image;r.onload=()=>e(r),r.onerror=n,r.src=t})}finally{setTimeout(()=>URL.revokeObjectURL(t),1e3)}}function Sr(e,t,n){return new Promise((r,i)=>e.toBlob(e=>e?r(e):i(Error(`Encodage impossible`)),t,n))}function Cr(e,t,n,r){let i=Math.min(1,n/e,r/t);return{w:Math.max(1,Math.round(e*i)),h:Math.max(1,Math.round(t*i))}}async function wr(e,t={}){if(!e.type.startsWith(`image/`)||e.type===`image/svg+xml`||e.type===`image/gif`)return e;let n=await xr(e),r=`naturalWidth`in n?n.naturalWidth:n.width,{w:i,h:a}=Cr(r,`naturalHeight`in n?n.naturalHeight:n.height,t.maxWidth??2e3,t.maxHeight??2e3),o=document.createElement(`canvas`);o.width=i,o.height=a;let s=o.getContext(`2d`);s.imageSmoothingQuality=`high`,s.drawImage(n,0,0,i,a);let c=await Sr(o,t.type??`image/webp`,t.quality??.84);return c.size<e.size||i<r?c:e}var Tr={Core:{async UploadFile({file:e,maxSize:t=2e3,hint:n}){let r=e;try{r=await wr(e,{maxWidth:t,maxHeight:t})}catch{}return{file_url:await ee(r,n)}}}};function Er(e,t){return Object.entries(t).every(([t,n])=>{let r=e[t];if(n&&typeof n==`object`&&!Array.isArray(n)){if(`$in`in n)return n.$in.includes(r);if(`$ne`in n)return r!==n.$ne}return r===n})}function Dr(e,t){if(!t)return e;let n=t.startsWith(`-`),r=n?t.slice(1):t;return[...e].sort((e,t)=>{let i=e[r],a=t[r];return i===a?0:i==null?1:a==null?-1:(i<a?-1:1)*(n?-1:1)})}var Or=[`AuditLog`,`MotmVote`,`LiveState`];function kr(e,t,n,r){if(Or.includes(t))return;let i=hr(),a=n,o=a?String(a.name??a.title??(a.first_name?`${a.first_name} ${a.last_name}`:a.type??a.email??a.id)):void 0,s={id:pr(),created_date:new Date().toISOString(),action:e,entity:t,entity_id:n?.id,entity_label:o,details:r,author_email:i?.email??`public`,author_name:i?.full_name??`Public`};W.replace(`AuditLog`,[s,...W.all(`AuditLog`)].slice(0,3e3))}function Ar(e,t){let n={};for(let r of Object.keys(t))JSON.stringify(e[r])!==JSON.stringify(t[r])&&(n[r]={avant:e[r],apres:t[r]});return n}var jr=e=>e===void 0?e:JSON.parse(JSON.stringify(e));function Mr(e){return{async list(t,n){let r=Dr(W.all(e),t);return jr(n?r.slice(0,n):r)},async filter(t,n,r){let i=Dr(W.all(e).filter(e=>Er(e,t)),n);return jr(r?i.slice(0,r):i)},async get(t){let n=W.all(e).find(e=>e.id===t);if(!n)throw Error(`${e} ${t} introuvable`);return jr(n)},async create(t){let n=new Date().toISOString(),r={...t,id:t.id??pr(),created_date:n,updated_date:n,created_by:hr()?.email};return W.replace(e,[...W.all(e),r]),kr(`create`,e,r),jr(r)},async bulkCreate(t){let n=new Date().toISOString(),r=t.map(e=>({...e,id:e.id??pr(),created_date:n,updated_date:n}));return W.replace(e,[...W.all(e),...r]),kr(`bulk_create`,e,void 0,{count:r.length}),jr(r)},async update(t,n){let r=W.all(e),i=r.findIndex(e=>e.id===t);if(i<0)throw Error(`${e} ${t} introuvable`);let a=r[i],o={...a,...n,id:t,updated_date:new Date().toISOString()},s=[...r];s[i]=o,W.replace(e,s);let c=Object.keys(n);return e===`Lineup`&&c.every(e=>e===`updated_date`)||kr(`update`,e,o,Ar(a,n)),jr(o)},async delete(t){let n=W.all(e),r=n.find(e=>e.id===t);W.replace(e,n.filter(e=>e.id!==t)),kr(`delete`,e,r,r?{supprime:r}:void 0)}}}var Nr={entities:Object.fromEntries(mr.map(e=>[e,Mr(e)])),auth:br,integrations:Tr,logActivity:(e,t,n,r)=>kr(e,t,n,r)};function Pr(e,t){return e.competitions.filter(e=>!t||e.season_id===t).sort((e,t)=>(e.order??0)-(t.order??0))}function Fr(e,t){let n=Pr(e,t),r=n.find(e=>e.phase===`gold`),i=n.find(e=>e.phase===`silver`),a=n.find(e=>e.phase===`league_phase`);if(r?.team_ids?.length&&i?.team_ids?.length){let t=x(e,r.id).map(e=>({...e,competition_id:r.id})),n=x(e,i.id).map(e=>({...e,competition_id:i.id,rank:e.rank+t.length}));return[...t,...n]}let o=a??n[0];return o?x(e,o.id).map(e=>({...e,competition_id:o.id})):[]}function Ir(e,t){if(!t.seasonId)return null;let n=Pr(e,t.seasonId),r=t.phase??`all`;if(r===`all`||r===`gold`||r===`knockout`){let i=e.matches.find(e=>e.season_id===t.seasonId&&e.stage===`final`&&b(e)&&(r!==`gold`||n.find(t=>t.id===e.competition_id)?.phase!==`silver`)),a=i?l(i):null;if(a)return{team_id:a,reason:`champion`}}let i=[];if(r===`all`)i=Fr(e,t.seasonId);else{let t=n.find(e=>e.phase===r);t&&(i=x(e,t.id))}let a=i.find(e=>e.played>0&&e.points>0);return a?{team_id:a.team_id,reason:`leader`,row:a}:null}function Lr(e,t={}){let i=new Map(e.competitions.map(e=>[e.id,e])),a=e.matches.filter(e=>b(e)&&m(e,i,t)).sort(f),o=new Map,s=e=>(o.has(e)||o.set(e,{team_id:e,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,gd:0,points:0,clean_sheets:0,yellow:0,red:0,gf_avg:0,ga_avg:0,shot:n(),timeline:[]}),o.get(e)),c=r.points.win,l=r.points.draw,u=r.points.loss,p=new Map;for(let t of e.events)p.has(t.match_id)||p.set(t.match_id,[]),p.get(t.match_id).push(t);for(let t of a)for(let n of[!0,!1]){let r=s(n?t.home_team_id:t.away_team_id),i=n?t.home_score:t.away_score,a=n?t.away_score:t.home_score;r.played++,r.gf+=i,r.ga+=a,i>a?(r.won++,r.points+=c):i<a?(r.lost++,r.points+=u):(r.drawn++,r.points+=l),a===0&&r.clean_sheets++,r.timeline.push({label:`J${t.round}`,gf:i,ga:a,points:r.points});let o=e.teamStats?.find(e=>e.match_id===t.id&&e.team_id===r.team_id&&(e.period??`full`)===`full`),f=d(t,p.get(t.id)??[],r.team_id,o);f&&(r.shot=g(r.shot,f))}let h=new Set(a.map(e=>e.id));for(let t of e.events){if(!h.has(t.match_id))continue;let e=o.get(t.team_id);e&&((t.type===`yellow_card`||t.type===`second_yellow`)&&e.yellow++,(t.type===`red_card`||t.type===`second_yellow`)&&e.red++)}for(let e of o.values())e.gd=e.gf-e.ga,e.gf_avg=e.played?+(e.gf/e.played).toFixed(2):0,e.ga_avg=e.played?+(e.ga/e.played).toFixed(2):0;return o}var Rr=e=>e.filter(e=>e.played>0).sort((e,t)=>e.ga_avg-t.ga_avg||e.ga-t.ga||t.points-e.points),zr=e=>e.filter(e=>e.played>0).sort((e,t)=>t.gf-e.gf||t.gf_avg-e.gf_avg||t.points-e.points);function Br(e,t={}){let n=new Map(e.competitions.map(e=>[e.id,e])),r=e.matches.filter(e=>b(e)&&m(e,n,t)),i=new Set(r.map(e=>e.id)),a=e.events.filter(e=>i.has(e.match_id)),o=r.reduce((e,t)=>e+t.home_score+t.away_score,0);return{matches:r.length,goals:o,goals_avg:r.length?+(o/r.length).toFixed(2):0,assists:a.filter(e=>e.type===`goal`&&e.related_player_id).length,yellow:a.filter(e=>e.type===`yellow_card`||e.type===`second_yellow`).length,red:a.filter(e=>e.type===`red_card`||e.type===`second_yellow`).length,saves:a.filter(e=>e.type===`save`||e.type===`penalty_saved`).length,clean_sheets:r.reduce((e,t)=>e+ +(t.home_score===0)+ +(t.away_score===0),0)}}var Vr={ballon_or:`Ballon d'or`,golden_glove:`Gant d'or`,top_scorer:`Soulier d'or`,top_assist:`Meilleur passeur`,best_team:`Meilleure équipe`,player_of_tournament:`Joueur du tournoi`,best_defense:`Meilleure défense`,best_attack:`Équipe la plus offensive`};function Hr(e,t){if(!e)return null;let n=new Date(e),r=t?new Date(t):new Date,i=r.getFullYear()-n.getFullYear();return(r.getMonth()<n.getMonth()||r.getMonth()===n.getMonth()&&r.getDate()<n.getDate())&&i--,i}function Ur(e,t){let n=[...h(e,t).values()],r=s(e.xpRules,t.seasonId),i=n.filter(e=>e.matches>=r.min_matches_awards).sort((e,t)=>t.xp-e.xp||t.goals-e.goals||t.assists-e.assists||e.matches-t.matches),a=[],o=e=>({matches:e.matches,goals:e.goals,assists:e.assists,xp:e.xp,clean_sheets:e.clean_sheets,saves:e.saves,conceded:e.conceded}),l=(e,t,n)=>a.push(t?{category:e,player_id:t.player_id,team_id:t.team_id,value:n(t),not_awarded:!1,snapshot:o(t)}:{category:e,not_awarded:!0});l(`ballon_or`,c(e,n,`ballon_or`,t.seasonId)[0]?.item,e=>e.xp),l(`golden_glove`,c(e,n,`golden_glove`,t.seasonId)[0]?.item,e=>e.xp),l(`top_scorer`,c(e,n,`top_scorer`,t.seasonId)[0]?.item,e=>e.goals),l(`top_assist`,c(e,n,`top_assist`,t.seasonId)[0]?.item,e=>e.assists),l(`player_of_tournament`,i[0],e=>e.xp);let u=Ir(e,t);a.push(u?{category:`best_team`,team_id:u.team_id,value:u.row?.points,not_awarded:!1,snapshot:{reason:u.reason}}:{category:`best_team`,not_awarded:!0});let d=[...Lr(e,t).values()],f=Rr(d)[0],p=zr(d)[0];return a.push(f?{category:`best_defense`,team_id:f.team_id,value:f.ga,not_awarded:!1,snapshot:{ga:f.ga,played:f.played,ga_avg:f.ga_avg}}:{category:`best_defense`,not_awarded:!0}),a.push(p?{category:`best_attack`,team_id:p.team_id,value:p.gf,not_awarded:!1,snapshot:{gf:p.gf,played:p.played}}:{category:`best_attack`,not_awarded:!0}),a}function Wr(e,t){let n=[],r=[];for(let i of t.filter(t=>t.match_id===e.id).sort((e,t)=>[`1H`,`2H`,`ET1`,`ET2`].indexOf(e.period??`1H`)-[`1H`,`2H`,`ET1`,`ET2`].indexOf(t.period??`1H`)||(e.minute??0)-(t.minute??0)))i.type===`goal`&&(i.team_id===e.home_team_id?n:r).push(i),i.type===`own_goal`&&(i.team_id===e.home_team_id?r:n).push(i);return{home:n,away:r}}function Gr(e){let t=new Map;for(let n of e)t.set(n.player_id,(t.get(n.player_id)??0)+1);return[...t.entries()].map(([t,n])=>({player_id:t,count:n,pct:e.length?Math.round(n/e.length*100):0})).sort((e,t)=>t.count-e.count)}function Kr(e,t){return e.season_id??t.find(t=>t.team_ids?.includes(e.id))?.season_id}var qr=e=>e.season_ids?.[0],G=e=>e.club_id??`club_${e.id}`,Jr=e=>e.person_id??e.id,Yr=e=>[...e].sort((e,t)=>(e.start_date??``).localeCompare(t.start_date??``)).map(e=>e.id);function Xr(e,t){let n=Yr(t),r=e?n.indexOf(e):-1;return r<=0?[]:n.slice(0,r).reverse()}var Zr=new Set([`fc`,`sa`,`sarl`,`maroc`,`morocco`,`groupe`,`group`,`the`,`de`,`du`,`des`,`la`,`le`,`les`,`et`,`team`,`equipe`]),Qr=e=>e.normalize(`NFD`).replace(/[̀-ͯ]/g,``).toLowerCase().replace(/[^a-z0-9]+/g,` `).trim(),$r=e=>Qr(e).split(` `).filter(e=>e&&!Zr.has(e));function ei(e){let t=Qr(e).replace(/ /g,``),n=[];for(let e=0;e<t.length-1;e++)n.push(t.slice(e,e+2));return n}function ti(e,t){if(!e||!t)return 0;if(Qr(e)===Qr(t))return 1;let n=new Set($r(e)),r=new Set($r(t)),i=[...n].filter(e=>r.has(e)).length,a=n.size+r.size?i/(n.size+r.size-i):0,o=ei(e),s=ei(t),c=[...s],l=0;for(let e of o){let t=c.indexOf(e);t>=0&&(l++,c.splice(t,1))}let u=o.length+s.length?2*l/(o.length+s.length):0;return Math.round(Math.max(a,u)*100)/100}var ni=.55;function ri(e,t,n,r,i=ni){let a=Kr(e,n),o=new Set(Xr(a,r));return t.filter(t=>t.id!==e.id&&o.has(Kr(t,n)??``)&&!e.link_dismissed?.includes(t.id)&&G(t)!==G(e)).map(t=>({item:t,seasonId:Kr(t,n),score:Math.max(ti(e.name,t.name),ti(e.company??e.name,t.company??t.name),e.short_name&&e.short_name===t.short_name?.6:0)})).filter(e=>e.score>=i).sort((e,t)=>t.score-e.score||Yr(r).indexOf(t.seasonId??``)-Yr(r).indexOf(e.seasonId??``))}function ii(e,t,n,r,i=ni){let a=new Set(Xr(qr(e),r)),o=e=>{let t=n.find(t=>t.id===e.team_id);return t?G(t):void 0},s=e=>`${e.first_name} ${e.last_name}`;return t.filter(t=>t.id!==e.id&&a.has(qr(t)??``)&&!e.link_dismissed?.includes(t.id)&&Jr(t)!==Jr(e)).map(t=>{let n=Math.max(ti(s(e),s(t)),ti(`${e.last_name} ${e.first_name}`,s(t))),r=o(t)&&o(t)===o(e)?.1:0;return{item:t,seasonId:qr(t),score:Math.min(1,Math.round((n+r)*100)/100)}}).filter(e=>e.score>=i).sort((e,t)=>t.score-e.score)}function ai(e,t,n,r){let i=Yr(r);return t.filter(t=>G(t)===G(e)).map(e=>({team:e,seasonId:Kr(e,n)})).sort((e,t)=>i.indexOf(e.seasonId??``)-i.indexOf(t.seasonId??``))}function oi(e,t,n,r){return n.find(n=>G(n)===G(e)&&Kr(n,r)===t)}function si(e,t,n){return n.find(n=>Jr(n)===Jr(e)&&n.season_ids?.includes(t))}var ci=[{name:`Arrow ECS`,short:`ARW`,aliases:[`ARROW ECS`,`Arrow`],c1:`#D9DDE2`,c2:`#1A1D21`},{name:`Atelier Vert Rabat`,short:`AVR`,aliases:[`ATELIER VERT-R`],c1:`#4A7729`,c2:`#0E1A08`},{name:`Atelier Vert Casa`,short:`AVC`,aliases:[`ATELIER VERT-C`],c1:`#4A7729`,c2:`#0E1A08`},{name:`Cobco`,short:`COB`,aliases:[`COBCO`],c1:`#005A83`,c2:`#06183A`},{name:`ALD Automotive`,short:`ALD`,aliases:[`ALD AUTOMOTIVE`,`ALD`],c1:`#1B2A4A`,c2:`#0A1124`},{name:`Pharmaprom`,short:`PHP`,aliases:[`PHARMAPROM`],c1:`#3A74C2`,c2:`#0A1E3D`},{name:`TAQEEF (MIDEA)`,short:`MID`,aliases:[`MIDEA`,`TAQEEF`,`Taqeef Midea`],c1:`#1C6FA8`,c2:`#04223A`},{name:`Wafasalaf`,short:`WAF`,aliases:[`WAFASALAF`],c1:`#009CB3`,c2:`#04262A`},{name:`JTI`,short:`JTI`,aliases:[`JTI`],c1:`#22B24C`,c2:`#081B10`},{name:`Crédit Agricole`,short:`CAM`,aliases:[`CREDIT AGRICOLE`,`Crédit Agricole du Maroc`],c1:`#29756E`,c2:`#04241B`},{name:`G3C`,short:`G3C`,aliases:[`G3C`,`G3C.ma`],c1:`#78BF43`,c2:`#16171A`},{name:`Parebrise Express`,short:`PBE`,aliases:[`Parebrise Express`,`Pare-Brise Express`,`PBE`],c1:`#FFC20E`,c2:`#231F20`},{name:`Marjane Market`,short:`MJM`,aliases:[`MARJANE MARKET`,`Marjane`],c1:`#CF5014`,c2:`#2A1003`},{name:`Attijariwafa bank`,short:`ATW`,aliases:[`ATTIJARIWAFA BANK`,`Attijariwafa`],c1:`#F39200`,c2:`#2A1503`},{name:`Canpack 1`,short:`CP1`,aliases:[`CANPACK 1`],c1:`#032A5A`,c2:`#01112A`},{name:`Canpack 2`,short:`CP2`,aliases:[`CANPACK 2`],c1:`#1E4F8F`,c2:`#01112A`},{name:`Distra`,short:`DST`,aliases:[`DISTRA`],c1:`#8CC63F`,c2:`#13240A`},{name:`Michoc`,short:`MIC`,aliases:[`MICHOC`],c1:`#E30613`,c2:`#2A0406`},{name:`BMCI`,short:`BMC`,aliases:[`BMCI`],c1:`#00915A`,c2:`#05241A`},{name:`CTR`,short:`CTR`,aliases:[`CTR`,`Construction & Travaux Routiers`,`Construction et Travaux Routiers`],c1:`#2E44B0`,c2:`#0A1236`},{name:`Mega Post Tension`,short:`MPT`,aliases:[`MEGA PT`,`Mega PT`,`Mega Post-Tension`,`Mega Post Tension`],c1:`#1E90FF`,c2:`#0A1E33`},{name:`L'Heure Joyeuse`,short:`LHJ`,aliases:[`HEURE JOYEUSE`,`L'Heure Joyeuse`],c1:`#E2007A`,c2:`#2A0418`},{name:`CAC`,short:`CAC`,aliases:[`CAC`,`Centrale Automobile Chérifienne`],c1:`#285370`,c2:`#0A1724`}],li=e=>(e??``).normalize(`NFD`).replace(/[̀-ͯ]/g,``).toLowerCase().replace(/[^a-z0-9]+/g,``),ui=e=>({logo_url:`/logos/${e.short.toLowerCase()}.png`,company_logo_url:`/logos/${e.short.toLowerCase()}-full.png`});function di(e,t=ci){let n=new Set(e.map(li).filter(Boolean));return t.find(e=>[e.name,...e.aliases].some(e=>n.has(li(e))))??t.find(e=>n.has(li(e.short))&&[...n].some(e=>e.length<=4))}var fi=e=>!e||e.startsWith(`data:image/svg`)||e.startsWith(`/logos/`);function pi(e,t,n=ci){let r=e.Team.filter(n=>Kr(n,e.Competition)===t),i=[],a=[],o=[],s=new Set;for(let c of r){let r=di([c.name,c.company,c.short_name],n);if(r&&!s.has(r.short)){s.add(r.short);let e=fi(c.logo_url)&&c.logo_url!==ui(r).logo_url;i.push({team:c,official:r,rename:c.name===r.name?void 0:c.name,logo:e})}else if(r)o.push({team:c,official:r});else{let n=e.Match.filter(e=>e.season_id===t&&(e.home_team_id===c.id||e.away_team_id===c.id)),r=e.Player.filter(e=>e.team_id===c.id),i=G(c);a.push({team:c,players:r,matches:n,keepClub:e.Team.some(e=>e.id!==c.id&&G(e)===i)})}}for(let n of o){let r=e.Match.filter(e=>e.season_id===t&&(e.home_team_id===n.team.id||e.away_team_id===n.team.id));a.push({team:n.team,players:e.Player.filter(e=>e.team_id===n.team.id),matches:r,keepClub:e.Team.some(e=>e.id!==n.team.id&&G(e)===G(n.team))})}return{seasonId:t,kept:i,created:n.filter(e=>!s.has(e.short)),removed:a,duplicates:o}}var mi=e=>!e.created.length&&!e.removed.length&&!e.kept.some(e=>e.rename||e.logo);function hi(e,t,n={}){let r=n.idFor??(e=>`t${t.seasonId.replace(/\D/g,``).slice(2,4)||`26`}_${e.short.toLowerCase()}`),i=new Set(t.removed.map(e=>e.team.id)),a=new Set(t.removed.flatMap(e=>e.matches.map(e=>e.id))),o=new Map(t.kept.map(e=>[e.team.id,e])),s=e.Team.filter(e=>!i.has(e.id)).map(e=>{let n=o.get(e.id);return n?{...e,name:n.official.name,...n.logo?ui(n.official):{},season_id:e.season_id??t.seasonId}:e}),c=e.Club.filter(e=>!t.removed.some(t=>!t.keepClub&&G(t.team)===e.id)),l=new Set(e.Team.map(e=>e.id));for(let e of t.created){let n=r(e),i=2;for(;l.has(n);)n=`${r(e)}_${i++}`;l.add(n),s.push({id:n,name:e.name,short_name:e.short,company:e.name,...ui(e),primary_color:e.c1,secondary_color:e.c2,status:`active`,season_id:t.seasonId,club_id:`club_${n}`}),c.some(e=>e.id===`club_${n}`)||c.push({id:`club_${n}`,name:e.name,logo_url:ui(e).logo_url})}let u=s.filter(t=>!e.Team.some(e=>e.id===t.id)).map(e=>e.id),d=new Set([...t.kept.map(e=>e.team.id),...u]),f=e.Competition.map(e=>{if(e.season_id!==t.seasonId)return e;let n=(e.team_ids??[]).filter(e=>!i.has(e));return e.phase===`league_phase`?{...e,team_ids:[...new Set([...n,...d])].sort()}:{...e,team_ids:n}}),p=new Set(t.removed.flatMap(e=>e.players.map(e=>e.id)));return{Team:s,Club:c,Competition:f,Player:e.Player.filter(e=>!p.has(e.id)),Match:e.Match.filter(e=>!a.has(e.id)),MatchEvent:e.MatchEvent.filter(e=>!a.has(e.match_id)),Lineup:e.Lineup.filter(e=>!a.has(e.match_id)),MatchTeamStats:e.MatchTeamStats.filter(e=>!a.has(e.match_id))}}function gi(e){return{gardees:e.kept.filter(e=>!e.rename).map(e=>e.official.name),renommees:e.kept.filter(e=>e.rename).map(e=>`${e.rename} → ${e.official.name}`),creees:e.created.map(e=>e.name),retirees:e.removed.map(e=>`${e.team.name} (${e.players.length} joueur(s), ${e.matches.length} match(s)${e.keepClub?`, club et historique conservés`:``})`)}}var _i=`season_2026`,vi=e=>`t26_${e.toLowerCase()}`;function yi(){let e={id:_i,name:`Saison 2026-2027`,start_date:`2026-08-22`,status:`active`,is_active:!0,league_phase_rounds:0,cup_rounds:10,gold_size:12,rulebook_version:`v4`},t=[];for(let e of ci)t.push({id:vi(e.short),name:e.name,short_name:e.short,company:e.name,...ui(e),primary_color:e.c1,secondary_color:e.c2,status:`active`});return{season:e,teams:t,competitions:[{id:`comp_2026_selection`,season_id:e.id,name:`Phase de sélection`,phase:`league_phase`,format:`swiss`,status:`draft`,team_ids:t.map(e=>e.id).sort(),half_duration_min:r.duration.halfMin,foul_alert_threshold:5,color:`#F85A00`,order:1,description:`Un seul groupe · matchs tirés au sort`}]}}var bi=`# PRÉAMBULE

Le présent règlement régit l'ensemble des matchs et compétitions organisés par Ardentia sur ses terrains de football en gazon synthétique à 6 joueurs. Son objectif est d'assurer la sécurité des participants, la fluidité du jeu et le respect du fair-play. Tout participant — joueur, remplaçant, officiel d'équipe ou spectateur — est réputé avoir pris connaissance de ce règlement et s'engage à le respecter.

En cas de situation non prévue par le présent règlement, l'arbitre tranche en accord avec les principes généraux du football à 6 et, si nécessaire, en concertation avec le comité organisateur Ardentia. Sa décision est définitive.

# ARTICLE 1 — LE TERRAIN ET LE MATÉRIEL

## 1.1 Le terrain

Les matchs se déroulent sur les terrains en gazon synthétique mis à disposition par le partenaire d'Ardentia. Les terrains abritent des matchs de 6 joueurs contre 6 joueurs.

## 1.2 Le ballon

Le ballon officiel utilisé lors de tous les matchs est de taille 5. Il est fourni par Ardentia. En cas de dommage au ballon en cours de jeu, l'arbitre arrête le jeu, fait remplacer le ballon et reprend avec une balle à terre à l'endroit où le ballon a été endommagé.

## 1.3 La zone de remplacement

Les remplaçants et le staff technique doivent se tenir dans la zone qui leur est réservée, à l'intérieur de l'enceinte du terrain. Cette zone est délimitée par des plots visibles. Il est interdit aux remplaçants et au staff technique de sortir de cette zone sans l'autorisation de l'arbitre.

Les remplacements s'effectuent exclusivement par la porte du terrain. Tout joueur sortant du terrain est tenu de fermer la porte derrière lui afin d'éviter tout risque de blessure. Le non-respect de cette consigne constitue une faute de sécurité pouvant être sanctionnée par un avertissement verbal.

# ARTICLE 2 — LES JOUEURS

## 2.1 Composition des équipes

Un match se joue entre deux équipes, chacune composée d'un maximum de six (6) joueurs sur le terrain, dont obligatoirement un gardien de but.

Chaque équipe peut disposer d'un maximum de six (6) remplaçants.

## 2.2 Nombre minimum de joueurs

Le nombre minimum de joueurs requis pour débuter et poursuivre un match est de quatre (4) joueurs par équipe, gardien de but compris.

-   Si, avant le coup d'envoi, une équipe ne dispose pas d'au moins quatre (4) joueurs après l'expiration du délai de carence (voir Article 14.1), le match est déclaré perdu par forfait pour cette équipe.

-   Si, en cours de match, une équipe tombe en dessous de quatre (4) joueurs suite à des expulsions ou blessures ne pouvant être remplacées, le match est définitivement arrêté. L'équipe concernée est déclarée perdante par forfait sur le score de 3-0, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 2.3 Inscription et liste des joueurs

Les noms complets des joueurs et remplaçants, tels qu'ils figurent sur leur carte d'identité nationale (CIN), doivent être communiqués à Ardentia lors de la période des inscriptions, avant le début de la compétition. Ces listes servent à garantir la couverture d'assurance et à assurer le fair-play.

Tout joueur dont le nom n'est pas mentionné sur la liste de l'équipe est strictement interdit de participation. Si un joueur non inscrit est découvert en cours de match, l'arbitre l'expulse immédiatement. Tout but marqué par ce joueur non inscrit est refusé rétroactivement, et le joueurs est expulsé du terrain.

Un joueur peut être ajouté ou retiré de la liste de l'équipe sur demande écrite (email) du capitaine auprès d'Ardentia, au moins 48 heures avant le prochain match, afin de permettre la mise à jour de la couverture d'assurance. Sans le respect de ce ce délai, le joueurs ne peut faire partie du match.

## 2.4 Procédure de remplacement

Un nombre illimité de remplacements peut être effectué au cours d'un match. Un remplacement ne peut avoir lieu que lorsque le ballon n'est pas en jeu. Les règles suivantes s'appliquent :

-   Le joueur remplacé quitte le pelouse vers la zone des remplaçants.

-   Le joueur remplacé avise l'arbitre avant de quitter le pelouse.

-   Les remplaçants portent obligatoirement des dossards d'une couleur distincte de celle des joueurs présents sur le terrain.

-   Avant d'entrer sur la pelouse, le remplaçant remet son dossard au joueur remplacé. Le remplaçant ne peut pas entrer sur la pelouse tant que cet échange de dossard n'a pas eu lieu.

-   Le remplaçant n'entre sur la pelouse qu'après le départ complet du joueur remplacé.

-   À partir du moment où le remplaçant entre sur le terrain, il devient joueur et le joueur remplacé devient remplaçant.

-   L'autorisation de procéder à un remplacement peut être refusée par l'arbitre si l'équipement du remplaçant n'est pas conforme.

-   Tous les joueurs, remplaçants et staff technique sont soumis à l'autorité de l'arbitre.

Si un joueur de champ effectue un remplacement sans aviser l'arbitre, il reçoit un avertissement verbal. En cas de récidive, l'arbitre lui adresse un carton jaune, voire rouge selon la gravité.

Si un remplaçant entre sur la pelouse avant le départ complet du joueur remplacé :

-   L'arbitre arrête le jeu (sauf application de la règle de l'avantage).

-   Le remplaçant est averti et invité à quitter immédiatement la pelouse.

-   Le jeu reprend par un coup franc indirect accordé à l'équipe adverse, à l'endroit où se trouvait le remplaçant irrégulier.

## 2.5 Sanctions impliquant les remplaçants et officiels d'équipe

Si un remplaçant ou un officiel du staff technique reçoit un carton rouge, son équipe doit retirer un joueur de champ pendant deux (2) minutes, sauf si un but est marqué par l'équipe adverse avant la fin de cette période, auquel cas un remplaçant peut entrer pour rétablir la parité numérique. Le remplaçant ou officiel expulsé ne peut plus participer au match sous quelque forme que ce soit.

Si un remplaçant reçoit un carton jaune alors qu'il est sur le banc, il portera cette sanction lorsqu'il entrera sur le terrain.

## 2.6 Changement de gardien de but

-   Tout joueur ou remplaçant peut prendre le rôle de gardien de but, à condition d'en informer l'arbitre lors d'un arrêt de jeu et de revêtir un dossard de couleur distincte.

-   Le changement doit obligatoirement se faire lors d'un arrêt du jeu et avec l'autorisation expresse de l'arbitre.

-   Si un joueur assume le rôle de gardien sans en informer l'arbitre et touche le ballon de la main dans sa surface, son équipe est sanctionnée d'un penalty.

-   Aucun changement de gardien n'est autorisé après le sifflement d'un penalty, sauf en cas de blessure grave constatée et validée par l'arbitre et Ardentia.

-   Lors des phases éliminatoires, si un match est décidé aux tirs au but, le gardien en place au moment du coup de sifflet final ne peut pas être changé, sauf blessure grave.

## 2.7 Joueurs et remplaçants expulsés

Un joueur expulsé (carton rouge) doit quitter immédiatement le terrain. Il ne peut plus participer au match.

Son équipe joue en infériorité numérique pendant deux (2) minutes de temps de jeu effectif. Un remplaçant peut entrer pour combler cette infériorité selon les conditions suivantes :

-   6 joueurs contre 5, ou 5 contre 4 : si l'équipe la plus nombreuse marque un but, l'équipe réduite peut faire entrer un remplaçant.

-   Si les deux équipes jouent à effectifs réduits égaux (ex : 5 contre 5, 4 contre 4) et qu'un but est marqué, aucune équipe ne récupère un joueur avant la fin de la réduction numérique respective de deux minutes.

-   6 joueurs contre 4 : si l'équipe à 6 marque, l'équipe à 4 ne peut faire entrer qu'un seul remplaçant (portant à 5 son effectif).

-   Si l'équipe en infériorité marque un but, le jeu continue sans modification du nombre de joueurs jusqu'à l'écoulement des deux minutes.

**Tout joueur expulsé par l'arbitre doit quitter immédiatement le terrain. En cas de refus de sortie, l'arbitre accorde un délai maximal de 5 minutes pour que le ou les joueurs concernés quittent le terrain. À défaut d'exécution dans ce délai, la rencontre est arrêtée et l'équipe du ou des joueurs expulsés est déclarée perdante par forfait.**

## 2.8 But marqué avec une personne supplémentaire sur le terrain

Si, après qu'un but est marqué et que le jeu a repris, l'arbitre constate qu'une personne supplémentaire se trouvait sur le terrain au moment du but, le but ne peut pas être refusé rétroactivement.

Si l'arbitre constate la présence d'une personne supplémentaire avant la reprise du jeu :

-   Le but est refusé si la personne supplémentaire appartenait à l'équipe ayant marqué (joueur, remplaçant, expulsé ou officiel). Le jeu reprend par un coup franc direct pour l'équipe adverse à l'endroit où se trouvait cette personne.

-   Le but est refusé si la personne supplémentaire était un agent extérieur ayant gêné le jeu. Le jeu reprend par une balle à terre.

Dans tous les cas, l'arbitre fait sortir la personne supplémentaire de la pelouse.

## 2.9 Capitaine d'équipe

Chaque équipe désigne un capitaine avant le début du match. Le capitaine est identifiable par un brassard. Il est le seul joueur autorisé à s'adresser à l'arbitre pour demander des éclaircissements sur une décision, et ce, de manière respectueuse et calme. Toute autre forme d'interpellation de l'arbitre par d'autres joueurs est passible d'avertissement.

Le capitaine est responsable du comportement de son équipe et de ses supporters. En cas d'incidents répétés, l'arbitre peut tenir le capitaine pour responsable disciplinairement.

# ARTICLE 3 — L'ÉQUIPEMENT DES JOUEURS

## 3.1 Sécurité

Aucun joueur ne peut utiliser ou porter un équipement ou objet dangereux pour lui-même ou pour autrui. Sont notamment interdits :

-   Tous bijoux : colliers, bagues, bracelets, boucles d'oreilles, élastiques métalliques. L'usage de ruban adhésif pour couvrir les bijoux n'est pas autorisé.

-   Chaussures à crampons métalliques ou tout autre équipement susceptible d'endommager le gazon synthétique ou de blesser un adversaire.

Si un joueur porte un équipement non autorisé, l'arbitre lui ordonne de le retirer. Si le joueur ne peut ou ne veut pas s'y conformer, il quitte le terrain au prochain arrêt. Un refus de se conformer, ou le port répété d'un article interdit, est sanctionné par un carton jaune.

## 3.2 Couleurs et tenues

Les deux équipes doivent porter des couleurs qui les distinguent l'une de l'autre ainsi que des officiels de match. Si les deux équipes portent des couleurs similaires, l'arbitre procède à un tirage au sort en présence des deux capitaines pour désigner l'équipe devant revêtir des dossards distinctifs fournis par Ardentia.

Le gardien de but doit obligatoirement porter un dossard d'une couleur distincte de celle de ses coéquipiers et de celle de l'équipe adverse.

## 3.3 Équipements de protection autorisés

Les équipements de protection non dangereux sont autorisés : masques de protection, lunettes de sport homologuées, genouillères et coudières en matériau rembourré souple. Ces équipements doivent être présentés à l'arbitre avant le match pour validation.

# ARTICLE 4 — L'ARBITRE

## 4.1 Autorité de l'arbitre

Chaque match est dirigé par un arbitre désigné par Ardentia. L'arbitre a pleine autorité pour faire respecter le présent règlement durant toute la durée du match, depuis son entrée sur le terrain jusqu'à sa sortie après le coup de sifflet final (y compris pendant les tirs au but).

## 4.2 Décisions de l'arbitre

Les décisions de l'arbitre sur les faits de jeu — y compris l'attribution d'un but et le résultat du match — sont définitives et sans appel immédiat. Elles prévalent sur celles des organisateurs présents sur place.

Si un assistant de match signale une infraction mais que l'arbitre ne l'observe qu'après la reprise du jeu, l'arbitre peut prendre les mesures disciplinaires appropriées, mais la sanction de reprise de jeu liée à la faute ne s'applique pas.

Toute protestation excessive contre une décision arbitrale — y compris de la part du capitaine — peut entraîner un avertissement verbal ou un carton jaune, selon l'appréciation de l'arbitre.

## 4.3 Pouvoirs et devoirs de l'arbitre

L'arbitre est investi des missions suivantes :

-   Appliquer le présent règlement Ardentia.

-   Vérifier l'équipement des joueurs avant le coup d'envoi.

-   Tenir un registre des incidents du match (cartons, buts, expulsions).

-   Agir comme chronométreur officiel du match.

-   Arrêter, suspendre ou abandonner le match en cas de problème (interférence extérieure, projecteurs défaillants, animal sur le terrain, conditions météorologiques dangereuses). En cas d'interférence extérieure affectant le jeu, le jeu reprend par une balle à terre, sauf si le ballon pénètre dans le but sans intervention de l'agent extérieur, auquel cas le but est accordé.

-   Arrêter le jeu en cas de blessure grave et veiller à ce que le joueur blessé soit retiré du terrain. Un joueur blessé ne peut pas être soigné sur le terrain sauf dans les cas suivants : collision entre gardien et joueur de champ, collision entre deux joueurs de la même équipe, blessure grave, penalty accordé au joueur blessé (qu'il soit tireur ou gardien).

-   Décider, avec l'aide des organisateurs, des incidents dont il n'a pas été directement témoin.

-   Garantir qu'aucune personne non autorisée ne pénètre sur le terrain.

-   Demander au capitaine de l'une ou l'autre équipe de calmer ses spectateurs lorsque leur comportement perturbe le bon déroulement du match. Si nécessaire, l'arbitre arrête le jeu jusqu'au retour au calme.

-   En cas de défaillance du chronomètre, aviser immédiatement Ardentia pour en obtenir un de remplacement.

## 4.4 Équipement obligatoire de l'arbitre

-   Au moins un sifflet.

-   Cartons rouges et jaunes.

-   Un carnet (ou tout autre support) pour la tenue du registre du match.

-   Au moins une montre ou chronomètre.

# ARTICLE 5 — LA DURÉE DU MATCH

## 5.1 Périodes de jeu

Un match se compose de deux (2) périodes de vingt (20) minutes chacune de temps de jeu effectif. Le chronomètre est arrêté à chaque interruption de jeu (blessures, remplacements, litiges, etc.) et repris à la reprise du jeu.

## 5.2 Temps morts et arrêts de jeu

L'arbitre est responsable du décompte de tous les temps morts et s'assure qu'ils sont ajoutés au temps officiel du match. La durée totale cumulée des arrêts de jeu ne peut excéder dix (10) minutes par match. Au-delà de ce seuil, l'arbitre peut, à sa discrétion et après concertation avec Ardentia, suspendre ou arrêter le match.

## 5.3 Intervalle à la mi-temps

Les joueurs ont droit à une pause à la mi-temps ne dépassant pas cinq (5) minutes. À l'issue de la pause, les équipes changent de côté de terrain. Les officiels d'équipe et remplaçants changent également de banc.

## 5.4 Fin des périodes

L'arbitre siffle la fin de chaque période de vingt minutes. Il peut prolonger une période pour permettre l'exécution d'un coup franc, d'un penalty ou d'un corner accordé juste avant le coup de sifflet final.

## 5.5 Prolongation

Il n'y a pas de prolongation dans le cadre de ce règlement. En phases éliminatoires, en cas d'égalité à l'issue du temps réglementaire, les équipes passent directement aux tirs au but (voir Article 13).

# ARTICLE 6 — LE COUP D'ENVOI ET LA REPRISE DU JEU

## 6.1 Coup d'envoi

Avant le début du match, l'arbitre effectue un tirage au sort (pièce de monnaie) en présence des deux capitaines. L'équipe gagnante choisit le sens d'attaque pour la première période ; l'équipe perdante effectue le coup d'envoi. À la mi-temps, les rôles s'inversent.

Le coup d'envoi est effectué depuis le centre du terrain au coup de sifflet de l'arbitre. Le ballon doit être stationnaire au centre. Les joueurs de l'équipe adverse doivent se trouver dans leur propre moitié de terrain. Le ballon est en jeu dès qu'il est touché. Un but peut être marqué directement sur un coup d'envoi.

## 6.2 Reprise après un but

Après qu'un but est accordé, le jeu reprend par un coup d'envoi effectué par l'équipe qui a encaissé le but, depuis le centre du terrain.

## 6.3 Balle à terre

Une balle à terre est accordée lorsque l'arbitre a arrêté le jeu sans qu'aucune infraction n'ait été commise (blessure, objet sur le terrain, etc.). La procédure est la suivante :

-   L'arbitre lâche le ballon à l'endroit où il se trouvait au moment de l'arrêt (ou à l'endroit le plus proche en jeu).

-   Le ballon est en jeu dès qu'il touche le sol.

-   Les joueurs adverses doivent se tenir à au moins un (1) mètre du ballon jusqu'à ce qu'il soit en jeu.

-   Si la balle à terre doit être donnée dans la surface de réparation, elle est donnée sur la ligne de surface de réparation la plus proche du point d'arrêt.

# ARTICLE 7 — LE HORS-JEU

La règle du hors-jeu ne s'applique pas dans ce format de jeu. Aucun joueur ne peut être sanctionné pour hors-jeu, quelle que soit sa position sur le terrain.

# ARTICLE 8 — LES REMISES EN JEU (TOUCHES)

## 8.1 Accord d'une remise en jeu

Une remise en jeu est accordée lorsque le ballon franchit entièrement la ligne de touche (latérale) — que ce soit au sol ou en l'air — au dernier contact d'un joueur de l'équipe adverse.

## 8.2 Procédure

La remise en jeu se fait au pied (coup de pied de touche). Les règles suivantes s'appliquent :

-   Le ballon doit être posé, immobile, sur la ligne de touche, à l'endroit exact où il est sorti.

-   Le joueur effectuant la remise dispose de cinq (5) secondes pour jouer le ballon, à partir du moment où celui-ci est posé sur la ligne.

-   Les adversaires doivent se tenir à au moins cinq (5) mètres du point de remise en jeu.

-   Le joueur effectuant la remise ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

-   Un but ne peut pas être marqué directement depuis une remise en jeu en touche.

Si le joueur dépasse le délai de cinq (5) secondes, ou s'il ne pose pas le ballon sur la ligne de touche, la remise en jeu est accordée à l'équipe adverse.

## 8.3 Ballon sorti en fond de terrain

Si le ballon sort entièrement par la ligne de fond (ligne de but) sans qu'un but ne soit marqué, les règles suivantes s'appliquent selon le dernier contact :

-   Dernier contact d'un défenseur : corner accordé à l'équipe attaquante (voir Article 9).

-   Dernier contact d'un attaquant : coup de pied de but accordé à l'équipe défendante (voir Article 10).

# ARTICLE 9 — LES CORNERS

## 9.1 Accord d'un corner

Un corner est accordé à l'équipe attaquante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe défendante.

## 9.2 Procédure

-   Le ballon est posé, immobile, dans l'arc de corner le plus proche du point de sortie.

-   Le tireur dispose de huit (8) secondes pour frapper le ballon, à partir du moment où celui-ci est posé dans l'arc de corner.

-   Les joueurs adverses doivent se tenir à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Le ballon est en jeu dès qu'il est frappé.

-   Un but peut être marqué directement depuis un corner.

-   Le tireur ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

## 9.3 Infractions

Si le tireur dépasse le délai de huit (8) secondes ou ne respecte pas la procédure, le jeu reprend par un coup de pied de but en faveur de l'équipe adverse. Si un adversaire pénètre dans la zone des cinq mètres avant la frappe, le corner est retiré.

# ARTICLE 10 — LES COUPS DE PIED DE BUT

## 10.1 Accord d'un coup de pied de but

Un coup de pied de but est accordé à l'équipe défendante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe attaquante.

## 10.2 Procédure

-   Le gardien de but (ou tout joueur défenseur désigné) effectue le coup de pied de but depuis n'importe quel point à l'intérieur de la surface de réparation.

-   Le ballon est en jeu dès qu'il sort de la surface de réparation.

-   Les joueurs adverses doivent se trouver hors de la surface de réparation jusqu'à ce que le ballon soit en jeu.

-   Le gardien dispose de quatre (4) secondes pour mettre le ballon en jeu après l'avoir récupéré.

-   Un but peut être marqué directement depuis un coup de pied de but.

-   Le joueur effectuant le coup de pied ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

# ARTICLE 11 — FAUTES ET INCONDUITES

## 11.1 Coup franc direct

Toute infraction impliquant un contact avec un adversaire est sanctionnée par un coup franc direct ou, si elle est commise par un joueur dans sa propre surface de réparation, par un penalty (voir Article 11.4).

Un coup franc direct est accordé à l'équipe adverse lorsqu'un joueur commet l'une des infractions suivantes de manière jugée insouciante, imprudente ou avec usage excessif de la force :

-   Tacler ou défier un adversaire de manière dangereuse.

-   Sauter sur un adversaire.

-   Charger un adversaire.

-   Frapper ou tenter de frapper un adversaire.

-   Pousser un adversaire.

-   Mordre ou cracher sur quelqu'un.

-   Tenir un adversaire.

-   Faire trébucher ou tenter de faire trébucher un adversaire.

-   Toucher intentionnellement le ballon avec la main ou le bras (sauf le gardien dans sa surface).

L'évaluation de la faute suit les degrés suivants :

-   **Insouciance :** le joueur fait preuve d'un manque d'attention ou de considération en disputant le ballon, ou agit sans précaution. Coup franc direct, sans sanction disciplinaire.

-   **Imprudence :** le joueur agit sans tenir compte du danger ou des conséquences de son geste pour l'adversaire. Coup franc direct et carton jaune obligatoire.

-   **Usage excessif de la force :** le joueur dépasse la force nécessaire et/ou met en danger la sécurité d'un adversaire. Coup franc direct et carton rouge obligatoire (expulsion).

## 11.2 Coup franc indirect

Un coup franc indirect sanctionne une infraction commise sans contact avec un adversaire. Il est accordé à l'équipe adverse si un joueur :

-   Joue de manière dangereuse sans contact (ex. : tenter une tête alors qu'un adversaire s'apprête à botter le ballon à hauteur de la tête).

-   Fait obstruction à la progression d'un adversaire sans contact.

-   Empêche le gardien de lâcher le ballon.

-   Est coupable de dissidence, langage ou gestes offensants, insultants ou abusifs.

Un coup franc indirect est également accordé à l'équipe adverse si le gardien :

-   Touche le ballon avec les mains ou les bras à l'intérieur de sa surface de réparation après qu'il a été délibérément botté par un coéquipier (règle de la passe en retour).

-   Reçoit directement dans les mains une rentrée de touche effectuée au pied par un coéquipier.

Le gardien est considéré comme en contrôle du ballon lorsque : il le tient dans ses mains, le fait rebondir sur le sol ou le projette en l'air.

Sur un coup franc indirect, un but ne peut être accordé que si le ballon a touché un autre joueur avant de pénétrer dans le but.

## 11.3 Le mur et la distance réglementaire

Les règles suivantes s'appliquent à tout coup franc, direct ou indirect :

-   Lors d'un coup franc adverse, les joueurs formant le mur doivent se placer à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Lorsque le coup franc est sifflé dans la propre moitié de terrain de l'équipe qui en bénéficie, aucun mur n'est autorisé : les adversaires doivent simplement se tenir à cinq (5) mètres du ballon.

-   Tout joueur qui ne respecte pas la distance réglementaire est passible d'un carton jaune (voir Article 11.5).

## 11.4 Le penalty

Un penalty est accordé lorsqu'un joueur commet, dans sa propre surface de réparation, l'une des infractions passibles d'un coup franc direct, que le ballon soit en jeu ou non.

Procédure d'exécution d'un penalty :

-   Le ballon est placé sur le point de penalty tracé sur le terrain.

-   Le gardien adverse se place sur sa ligne de but, entre les poteaux, et ne peut pas avancer avant que le ballon soit frappé.

-   Tous les autres joueurs (des deux équipes) se placent en dehors de la surface de réparation et derrière le ballon (ou sur la ligne de but adjacente) jusqu'à ce que le ballon soit frappé.

-   Le tireur désigné frappe le ballon vers l'avant en un seul mouvement. Tout arrêt complet du mouvement lors de l'élan est sanctionné par un coup franc indirect en faveur de l'équipe défendante.

-   Si le gardien avance prématurément et que le tir est manqué ou repoussé, le penalty est retiré. Si le tir est transformé, le but est accordé.

-   Si le ballon rebondit sur les poteaux ou la barre et revient en jeu, tout joueur peut jouer le ballon, y compris le tireur.

-   Si le temps réglementaire expire avant l'exécution du penalty, celui-ci est tout de même tiré et le match se termine à l'issue de son exécution.

## 11.5 Cartons jaunes — Avertissements

Un carton jaune est délivré à un joueur, remplaçant ou officiel d'équipe pour l'une des raisons suivantes :

-   Comportement antisportif (simulation, protestation excessive, jeu déloyal).

-   Dissidence par les mots ou les gestes envers l'arbitre.

-   Infractions répétées aux règles du jeu.

-   Retarder la reprise du jeu.

-   Ne pas respecter la distance requise lors d'un coup franc, corner ou remise en jeu.

-   Entrer ou quitter le terrain sans autorisation.

-   Imprudence dans un tacle ou une charge.

Deux (2) cartons jaunes dans le même match entraînent automatiquement un carton rouge (expulsion).

Les cartons ne sont pas cumulables d'un match à un autre.

## 11.6 Cartons rouges — Expulsions

Un carton rouge est délivré pour l'une des raisons suivantes, entraînant l'expulsion immédiate du joueur :

-   Faute grossière (tacle ou charge mettant en danger l'intégrité physique d'un adversaire).

-   Comportement violent (coup, tentative de coup, morsure, crachat).

-   Déni d'une occasion de but manifeste par une faute de main volontaire (hors gardien dans sa surface).

-   Déni d'une occasion de but manifeste par une faute physique.

-   Langage ou gestes offensants, insultants ou abusifs envers quiconque.

-   Deux cartons jaunes dans le même match.

Un joueur expulsé quitte le terrain immédiatement. Son équipe joue en infériorité numérique pendant deux (2) minutes (voir Article 2.7). Le joueur expulsé ne peut plus participer au match.

## 11.7 Erreur d'identification lors d'un carton

Si l'arbitre se rend compte, avant la reprise du jeu, qu'il a attribué un carton au mauvais joueur, il annule la sanction envers ce joueur et l'attribue au joueur fautif. Toute réclamation pour erreur d'identification doit être soulevée immédiatement et avant la reprise du jeu.

# ARTICLE 12 — LES BUTS

## 12.1 But valide

Un but est accordé lorsque la totalité du ballon franchit entièrement la ligne de but, entre les poteaux et sous la barre transversale, à condition qu'aucune infraction n'ait été commise par l'équipe marquant le but. Un but est accordé si le gardien lance le ballon directement dans le but adverse.

## 12.2 But refusé

Un but est refusé dans les cas suivants :

-   Une infraction a été commise par l'équipe attaquante avant ou pendant l'action menant au but.

-   Une personne supplémentaire appartenant à l'équipe attaquante se trouvait sur le terrain (voir Article 2.8).

-   Le ballon a été touché par un agent extérieur appartenant à l'équipe attaquante avant d'entrer dans le but.

# ARTICLE 13 — LES TIRS AU BUT

## 13.1 Quand sont-ils organisés ?

Les tirs au but sont organisés exclusivement lors des phases éliminatoires en cas d'égalité à l'issue du temps réglementaire. Ils ne font pas partie du match et les statistiques de la série de tirs au but ne sont pas comptabilisées dans les buts du match.

## 13.2 Désignation du but et ordre de tir

-   L'arbitre effectue un tirage au sort en présence des deux capitaines pour désigner le but dans lequel les tirs seront effectués.

-   Un second tirage au sort détermine l'équipe qui tire en premier.

-   Chaque équipe désigne cinq (5) tireurs parmi les joueurs qui se trouvaient sur le terrain au coup de sifflet final. Un joueur expulsé ne peut pas participer aux tirs au but.

-   L'ordre de passage des tireurs est librement choisi par chaque équipe.

## 13.3 Procédure de chaque tir

-   Les joueurs qui ne tirent pas se regroupent au centre du terrain, à au moins dix (10) mètres des tireurs.

-   Seul le tireur désigné et les deux gardiens sont autorisés dans la moitié de terrain des buts.

-   Le gardien doit rester sur sa ligne de but jusqu'à ce que le ballon soit frappé.

-   Les mêmes règles que pour un penalty en cours de match s'appliquent (voir Article 11.4).

## 13.4 Issue de la série initiale

L'équipe qui marque le plus de tirs sur les cinq tentatives de chaque côté est déclarée vainqueur. Si les deux équipes sont toujours à égalité après la série de cinq tirs chacune, la séance se poursuit en mort subite : les mêmes cinq joueurs tirent à nouveau, dans le même ordre ou un ordre différent choisi par l'équipe, jusqu'à ce qu'une équipe marque et que l'autre manque sur le même numéro de tir.

# ARTICLE 14 — FORFAIT ET MATCHS NON JOUÉS

## 14.1 Non-présentation et délai de carence

Si une équipe ne se présente pas ou ne réunit pas le nombre minimum de joueurs (4) dans un délai de quinze (15) minutes après l'heure officielle de début du match, le match lui est attribué par forfait. Le score officiel est fixé à 3-0 en faveur de l'équipe présente.

En cas de force majeure dûment justifiée et communiquée à Ardentia avant le début du délai de carence, Ardentia se réserve le droit d'examiner la situation, étant entendu que les reports de matchs ne sont pas acceptés en règle générale (voir Article 17.5).

## 14.2 Équipe avec un effectif en dessous du minimum en cours de match

Si, en cours de match, une équipe se retrouve avec moins de quatre (4) joueurs suite à des expulsions ou blessures sans remplaçants disponibles, le match est arrêté. L'équipe concernée est déclarée perdante par forfait. Le score retenu est 3-0 en sa défaveur, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 14.3 Forfait général (retrait d'une équipe de la compétition)

Une équipe qui déclare forfait pour le reste de la compétition est retirée de celle-ci. Cette règle s'applique au championnat et à la phase de groupes du tournoi. Tous les matchs déjà disputés par l'équipe forfait sont annulés, et ses matchs restants ne sont pas joués. Les conséquences sont les suivantes :

-   **Points :** chaque équipe qui avait battu l'équipe forfait perd les trois (3) points de cette victoire. Chaque équipe qui avait fait match nul contre elle perd un (1) point. Les équipes qui avaient perdu contre elle ne perdent aucun point.

-   **Buteurs :** les buts marqués par des joueurs contre l'équipe forfait sont retirés de leur total personnel et du classement des buteurs.

-   **Buts marqués contre l'équipe forfait :** ils sont retirés du total de buts marqués de chaque équipe adverse concernée.

-   **Buts marqués par l'équipe forfait :** ils sont retirés du total de buts encaissés de chaque équipe adverse concernée.

-   **Cartons :** les cartons jaunes et rouges reçus lors des matchs annulés ne sont plus comptés pour le départage des équipes (Article 17.3, critères 5 et 6). En revanche, les sanctions disciplinaires individuelles qui en découlent (suspensions, expulsions) restent applicables aux joueurs concernés.

La différence de buts, le classement général des équipes et le classement des buteurs sont recalculés en conséquence par Ardentia.

**Forfait en phase à élimination directe :** si une équipe déclare forfait ou abandonne la compétition pendant la phase à élimination directe du tournoi, son adversaire est qualifié d'office pour le tour suivant, sur le score de 3-0. Les résultats de la phase de groupes ne sont pas modifiés.

# ARTICLE 15 — RÈGLES SPÉCIFIQUES AU GARDIEN DE BUT

## 15.1 Dans sa surface de réparation

Le gardien peut utiliser ses mains et ses bras pour jouer le ballon exclusivement à l'intérieur de sa propre surface de réparation. En dehors de sa surface, il est soumis aux mêmes règles que n'importe quel joueur de champ et ne peut en aucun cas utiliser ses mains ou ses bras pour jouer le ballon.

## 15.2 Hors de sa surface de réparation

Le gardien peut se déplacer librement en dehors de sa surface et jouer le ballon au pied comme tout joueur de champ. Toute utilisation des mains hors de la surface est sanctionnée par un coup franc direct accordé à l'équipe adverse.

## 15.3 Règle des quatre secondes

Le gardien dispose de quatre (4) secondes maximum pour mettre le ballon en jeu à partir du moment où il en prend le contrôle (avec les mains, en le faisant rebondir ou en le projetant en l'air). Au-delà, un corner est accordé à l'équipe adverse.

## 15.4 Règle de la passe en retour

Si un coéquipier botte délibérément le ballon vers son propre gardien, celui-ci ne peut pas le toucher avec les mains ou les bras à l'intérieur de sa surface. Une infraction à cette règle est sanctionnée par un coup franc indirect accordé à l'équipe adverse à l'endroit où le gardien a touché le ballon. La même règle s'applique si le ballon est directement remis en jeu (touche au pied) vers le gardien par un coéquipier.

# ARTICLE 16 — FAIR-PLAY ET COMPORTEMENT

## 16.1 Comportement envers l'arbitre

Tout joueur, remplaçant ou officiel d'équipe doit respecter l'arbitre à tout moment. Seul le capitaine est autorisé à s'adresser à l'arbitre pour demander des explications, calmement et avec respect.

-   Contestation verbale légère : avertissement verbal.

-   Contestation persistante ou irrespectueuse : carton jaune.

-   Langage offensant, insultant ou abusif envers l'arbitre : carton rouge direct et potentiellement une suspension supplémentaire décidée par Ardentia.

## 16.2 Comportement général

Les règles de fair-play et de respect mutuel s'appliquent à tout moment, y compris en dehors du terrain (abords du terrain, zone de spectateurs, vestiaires, avant et après le match). Tout incident survenant dans ces zones est traité avec les mêmes sanctions disciplinaires que s'il s'était produit sur le terrain.

Les comportements suivants sont passibles de sanctions, y compris de suspension ou d'exclusion de la compétition par Ardentia :

-   Insultes ou provocations à l'égard des adversaires, arbitres ou spectateurs.

-   Comportements discriminatoires (racisme, sexisme, etc.).

-   Comportements violents ou menaçants.

## 16.3 Substances interdites

Il est strictement interdit de participer à un match sous l'influence d'alcool, de drogues ou de toute substance altérant les facultés physiques ou mentales. Tout joueur suspecté d'être sous l'influence d'une telle substance peut être exclu du match par l'arbitre, en concertation avec Ardentia, sans que cela n'entraîne de sanction numérique pour son équipe (le joueur est simplement considéré comme indisponible).

## 16.4 Respect du matériel

Les joueurs et officiels d'équipe sont tenus de respecter les installations d'Ardentia : terrain, buts, filets, vestiaires et tout autre équipement. Tout dommage causé intentionnellement ou par négligence grave peut faire l'objet d'une indemnisation financière et/ou d'une exclusion de la compétition, selon la décision d'Ardentia.

# ARTICLE 17 — ORGANISATION DE LA COMPÉTITION

## 17.1 Format de la compétition

Ardentia organise deux types de compétitions :

-   Le Championnat : compétition basée sur un système de points, avec des matchs disputés selon un calendrier établi par Ardentia.

-   Le Tournoi : compétition comportant une phase de groupes suivie d'une phase à élimination directe.

Les modalités détaillées de chaque compétition (nombre de journées, format de poules, etc.) sont communiquées par Ardentia avant le début de chaque édition.

## 17.2 Système de points — Championnat

-   Victoire : 3 points.

-   Match nul : 1 point pour chaque équipe.

-   Défaite : 0 point.

-   Forfait : 0 point pour l'équipe forfait, 3 points et score 3-0 pour l'équipe présente.

-   Forfait général (retrait d'une équipe en cours de compétition) : voir Article 14.3.

## 17.3 Critères de classement des équipes

Le classement des équipes (championnat ou phase de groupes) est établi selon les critères suivants, par ordre de priorité. Chaque critère n'est appliqué que si l'égalité persiste après le critère précédent :

1.  **Points :** 3 points pour une victoire, 1 point pour un match nul, 0 point pour une défaite (voir Article 17.2).

2.  **Confrontation directe :** résultat du ou des matchs ayant opposé les équipes à égalité. Si plus de deux équipes sont à égalité, un mini-classement est établi entre elles sur la base des seuls matchs qui les ont opposées.

3.  **Différence de buts :** buts marqués moins buts encaissés, sur l'ensemble des matchs de la saison ou du groupe.

4.  **Buts marqués :** nombre total de buts inscrits sur l'ensemble des matchs.

5.  **Cartons jaunes :** l'équipe ayant reçu le moins de cartons jaunes est classée devant.

6.  **Cartons rouges :** l'équipe ayant reçu le moins de cartons rouges est classée devant.

Si l'égalité persiste après l'application de l'ensemble de ces critères, les équipes sont départagées par un tirage au sort organisé par Ardentia.

## 17.4 Réclamations et litiges

Si une équipe souhaite formuler une réserve ou une réclamation concernant un match, elle doit la soumettre à Ardentia dans les vingt-quatre (24) heures suivant le coup de sifflet final du match concerné. La réclamation peut être transmise par WhatsApp ou par email à l'adresse communiquée par Ardentia. Toute réclamation formulée après ce délai sera irrecevable.

Ardentia examinera la réclamation et communiquera sa décision dans un délai raisonnable. La décision d'Ardentia est définitive.

## 17.5 Reports de matchs

Les demandes de report de match ne sont pas acceptées. Tout match non disputé à la date et à l'heure prévues est attribué par forfait à l'équipe absente (voir Article 14.1), sauf décision contraire et exceptionnelle d'Ardentia.

## 17.6 Conditions météorologiques

La décision de maintenir, reporter ou annuler un match en raison des conditions météorologiques appartient exclusivement à Ardentia. Cette décision est communiquée aux équipes dans un délai d'au moins vingt-quatre (24) heures avant le match concerné, sauf si les conditions météorologiques se dégradent de manière imprévisible dans les heures précédant le match, auquel cas la décision peut être prise plus tardivement.

-   En cas de forte pluie ou de conditions dangereuses : le match est annulé ou reporté par Ardentia.

-   En cas de pluie légère : le match se déroule comme prévu, sauf si l'arbitre, en concertation avec Ardentia, juge les conditions dangereuses ou le terrain impraticable.

# ARTICLE 18 — AUTRES CAS DE FIGURES

## 18.1 Abandon d'un match

Si une équipe abandonne son match sous forme de protestation contre une décision d'un arbitre ou d'un officiel du match, celle-ci sera qualifiée de perdante par forfait. Ainsi, elle perd son match 3-0.
`,xi=`# PRÉAMBULE

Le présent règlement régit l'ensemble des matchs et compétitions organisés par Ardentia sur ses terrains de football en gazon synthétique à 6 joueurs. Son objectif est d'assurer la sécurité des participants, la fluidité du jeu et le respect du fair-play. Tout participant — joueur, remplaçant, officiel d'équipe ou spectateur — est réputé avoir pris connaissance de ce règlement et s'engage à le respecter.

En cas de situation non prévue par le présent règlement, l'arbitre tranche en accord avec les principes généraux du football à 6 et, si nécessaire, en concertation avec le comité organisateur Ardentia. Sa décision est définitive.

# ARTICLE 1 — LE TERRAIN ET LE MATÉRIEL

## 1.1 Le terrain

Les matchs se déroulent sur les terrains en gazon synthétique mis à disposition par le partenaire d'Ardentia. Les terrains abritent des matchs de 6 joueurs contre 6 joueurs.

## 1.2 Le ballon

Le ballon officiel utilisé lors de tous les matchs est de taille 5. Il est fourni par Ardentia. En cas de dommage au ballon en cours de jeu, l'arbitre arrête le jeu, fait remplacer le ballon et reprend avec une balle à terre à l'endroit où le ballon a été endommagé.

## 1.3 La zone de remplacement

Les remplaçants et le staff technique doivent se tenir dans la zone qui leur est réservée, à l'intérieur de l'enceinte du terrain. Cette zone est délimitée par des plots visibles. Il est interdit aux remplaçants et au staff technique de sortir de cette zone sans l'autorisation de l'arbitre.

Les remplacements s'effectuent exclusivement par la porte du terrain. Tout joueur sortant du terrain est tenu de fermer la porte derrière lui afin d'éviter tout risque de blessure. Le non-respect de cette consigne constitue une faute de sécurité pouvant être sanctionnée par un avertissement verbal.

# ARTICLE 2 — LES JOUEURS

## 2.1 Composition des équipes

Un match se joue entre deux équipes, chacune composée d'un maximum de six (6) joueurs sur le terrain, dont obligatoirement un gardien de but.

Chaque équipe peut disposer d'un maximum de six (6) remplaçants.

## 2.2 Nombre minimum de joueurs

Le nombre minimum de joueurs requis pour débuter et poursuivre un match est de quatre (4) joueurs par équipe, gardien de but compris.

-   Si, avant le coup d'envoi, une équipe ne dispose pas d'au moins quatre (4) joueurs après l'expiration du délai de carence (voir Article 14.1), le match est déclaré perdu par forfait pour cette équipe.

-   Si, en cours de match, une équipe tombe en dessous de quatre (4) joueurs suite à des expulsions ou blessures ne pouvant être remplacées, le match est définitivement arrêté. L'équipe concernée est déclarée perdante par forfait sur le score de 3-0, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 2.3 Inscription et liste des joueurs

Les noms complets des joueurs et remplaçants, tels qu'ils figurent sur leur carte d'identité nationale (CIN), doivent être communiqués à Ardentia lors de la période des inscriptions, avant le début de la compétition. Ces listes servent à garantir la couverture d'assurance et à assurer le fair-play.

Tout joueur dont le nom n'est pas mentionné sur la liste de l'équipe est strictement interdit de participation. Si un joueur non inscrit est découvert en cours de match, l'arbitre l'expulse immédiatement. Tout but marqué par ce joueur non inscrit est refusé rétroactivement, et le joueurs est expulsé du terrain.

Un joueur peut être ajouté ou retiré de la liste de l'équipe sur demande écrite (email) du capitaine auprès d'Ardentia, au moins 48 heures avant le prochain match, afin de permettre la mise à jour de la couverture d'assurance. Sans le respect de ce ce délai, le joueurs ne peut faire partie du match.

## 2.4 Procédure de remplacement

Un nombre illimité de remplacements peut être effectué au cours d'un match. Un remplacement ne peut avoir lieu que lorsque le ballon n'est pas en jeu. Les règles suivantes s'appliquent :

-   Le joueur remplacé quitte le pelouse vers la zone des remplaçants.

-   Le joueur remplacé avise l'arbitre avant de quitter le pelouse.

-   Les remplaçants portent obligatoirement des dossards d'une couleur distincte de celle des joueurs présents sur le terrain.

-   Avant d'entrer sur la pelouse, le remplaçant remet son dossard au joueur remplacé. Le remplaçant ne peut pas entrer sur la pelouse tant que cet échange de dossard n'a pas eu lieu.

-   Le remplaçant n'entre sur la pelouse qu'après le départ complet du joueur remplacé.

-   À partir du moment où le remplaçant entre sur le terrain, il devient joueur et le joueur remplacé devient remplaçant.

-   L'autorisation de procéder à un remplacement peut être refusée par l'arbitre si l'équipement du remplaçant n'est pas conforme.

-   Tous les joueurs, remplaçants et staff technique sont soumis à l'autorité de l'arbitre.

Si un joueur de champ effectue un remplacement sans aviser l'arbitre, il reçoit un avertissement verbal. En cas de récidive, l'arbitre lui adresse un carton jaune, voire rouge selon la gravité.

Si un remplaçant entre sur la pelouse avant le départ complet du joueur remplacé :

-   L'arbitre arrête le jeu (sauf application de la règle de l'avantage).

-   Le remplaçant est averti et invité à quitter immédiatement la pelouse.

-   Le jeu reprend par un coup franc indirect accordé à l'équipe adverse, à l'endroit où se trouvait le remplaçant irrégulier.

## 2.5 Sanctions impliquant les remplaçants et officiels d'équipe

Si un remplaçant ou un officiel du staff technique reçoit un carton rouge, son équipe doit retirer un joueur de champ pendant deux (2) minutes, sauf si un but est marqué par l'équipe adverse avant la fin de cette période, auquel cas un remplaçant peut entrer pour rétablir la parité numérique. Le remplaçant ou officiel expulsé ne peut plus participer au match sous quelque forme que ce soit.

Si un remplaçant reçoit un carton jaune alors qu'il est sur le banc, il portera cette sanction lorsqu'il entrera sur le terrain.

## 2.6 Changement de gardien de but

-   Tout joueur ou remplaçant peut prendre le rôle de gardien de but, à condition d'en informer l'arbitre lors d'un arrêt de jeu et de revêtir un dossard de couleur distincte.

-   Le changement doit obligatoirement se faire lors d'un arrêt du jeu et avec l'autorisation expresse de l'arbitre.

-   Si un joueur assume le rôle de gardien sans en informer l'arbitre et touche le ballon de la main dans sa surface, son équipe est sanctionnée d'un penalty.

-   Aucun changement de gardien n'est autorisé après le sifflement d'un penalty, sauf en cas de blessure grave constatée et validée par l'arbitre et Ardentia.

-   Lors des phases éliminatoires, si un match est décidé aux tirs au but, le gardien en place au moment du coup de sifflet final ne peut pas être changé, sauf blessure grave.

## 2.7 Joueurs et remplaçants expulsés

Un joueur expulsé (carton rouge) doit quitter immédiatement le terrain. Il ne peut plus participer au match.

Son équipe joue en infériorité numérique pendant deux (2) minutes de temps de jeu effectif. Un remplaçant peut entrer pour combler cette infériorité selon les conditions suivantes :

-   6 joueurs contre 5, ou 5 contre 4 : si l'équipe la plus nombreuse marque un but, l'équipe réduite peut faire entrer un remplaçant.

-   Si les deux équipes jouent à effectifs réduits égaux (ex : 5 contre 5, 4 contre 4) et qu'un but est marqué, aucune équipe ne récupère un joueur avant la fin de la réduction numérique respective de deux minutes.

-   6 joueurs contre 4 : si l'équipe à 6 marque, l'équipe à 4 ne peut faire entrer qu'un seul remplaçant (portant à 5 son effectif).

-   Si l'équipe en infériorité marque un but, le jeu continue sans modification du nombre de joueurs jusqu'à l'écoulement des deux minutes.

**Tout joueur expulsé par l'arbitre doit quitter immédiatement le terrain. En cas de refus de sortie, l'arbitre accorde un délai maximal de 5 minutes pour que le ou les joueurs concernés quittent le terrain. À défaut d'exécution dans ce délai, la rencontre est arrêtée et l'équipe du ou des joueurs expulsés est déclarée perdante par forfait.**

## 2.8 But marqué avec une personne supplémentaire sur le terrain

Si, après qu'un but est marqué et que le jeu a repris, l'arbitre constate qu'une personne supplémentaire se trouvait sur le terrain au moment du but, le but ne peut pas être refusé rétroactivement.

Si l'arbitre constate la présence d'une personne supplémentaire avant la reprise du jeu :

-   Le but est refusé si la personne supplémentaire appartenait à l'équipe ayant marqué (joueur, remplaçant, expulsé ou officiel). Le jeu reprend par un coup franc direct pour l'équipe adverse à l'endroit où se trouvait cette personne.

-   Le but est refusé si la personne supplémentaire était un agent extérieur ayant gêné le jeu. Le jeu reprend par une balle à terre.

Dans tous les cas, l'arbitre fait sortir la personne supplémentaire de la pelouse.

## 2.9 Capitaine d'équipe

Chaque équipe désigne un capitaine avant le début du match. Le capitaine est identifiable par un brassard. Il est le seul joueur autorisé à s'adresser à l'arbitre pour demander des éclaircissements sur une décision, et ce, de manière respectueuse et calme. Toute autre forme d'interpellation de l'arbitre par d'autres joueurs est passible d'avertissement.

Le capitaine est responsable du comportement de son équipe et de ses supporters. En cas d'incidents répétés, l'arbitre peut tenir le capitaine pour responsable disciplinairement.

# ARTICLE 3 — L'ÉQUIPEMENT DES JOUEURS

## 3.1 Sécurité

Aucun joueur ne peut utiliser ou porter un équipement ou objet dangereux pour lui-même ou pour autrui. Sont notamment interdits :

-   Tous bijoux : colliers, bagues, bracelets, boucles d'oreilles, élastiques métalliques. L'usage de ruban adhésif pour couvrir les bijoux n'est pas autorisé.

-   Chaussures à crampons métalliques ou tout autre équipement susceptible d'endommager le gazon synthétique ou de blesser un adversaire.

Si un joueur porte un équipement non autorisé, l'arbitre lui ordonne de le retirer. Si le joueur ne peut ou ne veut pas s'y conformer, il quitte le terrain au prochain arrêt. Un refus de se conformer, ou le port répété d'un article interdit, est sanctionné par un carton jaune.

## 3.2 Couleurs et tenues

Les deux équipes doivent porter des couleurs qui les distinguent l'une de l'autre ainsi que des officiels de match. Si les deux équipes portent des couleurs similaires, l'arbitre procède à un tirage au sort en présence des deux capitaines pour désigner l'équipe devant revêtir des dossards distinctifs fournis par Ardentia.

Le gardien de but doit obligatoirement porter un dossard d'une couleur distincte de celle de ses coéquipiers et de celle de l'équipe adverse.

## 3.3 Équipements de protection autorisés

Les équipements de protection non dangereux sont autorisés : masques de protection, lunettes de sport homologuées, genouillères et coudières en matériau rembourré souple. Ces équipements doivent être présentés à l'arbitre avant le match pour validation.

# ARTICLE 4 — L'ARBITRE

## 4.1 Autorité de l'arbitre

Chaque match est dirigé par un arbitre désigné par Ardentia. L'arbitre a pleine autorité pour faire respecter le présent règlement durant toute la durée du match, depuis son entrée sur le terrain jusqu'à sa sortie après le coup de sifflet final (y compris pendant les tirs au but).

## 4.2 Décisions de l'arbitre

Les décisions de l'arbitre sur les faits de jeu — y compris l'attribution d'un but et le résultat du match — sont définitives et sans appel immédiat. Elles prévalent sur celles des organisateurs présents sur place.

Si un assistant de match signale une infraction mais que l'arbitre ne l'observe qu'après la reprise du jeu, l'arbitre peut prendre les mesures disciplinaires appropriées, mais la sanction de reprise de jeu liée à la faute ne s'applique pas.

Toute protestation excessive contre une décision arbitrale — y compris de la part du capitaine — peut entraîner un avertissement verbal ou un carton jaune, selon l'appréciation de l'arbitre.

## 4.3 Pouvoirs et devoirs de l'arbitre

L'arbitre est investi des missions suivantes :

-   Appliquer le présent règlement Ardentia.

-   Vérifier l'équipement des joueurs avant le coup d'envoi.

-   Tenir un registre des incidents du match (cartons, buts, expulsions).

-   Agir comme chronométreur officiel du match.

-   Arrêter, suspendre ou abandonner le match en cas de problème (interférence extérieure, projecteurs défaillants, animal sur le terrain, conditions météorologiques dangereuses). En cas d'interférence extérieure affectant le jeu, le jeu reprend par une balle à terre, sauf si le ballon pénètre dans le but sans intervention de l'agent extérieur, auquel cas le but est accordé.

-   Arrêter le jeu en cas de blessure grave et veiller à ce que le joueur blessé soit retiré du terrain. Un joueur blessé ne peut pas être soigné sur le terrain sauf dans les cas suivants : collision entre gardien et joueur de champ, collision entre deux joueurs de la même équipe, blessure grave, penalty accordé au joueur blessé (qu'il soit tireur ou gardien).

-   Décider, avec l'aide des organisateurs, des incidents dont il n'a pas été directement témoin.

-   Garantir qu'aucune personne non autorisée ne pénètre sur le terrain.

-   Demander au capitaine de l'une ou l'autre équipe de calmer ses spectateurs lorsque leur comportement perturbe le bon déroulement du match. Si nécessaire, l'arbitre arrête le jeu jusqu'au retour au calme.

-   En cas de défaillance du chronomètre, aviser immédiatement Ardentia pour en obtenir un de remplacement.

## 4.4 Équipement obligatoire de l'arbitre

-   Au moins un sifflet.

-   Cartons rouges et jaunes.

-   Un carnet (ou tout autre support) pour la tenue du registre du match.

-   Au moins une montre ou chronomètre.

# ARTICLE 5 — LA DURÉE DU MATCH

## 5.1 Périodes de jeu

Un match se compose de deux (2) périodes de vingt (20) minutes chacune de temps de jeu effectif. Le chronomètre est arrêté à chaque interruption de jeu (blessures, remplacements, litiges, etc.) et repris à la reprise du jeu.

## 5.2 Temps morts et arrêts de jeu

L'arbitre est responsable du décompte de tous les temps morts et s'assure qu'ils sont ajoutés au temps officiel du match. La durée totale cumulée des arrêts de jeu ne peut excéder dix (10) minutes par match. Au-delà de ce seuil, l'arbitre peut, à sa discrétion et après concertation avec Ardentia, suspendre ou arrêter le match.

## 5.3 Intervalle à la mi-temps

Les joueurs ont droit à une pause à la mi-temps ne dépassant pas cinq (5) minutes. À l'issue de la pause, les équipes changent de côté de terrain. Les officiels d'équipe et remplaçants changent également de banc.

## 5.4 Fin des périodes

L'arbitre siffle la fin de chaque période de vingt minutes. Il peut prolonger une période pour permettre l'exécution d'un coup franc, d'un penalty ou d'un corner accordé juste avant le coup de sifflet final.

## 5.5 Prolongation

Il n'y a pas de prolongation dans le cadre de ce règlement. En phases éliminatoires, en cas d'égalité à l'issue du temps réglementaire, les équipes passent directement aux tirs au but (voir Article 13).

# ARTICLE 6 — LE COUP D'ENVOI ET LA REPRISE DU JEU

## 6.1 Coup d'envoi

Avant le début du match, l'arbitre effectue un tirage au sort (pièce de monnaie) en présence des deux capitaines. L'équipe gagnante choisit le sens d'attaque pour la première période ; l'équipe perdante effectue le coup d'envoi. À la mi-temps, les rôles s'inversent.

Le coup d'envoi est effectué depuis le centre du terrain au coup de sifflet de l'arbitre. Le ballon doit être stationnaire au centre. Les joueurs de l'équipe adverse doivent se trouver dans leur propre moitié de terrain. Le ballon est en jeu dès qu'il est touché. Un but peut être marqué directement sur un coup d'envoi.

## 6.2 Reprise après un but

Après qu'un but est accordé, le jeu reprend par un coup d'envoi effectué par l'équipe qui a encaissé le but, depuis le centre du terrain.

## 6.3 Balle à terre

Une balle à terre est accordée lorsque l'arbitre a arrêté le jeu sans qu'aucune infraction n'ait été commise (blessure, objet sur le terrain, etc.). La procédure est la suivante :

-   L'arbitre lâche le ballon à l'endroit où il se trouvait au moment de l'arrêt (ou à l'endroit le plus proche en jeu).

-   Le ballon est en jeu dès qu'il touche le sol.

-   Les joueurs adverses doivent se tenir à au moins un (1) mètre du ballon jusqu'à ce qu'il soit en jeu.

-   Si la balle à terre doit être donnée dans la surface de réparation, elle est donnée sur la ligne de surface de réparation la plus proche du point d'arrêt.

# ARTICLE 7 — LE HORS-JEU

La règle du hors-jeu ne s'applique pas dans ce format de jeu. Aucun joueur ne peut être sanctionné pour hors-jeu, quelle que soit sa position sur le terrain.

# ARTICLE 8 — LES REMISES EN JEU (TOUCHES)

## 8.1 Accord d'une remise en jeu

Une remise en jeu est accordée lorsque le ballon franchit entièrement la ligne de touche (latérale) — que ce soit au sol ou en l'air — au dernier contact d'un joueur de l'équipe adverse.

## 8.2 Procédure

La remise en jeu se fait au pied (coup de pied de touche). Les règles suivantes s'appliquent :

-   Le ballon doit être posé, immobile, sur la ligne de touche, à l'endroit exact où il est sorti.

-   Le joueur effectuant la remise dispose de cinq (5) secondes pour jouer le ballon, à partir du moment où celui-ci est posé sur la ligne.

-   Les adversaires doivent se tenir à au moins cinq (5) mètres du point de remise en jeu.

-   Le joueur effectuant la remise ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

-   Un but ne peut pas être marqué directement depuis une remise en jeu en touche.

Si le joueur dépasse le délai de cinq (5) secondes, ou s'il ne pose pas le ballon sur la ligne de touche, la remise en jeu est accordée à l'équipe adverse.

## 8.3 Ballon sorti en fond de terrain

Si le ballon sort entièrement par la ligne de fond (ligne de but) sans qu'un but ne soit marqué, les règles suivantes s'appliquent selon le dernier contact :

-   Dernier contact d'un défenseur : corner accordé à l'équipe attaquante (voir Article 9).

-   Dernier contact d'un attaquant : coup de pied de but accordé à l'équipe défendante (voir Article 10).

# ARTICLE 9 — LES CORNERS

## 9.1 Accord d'un corner

Un corner est accordé à l'équipe attaquante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe défendante.

## 9.2 Procédure

-   Le ballon est posé, immobile, dans l'arc de corner le plus proche du point de sortie.

-   Le tireur dispose de huit (8) secondes pour frapper le ballon, à partir du moment où celui-ci est posé dans l'arc de corner.

-   Les joueurs adverses doivent se tenir à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Le ballon est en jeu dès qu'il est frappé.

-   Un but peut être marqué directement depuis un corner.

-   Le tireur ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

## 9.3 Infractions

Si le tireur dépasse le délai de huit (8) secondes ou ne respecte pas la procédure, le jeu reprend par un coup de pied de but en faveur de l'équipe adverse. Si un adversaire pénètre dans la zone des cinq mètres avant la frappe, le corner est retiré.

# ARTICLE 10 — LES COUPS DE PIED DE BUT

## 10.1 Accord d'un coup de pied de but

Un coup de pied de but est accordé à l'équipe défendante lorsque le ballon sort entièrement par la ligne de fond et que le dernier contact a été effectué par un joueur de l'équipe attaquante.

## 10.2 Procédure

-   Le gardien de but (ou tout joueur défenseur désigné) effectue le coup de pied de but depuis n'importe quel point à l'intérieur de la surface de réparation.

-   Le ballon est en jeu dès qu'il sort de la surface de réparation.

-   Les joueurs adverses doivent se trouver hors de la surface de réparation jusqu'à ce que le ballon soit en jeu.

-   Le gardien dispose de quatre (4) secondes pour mettre le ballon en jeu après l'avoir récupéré.

-   Un but peut être marqué directement depuis un coup de pied de but.

-   Le joueur effectuant le coup de pied ne peut pas toucher le ballon une seconde fois avant qu'un autre joueur l'ait touché.

# ARTICLE 11 — FAUTES ET INCONDUITES

## 11.1 Coup franc direct

Toute infraction impliquant un contact avec un adversaire est sanctionnée par un coup franc direct ou, si elle est commise par un joueur dans sa propre surface de réparation, par un penalty (voir Article 11.4).

Un coup franc direct est accordé à l'équipe adverse lorsqu'un joueur commet l'une des infractions suivantes de manière jugée insouciante, imprudente ou avec usage excessif de la force :

-   Tacler ou défier un adversaire de manière dangereuse.

-   Sauter sur un adversaire.

-   Charger un adversaire.

-   Frapper ou tenter de frapper un adversaire.

-   Pousser un adversaire.

-   Mordre ou cracher sur quelqu'un.

-   Tenir un adversaire.

-   Faire trébucher ou tenter de faire trébucher un adversaire.

-   Toucher intentionnellement le ballon avec la main ou le bras (sauf le gardien dans sa surface).

L'évaluation de la faute suit les degrés suivants :

-   **Insouciance :** le joueur fait preuve d'un manque d'attention ou de considération en disputant le ballon, ou agit sans précaution. Coup franc direct, sans sanction disciplinaire.

-   **Imprudence :** le joueur agit sans tenir compte du danger ou des conséquences de son geste pour l'adversaire. Coup franc direct et carton jaune obligatoire.

-   **Usage excessif de la force :** le joueur dépasse la force nécessaire et/ou met en danger la sécurité d'un adversaire. Coup franc direct et carton rouge obligatoire (expulsion).

## 11.2 Coup franc indirect

Un coup franc indirect sanctionne une infraction commise sans contact avec un adversaire. Il est accordé à l'équipe adverse si un joueur :

-   Joue de manière dangereuse sans contact (ex. : tenter une tête alors qu'un adversaire s'apprête à botter le ballon à hauteur de la tête).

-   Fait obstruction à la progression d'un adversaire sans contact.

-   Empêche le gardien de lâcher le ballon.

-   Est coupable de dissidence, langage ou gestes offensants, insultants ou abusifs.

Un coup franc indirect est également accordé à l'équipe adverse si le gardien :

-   Contrôle le ballon avec les mains, bras ou pieds dans sa propre moitié de terrain pendant plus de quatre (4) secondes.

-   Touche le ballon avec les mains ou les bras à l'intérieur de sa surface de réparation après qu'il a été délibérément botté par un coéquipier (règle de la passe en retour).

-   Reçoit directement dans les mains une rentrée de touche effectuée au pied par un coéquipier.

Le gardien est considéré comme en contrôle du ballon lorsque : il le tient dans ses mains, le fait rebondir sur le sol ou le projette en l'air.

Sur un coup franc indirect, un but ne peut être accordé que si le ballon a touché un autre joueur avant de pénétrer dans le but.

## 11.3 Le mur et la distance réglementaire

Les règles suivantes s'appliquent à tout coup franc, direct ou indirect :

-   Lors d'un coup franc adverse, les joueurs formant le mur doivent se placer à au moins cinq (5) mètres du ballon jusqu'à ce qu'il soit en jeu.

-   Lorsque le coup franc est sifflé dans la propre moitié de terrain de l'équipe qui en bénéficie, aucun mur n'est autorisé : les adversaires doivent simplement se tenir à cinq (5) mètres du ballon.

-   Tout joueur qui ne respecte pas la distance réglementaire est passible d'un carton jaune (voir Article 11.5).

## 11.4 Le penalty

Un penalty est accordé lorsqu'un joueur commet, dans sa propre surface de réparation, l'une des infractions passibles d'un coup franc direct, que le ballon soit en jeu ou non.

Procédure d'exécution d'un penalty :

-   Le ballon est placé sur le point de penalty tracé sur le terrain.

-   Le gardien adverse se place sur sa ligne de but, entre les poteaux, et ne peut pas avancer avant que le ballon soit frappé.

-   Tous les autres joueurs (des deux équipes) se placent en dehors de la surface de réparation et derrière le ballon (ou sur la ligne de but adjacente) jusqu'à ce que le ballon soit frappé.

-   Le tireur désigné frappe le ballon vers l'avant en un seul mouvement. Tout arrêt complet du mouvement lors de l'élan est sanctionné par un coup franc indirect en faveur de l'équipe défendante.

-   Si le gardien avance prématurément et que le tir est manqué ou repoussé, le penalty est retiré. Si le tir est transformé, le but est accordé.

-   Si le ballon rebondit sur les poteaux ou la barre et revient en jeu, tout joueur peut jouer le ballon, y compris le tireur.

-   Si le temps réglementaire expire avant l'exécution du penalty, celui-ci est tout de même tiré et le match se termine à l'issue de son exécution.

## 11.5 Cartons jaunes — Avertissements

Un carton jaune est délivré à un joueur, remplaçant ou officiel d'équipe pour l'une des raisons suivantes :

-   Comportement antisportif (simulation, protestation excessive, jeu déloyal).

-   Dissidence par les mots ou les gestes envers l'arbitre.

-   Infractions répétées aux règles du jeu.

-   Retarder la reprise du jeu.

-   Ne pas respecter la distance requise lors d'un coup franc, corner ou remise en jeu.

-   Entrer ou quitter le terrain sans autorisation.

-   Imprudence dans un tacle ou une charge.

Deux (2) cartons jaunes dans le même match entraînent automatiquement un carton rouge (expulsion).

**Cumul de cartons jaunes :** les cartons jaunes reçus par un même joueur se cumulent d'un match à l'autre sur l'ensemble de la compétition. Trois (3) cartons jaunes cumulés entraînent automatiquement un (1) match de suspension, à purger lors du match suivant de son équipe. Le compteur de cartons jaunes du joueur est remis à zéro une fois la suspension purgée. Les deux cartons jaunes reçus dans un même match et ayant entraîné une expulsion ne sont pas comptés dans ce cumul, l'expulsion étant sanctionnée selon l'Article 11.6.

## 11.6 Cartons rouges — Expulsions

Un carton rouge est délivré pour l'une des raisons suivantes, entraînant l'expulsion immédiate du joueur :

-   Faute grossière (tacle ou charge mettant en danger l'intégrité physique d'un adversaire).

-   Comportement violent (coup, tentative de coup, morsure, crachat).

-   Déni d'une occasion de but manifeste par une faute de main volontaire (hors gardien dans sa surface).

-   Déni d'une occasion de but manifeste par une faute physique.

-   Langage ou gestes offensants, insultants ou abusifs envers quiconque.

-   Deux cartons jaunes dans le même match.

Un joueur expulsé quitte le terrain immédiatement. Son équipe joue en infériorité numérique pendant deux (2) minutes (voir Article 2.7). Le joueur expulsé ne peut plus participer au match.

**Suspension après un carton rouge :** tout carton rouge entraîne au minimum un (1) match de suspension, à purger lors du match suivant de l'équipe du joueur. Ardentia peut alourdir cette suspension en fonction de la gravité du comportement (violence, insultes, menaces envers l'arbitre ou un adversaire, refus de quitter le terrain, etc.), sur la base du rapport de l'arbitre. La décision d'Ardentia est communiquée au capitaine de l'équipe concernée avant le match suivant.

## 11.7 Erreur d'identification lors d'un carton

Si l'arbitre se rend compte, avant la reprise du jeu, qu'il a attribué un carton au mauvais joueur, il annule la sanction envers ce joueur et l'attribue au joueur fautif. Toute réclamation pour erreur d'identification doit être soulevée immédiatement et avant la reprise du jeu.

# ARTICLE 12 — LES BUTS

## 12.1 But valide

Un but est accordé lorsque la totalité du ballon franchit entièrement la ligne de but, entre les poteaux et sous la barre transversale, à condition qu'aucune infraction n'ait été commise par l'équipe marquant le but. Un but est accordé si le gardien lance le ballon directement dans le but adverse.

## 12.2 But refusé

Un but est refusé dans les cas suivants :

-   Une infraction a été commise par l'équipe attaquante avant ou pendant l'action menant au but.

-   Une personne supplémentaire appartenant à l'équipe attaquante se trouvait sur le terrain (voir Article 2.8).

-   Le ballon a été touché par un agent extérieur appartenant à l'équipe attaquante avant d'entrer dans le but.

# ARTICLE 13 — LES TIRS AU BUT

## 13.1 Quand sont-ils organisés ?

Les tirs au but sont organisés exclusivement lors des phases éliminatoires en cas d'égalité à l'issue du temps réglementaire. Ils ne font pas partie du match et les statistiques de la série de tirs au but ne sont pas comptabilisées dans les buts du match.

## 13.2 Désignation du but et ordre de tir

-   L'arbitre effectue un tirage au sort en présence des deux capitaines pour désigner le but dans lequel les tirs seront effectués.

-   Un second tirage au sort détermine l'équipe qui tire en premier.

-   Chaque équipe désigne cinq (5) tireurs parmi les joueurs qui se trouvaient sur le terrain au coup de sifflet final. Un joueur expulsé ne peut pas participer aux tirs au but.

-   L'ordre de passage des tireurs est librement choisi par chaque équipe.

## 13.3 Procédure de chaque tir

-   Les joueurs qui ne tirent pas se regroupent au centre du terrain, à au moins dix (10) mètres des tireurs.

-   Seul le tireur désigné et les deux gardiens sont autorisés dans la moitié de terrain des buts.

-   Le gardien doit rester sur sa ligne de but jusqu'à ce que le ballon soit frappé.

-   Les mêmes règles que pour un penalty en cours de match s'appliquent (voir Article 11.4).

## 13.4 Issue de la série initiale

L'équipe qui marque le plus de tirs sur les cinq tentatives de chaque côté est déclarée vainqueur. Si les deux équipes sont toujours à égalité après la série de cinq tirs chacune, la séance se poursuit en mort subite : les mêmes cinq joueurs tirent à nouveau, dans le même ordre ou un ordre différent choisi par l'équipe, jusqu'à ce qu'une équipe marque et que l'autre manque sur le même numéro de tir.

# ARTICLE 14 — FORFAIT ET MATCHS NON JOUÉS

## 14.1 Non-présentation et délai de carence

Si une équipe ne se présente pas ou ne réunit pas le nombre minimum de joueurs (4) dans un délai de quinze (15) minutes après l'heure officielle de début du match, le match lui est attribué par forfait. Le score officiel est fixé à 3-0 en faveur de l'équipe présente.

En cas de force majeure dûment justifiée et communiquée à Ardentia avant le début du délai de carence, Ardentia se réserve le droit d'examiner la situation, étant entendu que les reports de matchs ne sont pas acceptés en règle générale (voir Article 17.5).

## 14.2 Équipe avec un effectif en dessous du minimum en cours de match

Si, en cours de match, une équipe se retrouve avec moins de quatre (4) joueurs suite à des expulsions ou blessures sans remplaçants disponibles, le match est arrêté. L'équipe concernée est déclarée perdante par forfait. Le score retenu est 3-0 en sa défaveur, sauf si le score en cours lui est plus défavorable, auquel cas ce score est retenu.

## 14.3 Forfait général (retrait d'une équipe de la compétition)

Une équipe qui déclare forfait pour le reste de la compétition est retirée de celle-ci. Cette règle s'applique au championnat et à la phase de groupes du tournoi. Tous les matchs déjà disputés par l'équipe forfait sont annulés, et ses matchs restants ne sont pas joués. Les conséquences sont les suivantes :

-   **Points :** chaque équipe qui avait battu l'équipe forfait perd les trois (3) points de cette victoire. Chaque équipe qui avait fait match nul contre elle perd un (1) point. Les équipes qui avaient perdu contre elle ne perdent aucun point.

-   **Buteurs :** les buts marqués par des joueurs contre l'équipe forfait sont retirés de leur total personnel et du classement des buteurs.

-   **Buts marqués contre l'équipe forfait :** ils sont retirés du total de buts marqués de chaque équipe adverse concernée.

-   **Buts marqués par l'équipe forfait :** ils sont retirés du total de buts encaissés de chaque équipe adverse concernée.

-   **Cartons :** les cartons jaunes et rouges reçus lors des matchs annulés ne sont plus comptés pour le départage des équipes (Article 17.3, critères 5 et 6). En revanche, les sanctions disciplinaires individuelles qui en découlent (suspensions, expulsions) restent applicables aux joueurs concernés.

La différence de buts, le classement général des équipes et le classement des buteurs sont recalculés en conséquence par Ardentia.

**Forfait en phase à élimination directe :** si une équipe déclare forfait ou abandonne la compétition pendant la phase à élimination directe du tournoi, son adversaire est qualifié d'office pour le tour suivant, sur le score de 3-0. Les résultats de la phase de groupes ne sont pas modifiés.

# ARTICLE 15 — RÈGLES SPÉCIFIQUES AU GARDIEN DE BUT

## 15.1 Dans sa surface de réparation

Le gardien peut utiliser ses mains et ses bras pour jouer le ballon exclusivement à l'intérieur de sa propre surface de réparation. En dehors de sa surface, il est soumis aux mêmes règles que n'importe quel joueur de champ et ne peut en aucun cas utiliser ses mains ou ses bras pour jouer le ballon.

## 15.2 Hors de sa surface de réparation

Le gardien peut se déplacer librement en dehors de sa surface et jouer le ballon au pied comme tout joueur de champ. Toute utilisation des mains hors de la surface est sanctionnée par un coup franc direct accordé à l'équipe adverse.

## 15.3 Règle des quatre secondes

Le gardien dispose de quatre (4) secondes maximum pour mettre le ballon en jeu à partir du moment où il en prend le contrôle (avec les mains, en le faisant rebondir ou en le projetant en l'air). Au-delà, un corner est accordé à l'équipe adverse.

## 15.4 Règle de la passe en retour

Si un coéquipier botte délibérément le ballon vers son propre gardien, celui-ci ne peut pas le toucher avec les mains ou les bras à l'intérieur de sa surface. Une infraction à cette règle est sanctionnée par un coup franc indirect accordé à l'équipe adverse à l'endroit où le gardien a touché le ballon. La même règle s'applique si le ballon est directement remis en jeu (touche au pied) vers le gardien par un coéquipier.

# ARTICLE 16 — FAIR-PLAY ET COMPORTEMENT

## 16.1 Comportement envers l'arbitre

Tout joueur, remplaçant ou officiel d'équipe doit respecter l'arbitre à tout moment. Seul le capitaine est autorisé à s'adresser à l'arbitre pour demander des explications, calmement et avec respect.

-   Contestation verbale légère : avertissement verbal.

-   Contestation persistante ou irrespectueuse : carton jaune.

-   Langage offensant, insultant ou abusif envers l'arbitre : carton rouge direct et potentiellement une suspension supplémentaire décidée par Ardentia.

## 16.2 Comportement général

Les règles de fair-play et de respect mutuel s'appliquent à tout moment, y compris en dehors du terrain (abords du terrain, zone de spectateurs, vestiaires, avant et après le match). Tout incident survenant dans ces zones est traité avec les mêmes sanctions disciplinaires que s'il s'était produit sur le terrain.

Les comportements suivants sont passibles de sanctions, y compris de suspension ou d'exclusion de la compétition par Ardentia :

-   Insultes ou provocations à l'égard des adversaires, arbitres ou spectateurs.

-   Comportements discriminatoires (racisme, sexisme, etc.).

-   Comportements violents ou menaçants.

## 16.3 Substances interdites

Il est strictement interdit de participer à un match sous l'influence d'alcool, de drogues ou de toute substance altérant les facultés physiques ou mentales. Tout joueur suspecté d'être sous l'influence d'une telle substance peut être exclu du match par l'arbitre, en concertation avec Ardentia, sans que cela n'entraîne de sanction numérique pour son équipe (le joueur est simplement considéré comme indisponible).

## 16.4 Respect du matériel

Les joueurs et officiels d'équipe sont tenus de respecter les installations d'Ardentia : terrain, buts, filets, vestiaires et tout autre équipement. Tout dommage causé intentionnellement ou par négligence grave peut faire l'objet d'une indemnisation financière et/ou d'une exclusion de la compétition, selon la décision d'Ardentia.

# ARTICLE 17 — ORGANISATION DE LA COMPÉTITION

## 17.1 Format de la compétition

Ardentia organise deux types de compétitions :

-   Le Championnat : compétition basée sur un système de points, avec des matchs disputés selon un calendrier établi par Ardentia.

-   Le Tournoi : compétition comportant une phase de groupes suivie d'une phase à élimination directe.

Les modalités détaillées de chaque compétition (nombre de journées, format de poules, etc.) sont communiquées par Ardentia avant le début de chaque édition.

## 17.2 Système de points — Championnat

-   Victoire : 3 points.

-   Match nul : 1 point pour chaque équipe.

-   Défaite : 0 point.

-   Forfait : 0 point pour l'équipe forfait, 3 points et score 3-0 pour l'équipe présente.

-   Forfait général (retrait d'une équipe en cours de compétition) : voir Article 14.3.

## 17.3 Critères de classement des équipes

Le classement des équipes (championnat ou phase de groupes) est établi selon les critères suivants, par ordre de priorité. Chaque critère n'est appliqué que si l'égalité persiste après le critère précédent :

1.  **Points :** 3 points pour une victoire, 1 point pour un match nul, 0 point pour une défaite (voir Article 17.2).

2.  **Confrontation directe :** résultat du ou des matchs ayant opposé les équipes à égalité. Si plus de deux équipes sont à égalité, un mini-classement est établi entre elles sur la base des seuls matchs qui les ont opposées.

3.  **Différence de buts :** buts marqués moins buts encaissés, sur l'ensemble des matchs de la saison ou du groupe.

4.  **Buts marqués :** nombre total de buts inscrits sur l'ensemble des matchs.

5.  **Cartons jaunes :** l'équipe ayant reçu le moins de cartons jaunes est classée devant.

6.  **Cartons rouges :** l'équipe ayant reçu le moins de cartons rouges est classée devant.

Si l'égalité persiste après l'application de l'ensemble de ces critères, les équipes sont départagées par un tirage au sort organisé par Ardentia.

## 17.4 Réclamations et litiges

Si une équipe souhaite formuler une réserve ou une réclamation concernant un match, elle doit la soumettre à Ardentia dans les vingt-quatre (24) heures suivant le coup de sifflet final du match concerné. La réclamation peut être transmise par WhatsApp ou par email à l'adresse communiquée par Ardentia. Toute réclamation formulée après ce délai sera irrecevable.

Ardentia examinera la réclamation et communiquera sa décision dans un délai raisonnable. La décision d'Ardentia est définitive.

## 17.5 Reports de matchs

Les demandes de report de match ne sont pas acceptées. Tout match non disputé à la date et à l'heure prévues est attribué par forfait à l'équipe absente (voir Article 14.1), sauf décision contraire et exceptionnelle d'Ardentia.

## 17.6 Conditions météorologiques

La décision de maintenir, reporter ou annuler un match en raison des conditions météorologiques appartient exclusivement à Ardentia. Cette décision est communiquée aux équipes dans un délai d'au moins vingt-quatre (24) heures avant le match concerné, sauf si les conditions météorologiques se dégradent de manière imprévisible dans les heures précédant le match, auquel cas la décision peut être prise plus tardivement.

-   En cas de forte pluie ou de conditions dangereuses : le match est annulé ou reporté par Ardentia.

-   En cas de pluie légère : le match se déroule comme prévu, sauf si l'arbitre, en concertation avec Ardentia, juge les conditions dangereuses ou le terrain impraticable.

# ARTICLE 18 — AUTRES CAS DE FIGURES

## 18.1 Abandon d'un match

Si une équipe abandonne son match sous forme de protestation contre une décision d'un arbitre ou d'un officiel du match, celle-ci sera qualifiée de perdante par forfait. Ainsi, elle perd son match 3-0.
`,Si=`Règlement officiel — Football 6 contre 6`;function Ci(){return[{id:`rulebook_v4`,version:`v4`,title:Si,date:`2026-11-09`,season_id:_i,content:xi,pdf_url:`/reglement/reglement-ardentia-v4.pdf`,status:`current`,changes:`Cumul des cartons jaunes : 3 jaunes = 1 match de suspension (Art. 11.5). Suspension d’au moins 1 match après un carton rouge, alourdie possible par Ardentia (Art. 11.6). Gardien : 4 secondes dans sa moitié de terrain (Art. 4.3).`},{id:`rulebook_v3`,version:`v3`,title:Si,date:`2026-11-09`,content:bi,pdf_url:`/reglement/reglement-ardentia-v3.pdf`,status:`archived`,changes:`Version remplacée par la v4 (les cartons ne se cumulaient pas d’un match à l’autre).`}]}function wi(e,t){let n=new Date(e+`T12:00:00`);return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}var Ti={league_phase:`Phase de ligue`,cup:`Cup`,group:`Phase de groupes`,round_of_16:`Huitièmes`,quarter:`Quarts de finale`,semi:`Demi-finales`,third_place:`Petite finale`,final:`Finale`},Ei={league_phase:`L`,cup:`C`,group:`G`,round_of_16:`R16`,quarter:`QF`,semi:`SF`,third_place:`3P`,final:`F`};function Di(e){let{qualifiers:t}=e,n=t>=16?`round_of_16`:t>=8?`quarter`:t>=4?`semi`:`final`,r=[];if(e.groupIds&&e.groupIds.length>1){let n=e.groupIds,i=Math.max(1,Math.floor(t/n.length)),a=(e,t)=>({type:`rank`,ref:e,rank:t});for(let e=0;e<n.length;e+=2){let t=n[e],o=n[e+1]??n[0];if(i===1)r.push(a(t,1),a(o,1));else for(let e=1;e+1<=i;e+=2)r.push(a(t,e),a(o,e+1),a(o,e),a(t,e+1))}}else{let n=e.leagueRef??e.groupIds?.[0]??`league`,i=Array.from({length:t},(e,t)=>t+1);for(let e=0;e<t/2;e++)r.push({type:`rank`,ref:n,rank:i[e]},{type:`rank`,ref:n,rank:i[t-1-e]})}let i=[],a=[`round_of_16`,`quarter`,`semi`,`final`],o=n,s=[],c=r.length/2;for(let e=0;e<c;e++){let t=`${Ei[o]}${e+1}`;i.push({stage:o,bracket_slot:t,home_source:r[2*e],away_source:r[2*e+1]}),s.push(t)}for(;o!==`final`;){let t=a[a.indexOf(o)+1],n=[];t===`final`&&e.thirdPlace&&s.length===2&&i.push({stage:`third_place`,bracket_slot:`3P`,home_source:{type:`loser`,ref:s[0]},away_source:{type:`loser`,ref:s[1]}});for(let e=0;e<s.length/2;e++){let r=t===`final`?`F`:`${Ei[t]}${e+1}`;i.push({stage:t,bracket_slot:r,home_source:{type:`winner`,ref:s[2*e]},away_source:{type:`winner`,ref:s[2*e+1]}}),n.push(r)}s=n,o=t}return i}function Oi(e,t){return e?e.type===`rank`?`${e.rank}${e.rank===1?`er`:`e`} ${t(e.ref)}`:`${e.type===`winner`?`Vainqueur`:`Perdant`} ${e.ref}`:`À déterminer`}var ki=r.format.playersOnPitch;ki-1,`${ki}${ki}`;function Ai(e,t){let n=e.starter_ids??[];if(n.length<=ki)return e;let r=new Map;for(let n of t)if(n.match_id===e.match_id)for(let e of[n.player_id,n.related_player_id])e&&r.set(e,(r.get(e)??0)+1);let i=e.goalkeeper_id&&n.includes(e.goalkeeper_id)?e.goalkeeper_id:void 0,a=n.filter(e=>e!==i).map((e,t)=>({id:e,i:t})).sort((e,t)=>(r.get(t.id)??0)-(r.get(e.id)??0)||e.i-t.i).map(e=>e.id),o=new Set([...i?[i]:[],...a].slice(0,ki));return{...e,starter_ids:n.filter(e=>o.has(e)),substitute_ids:[...n.filter(e=>!o.has(e)),...(e.substitute_ids??[]).filter(e=>!o.has(e))]}}var ji=[[`Mondial Services`,`MDS`,`#B3262E`,`#2A0A0C`],[`Distra`,`DST`,`#8CC63F`,`#13240A`],[`Dell`,`DEL`,`#0076CE`,`#062645`],[`Wafasalaf`,`WAF`,`#00A0B0`,`#04262A`],[`Atelier Vert Rabat`,`AVR`,`#4A7729`,`#0E1A08`],[`Arrow ECS`,`ARW`,`#D9DDE2`,`#1A1D21`],[`CAC`,`CAC`,`#2E5072`,`#0A1724`],[`Casa Vigilance`,`CVG`,`#F5B731`,`#0F2244`],[`Almav Group`,`ALM`,`#E30613`,`#2A0406`],[`Cooper Pharma`,`COP`,`#00A99D`,`#0A2A4F`],[`Chaabi LLD`,`CHL`,`#F26722`,`#2A1205`],[`Vivalis`,`VIV`,`#1A8DB5`,`#05202A`],[`Disway`,`DSW`,`#E8312F`,`#141414`],[`CTR`,`CTR`,`#3BB54A`,`#121A55`],[`Mega Post Tension`,`MPT`,`#1E90FF`,`#0A1E33`],[`Atelier Vert Casa`,`AVC`,`#4A7729`,`#0E1A08`]],Mi=[[0,`Youness`,`Kassed`,`FIELD`],[0,`Ayoub`,`Orch`,`FIELD`],[0,`Chakib`,`Achahboune`,`FIELD`],[0,`Youssef`,`Ait Mamaich`,`FIELD`],[0,`Zouheir`,`Chouaib`,`FIELD`],[0,`Molay Hicham`,`Darkaoui`,`FIELD`],[0,`Adam`,`Bouyou`,`FIELD`],[0,`Abderrahim`,`Elyoussoufi`,`FIELD`],[0,`Younes`,`Fouzi`,`FIELD`],[0,`Mohamed`,`Anifi`,`GK`],[0,`Achraf`,`Karii`,`GK`],[0,`Imad`,`Bousaad`,`FIELD`],[0,`Hicham`,`Chikh`,`FIELD`],[0,`Talati`,`Zakaria`,`FIELD`],[0,`Mohammed`,`Hoummane`,`FIELD`],[0,`Youssef`,`Zenasni`,`FIELD`],[8,`Samir`,`Bache`,`FIELD`],[8,`Elgraine`,`Walid`,`GK`],[8,`Badr`,`Damou`,`FIELD`],[8,`Yassine`,`Ait Messaoud`,`FIELD`],[8,`Mohammed`,`Amghar`,`FIELD`],[8,`Saad`,`Baba`,`GK`],[8,`Mahjoub`,`Laaouar`,`FIELD`],[8,`Karim`,`Adrab`,`FIELD`],[8,`Mohammed Amine`,`Jalal`,`FIELD`],[8,`Houssam`,`Mandour`,`FIELD`],[8,`Omar`,`Anajar`,`FIELD`],[8,`Mourad`,`Tizougarine`,`FIELD`],[8,`Houssine`,`Lebbar`,`FIELD`],[8,`Yassine`,`Adib`,`FIELD`],[8,`Tarik`,`Adib`,`FIELD`],[15,`Yassine`,`Jaafari`,`FIELD`],[15,`Ismail`,`Mokhtar`,`FIELD`],[15,`Hamza`,`Dany`,`FIELD`],[15,`Azzeddine`,`Fallate`,`FIELD`],[15,`Youssef`,`Tawil`,`FIELD`],[15,`Hatim`,`Lahbouki`,`FIELD`],[15,`Mohamed Amine`,`Haddia`,`FIELD`],[15,`Hamza`,`Klillan`,`FIELD`],[15,`Said`,`Ben Elmoubarik`,`FIELD`],[15,`Abdelilah`,`Ail`,`FIELD`],[15,`Oussama`,`Fakih`,`FIELD`],[15,`Abdelhadi`,`Azhar`,`GK`],[15,`Abdelmajid`,`El Medroum`,`FIELD`],[15,`Mohamed Amine`,`Idabbou`,`FIELD`],[15,`Ilyass`,`Ahrir`,`GK`],[4,`Brahim`,`Outrhous`,`FIELD`],[4,`Abdelmajid`,`Benhajji`,`FIELD`],[4,`Touhami`,`Tanani`,`FIELD`],[4,`Rachid`,`Outrhous`,`FIELD`],[4,`Said`,`Barouk`,`FIELD`],[4,`Nid Ahmed`,`Abderrahim`,`FIELD`],[4,`Ayoub`,`Khalid`,`FIELD`],[4,`Zouhair`,`Afakhar`,`FIELD`],[4,`Abdelkbir`,`Ighli`,`FIELD`],[4,`Hassan`,`Taibouch`,`GK`],[4,`Khalid`,`Amarir`,`FIELD`],[4,`Mohamed`,`Safouani`,`GK`],[4,`Lhassan`,`Azza`,`GK`],[10,`Karim`,`Mekki Berrada`,`FIELD`],[10,`Abdellatif`,`Boumahdi`,`FIELD`],[10,`Yassine`,`Kaddara`,`FIELD`],[10,`Abdelmoutalib`,`Chadli`,`FIELD`],[10,`Mouad`,`Maskine`,`FIELD`],[10,`Anas`,`Oirdi`,`FIELD`],[10,`Yahya`,`Rahmoun`,`FIELD`],[10,`Mohamed`,`Khalloudi`,`FIELD`],[10,`Abdelaziz`,`Moussaid`,`FIELD`],[10,`Adil`,`Doumari`,`GK`],[10,`Tarik`,`Zaibat`,`GK`],[10,`Oussama`,`El Qarni`,`FIELD`],[10,`Hamza`,`Achamakmaki`,`FIELD`],[12,`Abdelghani`,`Lamghari`,`FIELD`],[12,`Nassim`,`Mimide`,`GK`],[12,`Youness`,`El Karaoui`,`FIELD`],[12,`Mounir`,`Essadri`,`FIELD`],[12,`Maati`,`Tajani`,`FIELD`],[12,`Achraf`,`Sebky`,`FIELD`],[12,`El Karfi`,`Abdessamad`,`FIELD`],[12,`Rafia`,`Nourddine`,`FIELD`],[12,`Boumzough`,`Khalid`,`FIELD`],[12,`Jari`,`Zouhair`,`FIELD`],[12,`Ait Hanine`,`Ali`,`FIELD`],[12,`Hicham`,`Belkhattab`,`FIELD`],[12,`Youness`,`Adib`,`FIELD`],[2,`Najmeddine`,`Khalid`,`FIELD`],[2,`El Hamdouchi`,`Abdelilah`,`FIELD`],[2,`Sadani`,`Brahim`,`FIELD`],[2,`Bellamine`,`Lahcen`,`FIELD`],[2,`Salka`,`Hakim`,`FIELD`],[2,`Rida`,`Nabil`,`FIELD`],[2,`El Hafidi`,`Hamid`,`GK`],[2,`Halhoul`,`Mohamed`,`FIELD`],[2,`Harmane`,`Ismail`,`FIELD`],[2,`Assallimi`,`Said`,`FIELD`],[2,`Nssairy`,`Abdelali`,`GK`],[13,`Soufiane`,`Ait El Katib`,`FIELD`],[13,`Mohamed`,`Elmankouri`,`FIELD`],[13,`Walid`,`Semmami`,`GK`],[13,`Abdelkader`,`El Azzouzi`,`FIELD`],[13,`Redouane`,`Souiba`,`FIELD`],[13,`Youness`,`Lahroussi`,`FIELD`],[13,`Ilyass`,`Ait Lkatib`,`FIELD`],[13,`Dahmane`,`Oussama`,`FIELD`],[13,`Elhoucine`,`El Fakiry`,`FIELD`],[13,`Oussama`,`Dehmane`,`FIELD`],[13,`Omar`,`Agourram`,`FIELD`],[13,`Ayoub`,`Chohaili`,`FIELD`],[13,`Mustapha`,`El Maslouhi`,`FIELD`],[13,`Souhaib`,`Semlali`,`FIELD`],[13,`Yassine`,`Khalfane`,`FIELD`],[11,`Abdelkrim`,`Mahiri`,`GK`],[11,`Abdelali`,`Rguig`,`GK`],[11,`Mohammed`,`Youssoufi`,`FIELD`],[11,`Ilyass`,`Saoud`,`FIELD`],[11,`Omar`,`El Zaizi`,`FIELD`],[11,`El Mehdi`,`Bouddehbine`,`FIELD`],[11,`Ayoub`,`El Hamdaoui`,`FIELD`],[11,`Hamza`,`Kerdoud`,`FIELD`],[11,`Kamal`,`Bouabou`,`GK`],[11,`Adnane`,`Anik`,`FIELD`],[11,`Yassine`,`Elhachimi`,`FIELD`],[11,`Mohamed`,`Rejjaly`,`FIELD`],[11,`Zakaria`,`Handali`,`FIELD`],[11,`Hamza`,`El Hadani`,`FIELD`],[11,`Youssef`,`Berrada`,`FIELD`],[11,`Rida`,`Naim`,`FIELD`],[5,`Mohammed`,`Rharmili`,`GK`],[5,`Jad`,`Goaiche`,`GK`],[5,`Abdelkarim`,`Benabbess`,`FIELD`],[5,`Brahim`,`Chaiboub`,`FIELD`],[5,`Soufiane`,`Hanafi`,`FIELD`],[5,`Yassin`,`Moustakim`,`FIELD`],[5,`Ayoub`,`Dahaj`,`FIELD`],[5,`Faycal`,`Kerroumi`,`FIELD`],[5,`Zouhair`,`Nahed`,`FIELD`],[5,`Yassine`,`Filali`,`FIELD`],[5,`Ahmed`,`Lagzouli`,`FIELD`],[5,`Younes`,`Chaouby`,`FIELD`],[7,`Mohamed`,`Anani`,`FIELD`],[7,`Marouane`,`Sedraoui`,`GK`],[7,`Abdelghani`,`Fadil`,`FIELD`],[7,`Yassine`,`Basbassi`,`FIELD`],[7,`Mehdi`,`Kilam Idrissi`,`FIELD`],[7,`Adil`,`Mandour`,`FIELD`],[7,`Ismail`,`Jabrane`,`FIELD`],[7,`Redouane`,`Jdia`,`FIELD`],[7,`Bouchaib`,`Bouslam`,`FIELD`],[7,`Youssef`,`Moussaddak`,`FIELD`],[7,`Abdelaziz`,`Blala`,`GK`],[9,`Mohammed Amine`,`El Morabet`,`FIELD`],[9,`Adil`,`Ktaibi`,`GK`],[9,`Abdellah`,`Moradi`,`GK`],[9,`Hamza`,`Cheikh Lahlou`,`FIELD`],[9,`Hamza`,`Chafik`,`FIELD`],[9,`Issam`,`Agouz`,`FIELD`],[9,`Mouad`,`Afandi`,`FIELD`],[9,`Younes`,`Dkaky`,`FIELD`],[9,`Abdelali`,`Ourba`,`FIELD`],[9,`Hamza`,`Amrani`,`FIELD`],[9,`Hamza`,`Bakkali`,`FIELD`],[9,`Othmane`,`Bakkali`,`GK`],[9,`Mohamed Yassine`,`Nacab`,`FIELD`],[9,`Mounsef`,`Mouddane`,`FIELD`],[9,`Driss`,`Ghaidi`,`FIELD`],[9,`Abdoullah`,`Yassir`,`FIELD`],[6,`Baki`,`Said`,`GK`],[6,`El Haidi`,`Youssef`,`FIELD`],[6,`Jatti`,`Lahcen`,`FIELD`],[6,`El Karfi`,`Said`,`FIELD`],[6,`Ennafai`,`Karim`,`FIELD`],[6,`El Asri`,`Mohamed`,`FIELD`],[6,`Nahid`,`Chafiq`,`GK`],[6,`Nouredine`,`Rahla`,`FIELD`],[6,`Hammou Lahcen`,`Omar`,`FIELD`],[6,`Souhail`,`Adil`,`FIELD`],[6,`Ammad`,`Karim`,`FIELD`],[6,`Ali`,`El Kdime`,`FIELD`],[6,`Ait Lhaj`,`Khalid`,`FIELD`],[1,`Mohamed`,`Beladel`,`FIELD`],[1,`Abdellah`,`Ouachi`,`FIELD`],[1,`El Mehdi`,`Belhoussain`,`FIELD`],[1,`Mouheddine`,`Talimi`,`FIELD`],[1,`Abdessamad`,`Nafil`,`FIELD`],[1,`Omar`,`Moatazbillah`,`GK`],[1,`Younes`,`Lachker`,`FIELD`],[1,`Mohamed`,`Halioua`,`FIELD`],[1,`Ayoub`,`Sabah`,`FIELD`],[1,`El Hassan`,`Kari`,`FIELD`],[1,`Youssef`,`Kaltim`,`GK`],[3,`Badr`,`Naouar`,`FIELD`],[3,`Hamza`,`Bihi`,`GK`],[3,`Ali`,`Chbourk-El Idrissi`,`FIELD`],[3,`Hicham`,`El Abdellaoui`,`FIELD`],[3,`Anas`,`Lechheb`,`FIELD`],[3,`Noffel`,`Belallam`,`FIELD`],[3,`Amine`,`Oudkhmouche`,`FIELD`],[3,`Mohamed`,`Chamar`,`FIELD`],[3,`Mohamed`,`Berraida`,`FIELD`],[3,`Hamza`,`Sadiky`,`FIELD`],[3,`Youssef`,`Wahibi`,`FIELD`],[3,`Khalid`,`Amenzoui`,`FIELD`],[3,`Mohammed`,`El Harbili`,`FIELD`],[3,`Youssef`,`Guigui`,`FIELD`],[3,`Soufiane`,`Goumri`,`FIELD`],[3,`Mohamed`,`Jeddou`,`FIELD`],[14,`Mouad`,`Mansor`,`FIELD`],[14,`Ilias`,`Karma`,`GK`],[14,`Nabil`,`El Baggar`,`FIELD`],[14,`Zaid`,`Ouhra`,`FIELD`],[14,`Amine`,`Benhayya`,`FIELD`],[14,`Fouad`,`Chalali`,`FIELD`],[14,`Othmane`,`Mamouni`,`FIELD`],[14,`Moncef`,`Essaadaoui`,`FIELD`],[14,`Abd Lhakim`,`Dahbi`,`FIELD`],[14,`Marouane`,`El Yabani`,`FIELD`],[6,`L.`,`Ali`,`FIELD`],[0,`Z.`,`Talati`,`FIELD`],[15,`M.`,`Jamali`,`FIELD`],[15,`A.`,`Dghoughi`,`GK`],[4,`A.`,`Taibouch`,`GK`],[13,`S.`,`Oussama`,`FIELD`]],Ni=[[1,1,9,3,3,2,[[0,`g`,150,2],[1,`g`,190,2],[0,`g`,152,1],[0,`a`,150,1],[1,`a`,196,1],[0,`a`,155,2],[0,`s`,152,11],[1,`s`,191,9],[0,`y`,150,1],[1,`y`,193,1],[0,`y`,157,1],[1,`r`,196,1]]],[2,1,11,1,2,4,[[0,`g`,115,1],[1,`g`,185,3],[0,`g`,118,1],[1,`g`,180,1],[0,`a`,114,1],[1,`a`,180,1],[1,`a`,183,1],[0,`s`,111,15],[1,`s`,186,10],[0,`y`,115,1],[1,`y`,183,1],[0,`r`,114,1]]],[3,1,8,10,5,7,[[0,`g`,26,4],[1,`g`,64,4],[0,`g`,29,1],[1,`g`,63,1],[1,`g`,70,1],[1,`g`,71,1],[0,`a`,26,1],[1,`a`,65,3],[0,`a`,19,2],[1,`a`,64,1],[0,`a`,17,1],[1,`a`,70,1],[0,`s`,17,9],[1,`s`,69,9],[1,`y`,62,1],[1,`y`,65,1]]],[4,1,4,14,6,2,[[0,`g`,51,3],[1,`g`,209,1],[0,`g`,54,2],[1,`g`,211,1],[0,`g`,50,1],[0,`a`,54,4],[1,`a`,211,1],[0,`a`,53,2],[1,`a`,212,1],[0,`s`,57,9],[1,`s`,207,8]]],[5,1,12,2,3,3,[[0,`g`,72,2],[1,`g`,88,1],[0,`g`,83,1],[1,`g`,90,1],[1,`g`,89,1],[0,`a`,83,1],[1,`a`,86,2],[0,`s`,73,11],[1,`s`,91,1],[0,`y`,77,1],[1,`y`,91,1],[0,`y`,84,1]]],[6,1,6,13,3,1,[[0,`g`,167,1],[1,`g`,106,1],[0,`g`,172,1],[0,`g`,176,1],[0,`a`,216,1],[0,`s`,166,11],[1,`s`,98,9],[0,`y`,175,1],[1,`y`,106,1]]],[7,1,7,0,3,3,[[0,`g`,144,2],[1,`g`,1,2],[0,`g`,142,1],[1,`g`,217,1],[0,`a`,147,2],[1,`a`,217,2],[0,`a`,149,1],[0,`s`,140,13],[1,`s`,10,19],[0,`y`,147,1],[1,`y`,10,1]]],[8,1,15,5,5,13,[[0,`g`,36,2],[1,`g`,131,3],[0,`g`,33,1],[1,`g`,132,2],[0,`g`,34,1],[1,`g`,127,2],[0,`g`,37,1],[1,`g`,137,2],[1,`g`,130,1],[1,`g`,133,1],[1,`g`,135,1],[1,`g`,134,1],[0,`a`,33,1],[1,`a`,133,2],[1,`a`,131,2],[1,`a`,127,1],[1,`a`,130,1],[1,`a`,135,1],[1,`a`,132,1],[0,`s`,42,13],[1,`s`,128,16],[0,`y`,44,1]]],[9,2,6,1,3,5,[[0,`g`,178,3],[1,`g`,183,2],[1,`g`,185,2],[1,`g`,179,1],[0,`a`,170,1],[1,`a`,180,1],[0,`a`,176,1],[1,`a`,183,2],[1,`a`,185,2],[0,`s`,166,9],[1,`s`,186,9],[0,`y`,167,1],[0,`y`,170,1],[0,`y`,176,1],[0,`y`,178,1]]],[10,2,4,13,6,2,[[0,`g`,54,3],[1,`g`,106,1],[0,`g`,50,1],[1,`g`,107,1],[0,`g`,47,1],[0,`g`,53,1],[0,`a`,51,2],[0,`a`,47,1],[0,`a`,54,1],[0,`s`,57,10],[1,`s`,98,13]]],[11,2,9,14,4,2,[[0,`g`,150,1],[1,`g`,211,1],[0,`g`,155,1],[1,`g`,213,1],[0,`g`,157,1],[0,`g`,158,1],[0,`a`,158,2],[1,`a`,209,2],[0,`a`,155,1],[0,`s`,152,11],[1,`s`,207,17]]],[12,2,15,10,0,7,[[1,`g`,64,2],[1,`g`,71,1],[1,`g`,65,4],[1,`a`,62,1],[1,`a`,63,1],[1,`a`,64,2],[1,`a`,66,2],[0,`s`,42,7],[1,`s`,69,9],[1,`y`,65,1]]],[13,2,2,5,3,6,[[0,`g`,88,1],[1,`g`,130,1],[0,`g`,90,2],[1,`g`,131,1],[1,`g`,132,1],[1,`g`,133,1],[1,`g`,134,1],[1,`g`,136,1],[0,`a`,88,1],[1,`a`,130,2],[1,`a`,132,1],[1,`a`,131,1],[1,`a`,134,1],[1,`a`,127,1],[0,`s`,91,8],[1,`s`,128,5],[1,`y`,128,1],[1,`y`,131,1]]],[14,2,11,0,3,7,[[0,`g`,118,2],[1,`g`,1,2],[0,`g`,124,1],[1,`g`,4,1],[1,`g`,5,1],[1,`g`,6,1],[1,`g`,7,1],[1,`g`,9,1],[1,`a`,4,1],[1,`a`,7,2],[1,`a`,8,1],[0,`s`,111,12],[1,`s`,9,19],[1,`y`,5,1],[1,`y`,4,1]]],[15,2,8,3,3,4,[[0,`g`,18,1],[1,`g`,190,2],[0,`g`,26,2],[1,`g`,196,2],[0,`a`,27,1],[1,`a`,201,2],[1,`a`,197,1],[0,`s`,21,12],[1,`s`,191,9],[1,`y`,197,1]]],[16,2,12,7,4,3,[[0,`g`,72,3],[1,`g`,141,1],[0,`g`,74,1],[1,`g`,143,2],[0,`a`,79,1],[0,`s`,73,21],[1,`s`,140,15],[0,`y`,79,1],[1,`y`,140,1],[0,`y`,81,1],[1,`y`,141,1],[1,`y`,143,1]]],[17,3,15,3,2,16,[[0,`g`,40,1],[1,`g`,190,9],[0,`g`,218,1],[1,`g`,196,6],[1,`g`,194,1],[0,`a`,32,1],[1,`a`,190,3],[1,`a`,196,1],[1,`a`,203,2],[0,`s`,42,12],[1,`s`,191,15],[0,`y`,32,1]]],[18,3,10,5,2,3,[[0,`g`,63,1],[1,`g`,131,2],[0,`g`,65,1],[1,`g`,129,1],[0,`a`,67,1],[1,`a`,127,1],[1,`a`,129,1],[0,`s`,69,12],[1,`s`,128,10],[1,`r`,128,1]]],[19,3,6,0,3,3,[[0,`g`,167,1],[1,`g`,1,3],[0,`g`,176,1],[0,`g`,177,1],[0,`a`,175,1],[1,`a`,13,1],[0,`a`,169,1],[0,`s`,166,13],[1,`s`,10,14],[0,`y`,169,1],[1,`y`,1,1]]],[20,3,4,1,4,9,[[0,`g`,50,1],[1,`g`,185,4],[0,`g`,51,1],[1,`g`,183,2],[0,`g`,53,1],[1,`g`,186,2],[0,`g`,54,1],[1,`g`,187,1],[0,`a`,50,1],[1,`a`,179,3],[0,`a`,54,1],[1,`a`,181,1],[1,`a`,183,1],[1,`a`,185,1],[0,`s`,57,20],[1,`s`,189,20]]],[21,3,9,13,7,2,[[0,`g`,150,2],[1,`g`,110,2],[0,`g`,155,2],[0,`g`,158,2],[0,`g`,157,1],[0,`a`,155,2],[1,`a`,104,1],[0,`a`,157,1],[1,`a`,106,1],[0,`a`,158,3],[0,`s`,152,15],[1,`s`,98,15],[1,`y`,106,1],[1,`y`,101,1]]],[22,3,8,14,5,5,[[0,`g`,26,2],[1,`g`,206,4],[0,`g`,24,1],[1,`g`,210,1],[0,`g`,27,1],[0,`g`,18,1],[0,`a`,26,2],[1,`a`,210,3],[0,`a`,27,1],[0,`a`,19,1],[0,`s`,17,17],[1,`s`,207,13],[0,`y`,26,1]]],[23,3,12,11,5,3,[[0,`g`,72,2],[1,`g`,114,2],[0,`g`,73,1],[1,`g`,116,1],[0,`g`,79,1],[0,`g`,83,1],[0,`a`,72,3],[1,`a`,116,1],[1,`a`,115,1],[0,`s`,73,15],[1,`s`,112,15],[0,`y`,83,1],[1,`y`,116,1]]],[24,3,2,7,4,4,[[0,`g`,85,1],[1,`g`,147,2],[0,`g`,88,2],[1,`g`,142,1],[0,`g`,91,1],[1,`g`,149,1],[0,`a`,90,2],[1,`a`,144,4],[0,`a`,91,2],[0,`s`,91,10],[1,`s`,140,15],[0,`y`,91,1],[1,`y`,142,1]]],[25,4,8,13,7,3,[[0,`g`,19,3],[1,`g`,104,1],[0,`g`,26,3],[1,`g`,106,2],[0,`g`,27,1],[0,`a`,16,1],[1,`a`,104,2],[0,`a`,18,1],[0,`a`,19,1],[0,`a`,24,1],[0,`a`,27,1],[0,`s`,21,15],[1,`s`,98,11],[0,`y`,27,1],[1,`y`,97,1]]],[26,4,9,1,5,3,[[0,`g`,155,2],[1,`g`,185,1],[0,`g`,158,1],[1,`g`,186,1],[0,`g`,162,1],[1,`g`,181,1],[0,`g`,164,1],[0,`a`,158,1],[1,`a`,183,2],[0,`a`,162,1],[1,`a`,181,1],[0,`s`,152,17],[1,`s`,184,20],[1,`y`,185,2],[1,`y`,183,1],[1,`r`,185,1]]],[27,4,15,14,2,15,[[0,`g`,32,1],[1,`g`,206,8],[0,`g`,36,1],[1,`g`,207,1],[1,`g`,209,3],[1,`g`,210,1],[1,`g`,211,2],[0,`a`,36,1],[1,`a`,206,1],[1,`a`,209,3],[1,`a`,210,4],[1,`a`,211,2],[0,`s`,42,15],[1,`s`,206,12],[0,`y`,34,1]]],[28,4,4,0,3,11,[[0,`g`,46,1],[1,`g`,1,7],[0,`g`,54,1],[1,`g`,15,3],[0,`g`,51,1],[1,`g`,13,1],[0,`a`,51,1],[1,`a`,1,1],[1,`a`,4,1],[1,`a`,8,1],[1,`a`,10,1],[1,`a`,12,2],[1,`a`,13,4],[0,`s`,57,16],[1,`s`,10,13],[1,`y`,1,1]]],[29,4,10,3,2,5,[[0,`g`,63,1],[1,`g`,190,1],[0,`g`,70,1],[1,`g`,194,1],[1,`g`,196,2],[1,`g`,202,1],[0,`a`,67,1],[1,`a`,190,1],[1,`a`,201,3],[0,`s`,69,15],[1,`s`,191,13],[1,`y`,196,1],[1,`y`,201,1]]],[30,4,7,5,3,4,[[1,`g`,130,1],[0,`g`,147,1],[1,`g`,131,1],[0,`g`,145,2],[1,`g`,135,1],[1,`g`,138,1],[0,`a`,144,1],[1,`a`,133,1],[1,`a`,138,2],[0,`s`,149,12],[1,`s`,127,16],[0,`y`,145,1],[1,`y`,132,1],[1,`y`,133,1],[1,`y`,137,1],[1,`y`,135,1]]],[31,4,12,6,6,5,[[0,`g`,72,3],[1,`g`,167,1],[0,`g`,74,1],[1,`g`,168,1],[0,`g`,76,2],[1,`g`,176,1],[1,`g`,177,2],[0,`a`,74,1],[1,`a`,167,1],[0,`a`,79,1],[1,`a`,168,1],[0,`a`,83,2],[1,`a`,169,1],[0,`s`,73,18],[1,`s`,166,17],[0,`y`,72,1],[1,`y`,166,1],[0,`y`,74,1],[1,`y`,176,1],[1,`y`,178,1]]],[32,4,2,11,null,null,[]],[33,5,3,5,8,4,[[0,`g`,190,3],[1,`g`,131,3],[0,`g`,196,3],[1,`g`,127,1],[0,`g`,201,2],[0,`a`,190,3],[1,`a`,127,2],[0,`a`,196,1],[0,`a`,201,1],[0,`s`,191,20],[1,`s`,127,5],[0,`y`,201,1]]],[34,5,9,0,1,4,[[0,`g`,155,1],[1,`g`,1,3],[1,`g`,13,1],[1,`a`,1,1],[1,`a`,4,2],[0,`s`,152,18],[1,`s`,9,19],[1,`y`,13,1],[0,`r`,150,1]]],[35,5,8,1,1,5,[[0,`g`,29,1],[1,`g`,186,3],[1,`g`,180,1],[1,`g`,181,1],[1,`a`,180,2],[1,`a`,183,2],[1,`a`,181,1],[0,`s`,21,12],[1,`s`,184,13]]],[36,5,2,6,5,3,[[0,`g`,88,4],[1,`g`,176,3],[0,`g`,90,1],[0,`a`,89,2],[1,`a`,177,1],[0,`s`,91,15],[1,`s`,166,10],[1,`y`,172,1],[0,`r`,90,1]]],[37,5,12,4,7,7,[[0,`g`,72,5],[1,`g`,53,3],[0,`g`,74,1],[1,`g`,54,2],[0,`g`,76,1],[1,`g`,52,2],[0,`a`,79,2],[1,`a`,50,2],[0,`a`,72,1],[1,`a`,46,1],[0,`a`,76,1],[1,`a`,53,1],[1,`a`,51,1],[0,`s`,73,8],[1,`s`,57,11]]],[38,5,7,11,5,3,[[0,`g`,147,2],[1,`g`,115,1],[0,`g`,145,1],[1,`g`,116,1],[0,`g`,140,1],[1,`g`,124,1],[0,`g`,139,1],[0,`a`,144,3],[1,`a`,111,1],[0,`a`,147,1],[1,`a`,113,1],[1,`a`,115,1],[0,`s`,140,15],[1,`s`,113,1],[0,`y`,140,1],[1,`y`,117,1],[0,`y`,147,1]]],[39,5,10,14,3,1,[[0,`g`,62,2],[1,`g`,211,1],[0,`g`,70,1],[0,`a`,64,1],[0,`a`,65,1],[0,`a`,66,1],[0,`s`,68,23],[1,`s`,207,18],[0,`y`,70,1]]],[40,5,15,13,3,8,[[0,`g`,36,2],[1,`g`,96,4],[0,`g`,40,1],[1,`g`,106,3],[1,`g`,107,1],[0,`a`,218,1],[1,`a`,107,3],[1,`a`,104,2],[1,`a`,96,1],[0,`s`,42,9],[1,`s`,98,10],[0,`y`,36,1]]],[41,6,7,6,4,5,[[0,`g`,142,1],[1,`g`,171,4],[0,`g`,144,1],[1,`g`,168,1],[0,`g`,147,1],[0,`g`,148,1],[0,`a`,144,3],[1,`a`,168,1],[1,`a`,169,1],[0,`s`,140,18],[1,`s`,166,18],[1,`y`,171,1],[1,`y`,172,1]]],[42,6,8,0,2,6,[[0,`g`,26,2],[1,`g`,1,2],[1,`g`,4,1],[1,`g`,13,1],[1,`g`,14,2],[0,`a`,19,1],[1,`a`,13,1],[1,`a`,9,1],[1,`a`,1,1],[0,`s`,21,18],[1,`s`,9,9],[0,`y`,16,1],[1,`y`,12,1],[1,`y`,14,1]]],[43,6,12,9,null,null,[]],[44,6,11,5,3,2,[[0,`g`,114,2],[1,`g`,127,1],[0,`g`,115,1],[1,`g`,138,1],[1,`a`,131,1],[1,`a`,135,1],[0,`s`,113,7],[1,`s`,128,9],[0,`y`,114,1],[1,`y`,128,1],[0,`y`,111,1],[1,`y`,135,1]]],[45,6,2,4,6,4,[[0,`g`,85,2],[1,`g`,50,1],[0,`g`,86,1],[1,`g`,51,1],[0,`g`,88,2],[1,`g`,54,1],[0,`g`,92,1],[1,`g`,52,1],[0,`a`,88,4],[1,`a`,53,2],[0,`a`,89,1],[1,`a`,51,1],[0,`a`,92,1],[1,`a`,52,1],[0,`s`,91,22],[1,`s`,57,13]]],[46,6,15,1,0,8,[[1,`g`,185,4],[1,`g`,183,1],[1,`g`,180,1],[1,`g`,179,2],[1,`a`,180,1],[1,`a`,183,4],[1,`a`,185,2],[1,`a`,188,1],[0,`s`,42,10],[1,`s`,184,10],[0,`y`,40,1],[1,`y`,188,1]]],[47,6,10,13,8,2,[[0,`g`,64,2],[1,`g`,96,1],[0,`g`,63,2],[1,`g`,110,1],[0,`g`,65,2],[0,`g`,66,2],[0,`a`,62,1],[1,`a`,96,1],[0,`a`,63,2],[1,`a`,110,1],[0,`a`,64,2],[0,`a`,65,1],[0,`a`,70,1],[0,`s`,69,10],[1,`s`,98,14],[0,`y`,71,1],[0,`y`,66,1]]],[48,6,3,14,9,3,[[0,`g`,190,6],[1,`g`,206,3],[0,`g`,196,1],[0,`g`,197,1],[0,`g`,201,1],[0,`a`,190,1],[1,`a`,210,1],[0,`a`,196,1],[0,`a`,197,1],[0,`a`,202,1],[0,`a`,201,2],[0,`s`,191,14],[1,`s`,207,15],[1,`y`,206,1]]],[49,7,12,8,3,4,[[0,`g`,73,1],[1,`g`,26,3],[0,`g`,74,1],[1,`g`,19,1],[0,`g`,84,1],[0,`a`,83,1],[1,`a`,18,1],[0,`s`,73,23],[1,`s`,27,24],[1,`y`,21,1],[1,`y`,27,1]]],[50,7,14,5,2,8,[[0,`g`,210,1],[1,`g`,131,4],[0,`g`,211,1],[1,`g`,130,2],[1,`g`,132,1],[1,`g`,138,1],[0,`a`,210,1],[1,`a`,131,2],[1,`a`,130,2],[1,`a`,129,2],[1,`a`,138,1],[0,`s`,207,19],[1,`s`,128,16]]],[51,7,7,4,10,14,[[0,`g`,147,6],[1,`g`,53,5],[0,`g`,146,3],[1,`g`,50,3],[0,`g`,144,1],[1,`g`,51,2],[1,`g`,54,2],[1,`g`,52,2],[0,`a`,144,7],[1,`a`,54,5],[0,`a`,139,2],[1,`a`,53,2],[0,`a`,147,1],[0,`s`,140,16],[1,`s`,54,20],[0,`y`,140,1]]],[52,7,2,9,null,null,[]],[53,7,15,0,2,19,[[0,`g`,36,1],[1,`g`,1,10],[0,`g`,41,1],[1,`g`,6,3],[1,`g`,5,2],[1,`g`,4,1],[1,`g`,9,1],[1,`g`,13,1],[1,`g`,14,1],[0,`a`,41,1],[1,`a`,13,5],[1,`a`,4,4],[1,`a`,1,3],[1,`a`,6,4],[1,`a`,5,2],[0,`s`,42,23],[1,`s`,9,12]]],[54,7,11,6,2,5,[[0,`g`,111,1],[1,`g`,176,5],[0,`g`,116,1],[0,`a`,113,1],[1,`a`,175,1],[1,`a`,178,1],[1,`a`,173,1],[0,`s`,113,16],[1,`s`,166,12],[0,`y`,114,1]]],[55,7,3,13,6,5,[[0,`g`,196,5],[1,`g`,104,2],[0,`g`,190,1],[1,`g`,106,2],[1,`g`,96,1],[0,`a`,197,3],[1,`a`,102,3],[0,`a`,190,1],[0,`a`,194,1],[0,`a`,201,1],[1,`s`,98,20],[1,`y`,98,1]]],[56,7,10,1,1,11,[[0,`g`,62,1],[1,`g`,185,4],[1,`g`,179,2],[1,`g`,181,2],[1,`g`,186,2],[1,`g`,187,1],[0,`a`,71,1],[1,`a`,183,4],[1,`a`,181,1],[1,`a`,185,1],[1,`a`,187,1],[0,`s`,68,20],[1,`s`,184,14],[0,`r`,63,1]]],[57,8,6,5,2,0,[[0,`g`,171,1],[0,`g`,176,1],[0,`a`,173,2],[0,`s`,166,17],[1,`s`,128,16],[0,`y`,173,1],[1,`y`,128,1],[0,`y`,171,1],[1,`y`,133,1]]],[58,8,10,0,5,12,[[0,`g`,62,2],[1,`g`,1,6],[0,`g`,64,1],[1,`g`,8,1],[0,`g`,70,1],[1,`g`,13,1],[0,`g`,71,1],[1,`g`,14,4],[0,`a`,61,1],[1,`a`,1,3],[0,`a`,62,1],[1,`a`,13,4],[0,`a`,64,2],[1,`a`,14,1],[0,`s`,69,6],[1,`s`,9,11],[0,`y`,62,1]]],[59,8,3,1,5,5,[[0,`g`,190,3],[1,`g`,183,2],[0,`g`,196,1],[1,`g`,185,2],[0,`g`,202,1],[1,`g`,186,1],[0,`a`,197,1],[1,`a`,183,1],[0,`s`,191,18],[1,`s`,184,10],[0,`y`,199,1]]],[60,8,14,13,6,8,[[0,`g`,209,3],[1,`g`,96,1],[0,`g`,210,1],[1,`g`,104,1],[0,`g`,211,2],[1,`g`,106,2],[1,`g`,110,2],[1,`g`,102,2],[0,`a`,210,1],[1,`a`,104,2],[0,`a`,211,1],[1,`a`,106,1],[0,`a`,214,1],[1,`a`,110,1],[1,`a`,102,1],[0,`s`,207,24],[1,`s`,98,12],[0,`y`,210,1]]],[61,8,12,15,18,7,[[0,`g`,72,11],[1,`g`,39,2],[0,`g`,74,1],[1,`g`,40,1],[0,`g`,76,3],[1,`g`,41,3],[0,`g`,77,3],[1,`g`,42,1],[0,`a`,72,2],[1,`a`,40,1],[0,`a`,74,4],[1,`a`,41,1],[0,`a`,76,1],[1,`a`,39,1],[0,`a`,83,4],[0,`a`,73,1],[0,`s`,73,18],[1,`s`,42,16]]],[62,8,7,9,9,8,[[0,`g`,139,1],[1,`g`,150,2],[0,`g`,145,1],[1,`g`,157,3],[0,`g`,147,3],[1,`g`,158,3],[0,`g`,149,2],[0,`g`,146,2],[0,`a`,145,2],[1,`a`,150,1],[0,`a`,147,1],[1,`a`,152,1],[1,`a`,155,2],[1,`a`,157,1],[1,`a`,158,1],[1,`a`,165,1],[0,`s`,145,5],[1,`s`,152,10],[0,`s`,149,6],[0,`y`,145,1]]],[63,8,2,8,5,1,[[0,`g`,85,1],[1,`g`,26,1],[0,`g`,89,1],[0,`g`,90,3],[0,`a`,88,2],[1,`a`,19,1],[0,`a`,89,1],[0,`s`,91,13],[1,`s`,17,15],[0,`y`,90,1],[1,`y`,26,1],[0,`y`,87,1]]],[64,8,11,4,6,11,[[0,`g`,113,1],[1,`g`,50,1],[0,`g`,114,3],[1,`g`,51,2],[0,`g`,116,1],[1,`g`,52,1],[0,`g`,119,1],[1,`g`,54,4],[1,`g`,53,3],[0,`a`,113,2],[1,`a`,46,1],[0,`a`,116,1],[1,`a`,51,2],[0,`a`,119,1],[1,`a`,53,1],[1,`a`,54,1],[0,`s`,119,14],[1,`s`,58,13],[0,`y`,121,1]]],[65,9,12,10,3,6,[[0,`g`,72,1],[1,`g`,62,2],[0,`g`,82,1],[1,`g`,63,1],[0,`g`,83,1],[1,`g`,66,2],[1,`g`,69,1],[0,`a`,83,1],[1,`a`,62,1],[1,`a`,63,2],[1,`a`,69,1],[0,`s`,73,11],[1,`s`,68,20],[0,`y`,72,1],[1,`y`,69,1]]],[66,9,13,5,6,8,[[0,`g`,102,4],[1,`g`,130,4],[0,`g`,96,1],[1,`g`,132,2],[0,`g`,106,1],[1,`g`,131,1],[1,`g`,138,1],[0,`a`,96,2],[1,`a`,131,3],[0,`a`,102,1],[1,`a`,133,2],[0,`a`,110,1],[1,`a`,130,1],[1,`a`,132,1],[0,`s`,98,20],[1,`s`,127,20],[1,`y`,131,1]]],[67,9,11,9,1,5,[[0,`g`,115,1],[1,`g`,158,3],[1,`g`,150,1],[1,`g`,156,1],[0,`a`,111,1],[1,`a`,155,2],[1,`a`,158,2],[0,`s`,111,15],[1,`s`,151,20]]],[68,9,6,4,8,7,[[0,`g`,176,3],[1,`g`,54,3],[0,`g`,167,2],[1,`g`,53,2],[0,`g`,173,1],[1,`g`,51,1],[0,`g`,175,1],[1,`g`,50,1],[0,`g`,177,1],[0,`a`,173,3],[1,`a`,54,2],[0,`a`,178,2],[1,`a`,51,2],[0,`a`,176,2],[1,`a`,50,1],[0,`a`,167,1],[1,`a`,53,1],[1,`a`,52,1],[0,`s`,166,22],[1,`s`,58,12],[0,`y`,166,1],[0,`y`,173,1]]],[69,9,14,1,2,8,[[0,`g`,206,1],[1,`g`,185,3],[0,`g`,210,1],[1,`g`,180,2],[1,`g`,181,2],[1,`g`,183,1],[0,`a`,211,1],[1,`a`,183,3],[0,`a`,209,1],[1,`a`,180,2],[1,`a`,187,1],[1,`a`,181,1],[1,`a`,186,1],[0,`s`,207,20],[1,`s`,184,15],[1,`y`,186,1]]],[70,9,2,15,14,2,[[0,`g`,90,5],[1,`g`,36,1],[0,`g`,88,5],[1,`g`,41,1],[0,`g`,86,1],[0,`g`,92,1],[0,`g`,89,1],[0,`g`,87,1],[0,`a`,87,3],[1,`a`,41,1],[0,`a`,89,3],[0,`a`,90,3],[0,`a`,88,2],[0,`a`,86,1],[0,`a`,92,1],[0,`s`,95,10],[1,`s`,219,17],[0,`y`,90,1],[1,`y`,41,1]]],[71,9,3,0,2,3,[[0,`g`,190,2],[1,`g`,1,2],[1,`g`,13,1],[0,`a`,196,1],[1,`a`,4,1],[1,`a`,14,1],[1,`a`,13,1],[0,`s`,191,19],[1,`s`,9,10],[0,`y`,201,1],[1,`y`,1,1],[1,`y`,9,1],[1,`y`,13,1],[1,`y`,14,1]]],[72,9,7,8,2,2,[[0,`g`,147,2],[1,`g`,18,1],[1,`g`,26,1],[0,`a`,144,1],[1,`a`,19,1],[1,`a`,26,1],[0,`s`,149,15],[1,`s`,21,20],[0,`r`,145,1],[1,`r`,16,1]]],[73,10,12,3,0,3,[[1,`og`,-1,3]]],[74,10,2,10,7,4,[[0,`g`,90,2],[1,`g`,65,3],[0,`g`,85,1],[1,`g`,71,1],[0,`g`,89,4],[0,`a`,85,1],[1,`a`,62,2],[0,`a`,86,1],[1,`a`,70,1],[0,`a`,88,1],[0,`a`,91,1],[0,`s`,91,14],[1,`s`,69,8],[1,`y`,62,1],[1,`y`,65,1]]],[75,10,7,15,12,5,[[0,`g`,139,1],[1,`g`,34,2],[0,`g`,145,2],[1,`g`,41,1],[0,`g`,144,3],[1,`g`,40,2],[0,`g`,147,5],[0,`g`,149,1],[0,`a`,139,1],[1,`a`,34,1],[0,`a`,144,7],[1,`a`,41,1],[0,`a`,147,1],[1,`a`,40,1],[0,`a`,149,2],[0,`s`,149,12],[1,`s`,42,12]]],[76,10,11,8,6,2,[[0,`g`,116,1],[1,`g`,29,2],[0,`g`,120,2],[0,`g`,113,3],[0,`a`,116,1],[1,`a`,26,1],[0,`a`,120,1],[0,`s`,112,13],[1,`s`,17,6]]],[77,10,6,9,4,5,[[0,`g`,168,1],[1,`g`,150,1],[0,`g`,169,1],[1,`g`,152,1],[0,`g`,176,1],[1,`g`,155,2],[0,`g`,173,1],[1,`g`,158,1],[0,`a`,168,2],[1,`a`,152,1],[0,`a`,172,1],[1,`a`,155,1],[0,`a`,173,1],[1,`a`,158,1],[0,`s`,172,20],[1,`s`,152,16],[0,`y`,178,1],[1,`y`,155,1],[0,`r`,173,1]]],[78,10,13,1,6,9,[[0,`g`,96,1],[1,`g`,180,3],[0,`g`,104,1],[1,`g`,183,1],[0,`g`,106,1],[1,`g`,185,3],[0,`g`,102,2],[1,`g`,187,1],[0,`og`,-1,1],[1,`g`,184,1],[0,`a`,104,2],[1,`a`,183,4],[0,`s`,98,23],[1,`s`,184,15],[0,`y`,106,1],[1,`y`,187,1],[0,`y`,98,1],[1,`y`,184,1]]],[79,10,14,0,3,12,[[0,`g`,206,2],[1,`g`,1,7],[0,`g`,210,1],[1,`g`,4,2],[1,`g`,5,1],[1,`g`,9,1],[1,`g`,15,1],[0,`a`,209,1],[1,`a`,1,3],[0,`a`,210,1],[1,`a`,4,3],[0,`a`,213,1],[1,`a`,9,1],[1,`a`,14,3],[1,`a`,15,1],[0,`s`,207,11],[1,`s`,9,10],[0,`y`,206,1]]],[80,10,4,5,10,9,[[0,`g`,50,4],[0,`g`,51,1],[1,`g`,128,2],[0,`g`,53,2],[1,`g`,130,3],[0,`g`,54,3],[1,`g`,131,2],[1,`g`,133,1],[1,`g`,138,1],[0,`a`,50,1],[1,`a`,127,1],[0,`a`,51,1],[1,`a`,128,1],[0,`a`,54,2],[1,`a`,130,1],[1,`a`,131,1],[1,`a`,132,2],[0,`s`,52,15],[1,`s`,128,17],[0,`y`,50,1],[1,`y`,132,1]]],[81,11,12,14,9,4,[[0,`g`,72,5],[1,`g`,206,2],[0,`g`,84,2],[1,`g`,210,1],[0,`g`,83,1],[1,`g`,214,1],[0,`g`,79,1],[0,`a`,74,3],[1,`a`,211,1],[0,`a`,83,2],[0,`a`,72,1],[0,`s`,73,11],[1,`s`,207,12],[0,`y`,72,1]]],[82,11,2,3,8,4,[[0,`g`,88,2],[1,`g`,196,2],[0,`g`,90,2],[1,`g`,190,1],[0,`g`,92,2],[1,`g`,197,1],[0,`g`,85,1],[0,`g`,86,1],[0,`a`,88,3],[1,`a`,190,2],[0,`a`,90,2],[1,`a`,196,1],[0,`a`,91,2],[0,`a`,85,1],[0,`s`,91,13],[1,`s`,191,15],[0,`y`,92,1]]],[83,11,4,9,10,7,[[0,`g`,53,4],[1,`g`,150,2],[0,`g`,50,3],[1,`g`,155,2],[0,`g`,51,2],[1,`g`,156,2],[0,`g`,54,1],[1,`g`,162,1],[0,`a`,51,5],[1,`a`,150,2],[0,`a`,54,2],[1,`a`,155,2],[0,`a`,50,1],[1,`a`,163,1],[0,`s`,220,20],[1,`s`,152,10],[1,`s`,158,11],[0,`y`,51,1]]],[84,11,11,15,10,5,[[0,`g`,116,4],[1,`g`,34,4],[0,`g`,113,2],[1,`g`,41,1],[0,`g`,114,2],[0,`g`,115,2],[0,`a`,114,4],[1,`a`,41,3],[0,`a`,113,2],[1,`a`,36,2],[0,`a`,116,1],[0,`a`,120,1],[0,`s`,112,10],[1,`s`,45,13],[1,`y`,34,1]]],[85,11,6,8,3,1,[[0,`g`,177,1],[1,`g`,26,1],[0,`g`,178,1],[0,`g`,175,1],[0,`a`,169,1],[1,`a`,25,1],[0,`s`,166,20],[1,`s`,21,15],[0,`y`,169,1]]],[86,11,7,10,7,4,[[0,`g`,144,3],[1,`g`,64,2],[0,`g`,147,3],[1,`g`,65,1],[0,`g`,146,1],[1,`g`,69,1],[0,`a`,144,3],[1,`a`,71,1],[0,`a`,139,1],[1,`a`,69,1],[0,`a`,146,1],[1,`a`,65,1],[0,`a`,149,1],[0,`s`,140,15],[1,`s`,68,15]]],[87,11,13,0,5,10,[[0,`g`,96,1],[1,`g`,1,6],[0,`g`,100,1],[1,`g`,4,2],[0,`g`,104,1],[1,`g`,13,2],[0,`g`,110,1],[0,`g`,106,1],[0,`a`,221,1],[1,`a`,13,4],[1,`a`,4,3],[1,`a`,1,1],[1,`a`,14,1],[0,`s`,98,15],[1,`s`,9,10],[0,`y`,96,1],[0,`r`,98,1]]],[88,11,1,5,5,3,[[0,`g`,185,2],[1,`g`,138,2],[0,`g`,183,2],[1,`g`,130,1],[0,`g`,179,1],[0,`a`,185,2],[1,`a`,128,1],[0,`a`,181,1],[1,`a`,131,1],[1,`a`,138,1],[0,`s`,184,18],[1,`s`,128,15],[0,`y`,179,1],[1,`y`,130,1],[1,`y`,131,1]]],[89,12,11,10,6,4,[[0,`g`,114,2],[1,`g`,63,1],[0,`g`,115,2],[1,`g`,65,3],[0,`g`,116,1],[0,`g`,113,1],[0,`a`,114,2],[1,`a`,61,1],[0,`a`,115,2],[1,`a`,65,1],[0,`a`,116,1],[1,`a`,66,1],[1,`a`,68,1],[0,`s`,112,6],[1,`s`,68,10],[0,`y`,113,1],[1,`y`,61,1],[0,`y`,112,1]]],[90,12,2,14,8,1,[[0,`g`,88,2],[1,`g`,214,1],[0,`g`,90,3],[0,`g`,92,3],[0,`a`,86,1],[1,`a`,211,1],[0,`a`,87,1],[0,`a`,88,1],[0,`a`,89,1],[0,`a`,90,3],[0,`s`,91,6],[1,`s`,207,10]]],[91,12,9,5,0,3,[[1,`og`,-1,3]]],[92,12,7,3,8,8,[[0,`g`,143,2],[1,`g`,190,3],[0,`g`,144,2],[1,`g`,194,1],[0,`g`,147,3],[1,`g`,196,3],[0,`g`,146,1],[1,`g`,201,1],[0,`a`,143,1],[1,`a`,191,2],[0,`a`,144,4],[1,`a`,194,2],[0,`a`,147,2],[1,`a`,195,1],[0,`a`,146,1],[1,`a`,201,3],[0,`s`,140,5],[1,`s`,191,20],[1,`y`,191,1]]],[93,12,6,15,12,0,[[0,`g`,168,2],[0,`g`,169,5],[0,`g`,171,3],[0,`g`,178,2],[0,`a`,168,4],[0,`a`,171,2],[0,`a`,169,1],[0,`a`,178,2],[0,`s`,166,11],[1,`s`,42,11]]],[94,12,4,8,5,8,[[0,`g`,51,1],[1,`g`,18,2],[0,`g`,53,1],[1,`g`,26,1],[0,`g`,54,3],[1,`g`,27,3],[1,`g`,22,2],[0,`a`,54,2],[1,`a`,18,1],[0,`a`,52,2],[1,`a`,26,2],[1,`a`,28,1],[1,`a`,22,3],[0,`s`,55,10],[1,`s`,21,13],[0,`y`,55,1],[1,`y`,22,1]]],[95,12,12,13,8,11,[[0,`g`,72,5],[1,`g`,96,2],[0,`g`,79,2],[1,`g`,110,3],[0,`g`,76,1],[1,`g`,106,1],[1,`g`,104,1],[1,`g`,108,4],[0,`a`,83,2],[1,`a`,96,1],[0,`a`,72,1],[1,`a`,108,2],[0,`a`,77,1],[1,`a`,110,3],[0,`s`,73,15],[1,`s`,98,8],[1,`y`,110,1]]],[96,12,1,0,3,4,[[0,`g`,180,2],[1,`g`,1,3],[0,`g`,185,1],[1,`g`,14,1],[0,`a`,185,1],[1,`a`,1,1],[1,`a`,14,2],[0,`s`,184,10],[1,`s`,9,11],[0,`y`,185,1],[1,`y`,1,1],[0,`y`,186,1]]],[97,13,7,14,9,6,[[0,`g`,147,4],[1,`g`,206,2],[0,`g`,143,3],[1,`g`,214,2],[0,`g`,144,1],[1,`g`,211,1],[0,`g`,146,1],[1,`g`,210,1],[0,`a`,146,4],[1,`a`,211,3],[0,`a`,144,2],[1,`a`,206,1],[0,`a`,143,1],[0,`s`,140,8],[1,`s`,207,16],[1,`y`,206,1]]],[98,13,2,13,8,0,[[0,`g`,90,4],[0,`g`,85,2],[0,`g`,88,1],[0,`g`,89,1],[0,`a`,89,1],[0,`a`,85,2],[0,`a`,88,2],[0,`a`,90,1],[0,`a`,95,1],[0,`s`,95,15],[0,`y`,90,1],[1,`y`,221,1]]],[99,13,12,1,5,7,[[0,`g`,73,1],[1,`g`,186,3],[0,`g`,76,1],[1,`g`,185,2],[0,`g`,77,1],[1,`g`,179,1],[0,`g`,79,1],[1,`g`,180,1],[0,`g`,82,1],[0,`a`,76,1],[1,`a`,185,3],[1,`a`,180,3],[1,`a`,183,1],[0,`s`,73,17],[1,`s`,184,20],[0,`y`,73,1],[1,`y`,180,1],[0,`y`,77,1],[1,`y`,185,1],[0,`y`,82,1],[1,`r`,181,1]]],[100,13,4,15,17,9,[[0,`g`,53,8],[1,`g`,35,6],[0,`g`,50,4],[1,`g`,36,2],[0,`g`,51,4],[1,`g`,41,1],[0,`g`,52,1],[0,`a`,51,4],[1,`a`,35,2],[0,`a`,50,5],[1,`a`,36,1],[0,`a`,46,1],[1,`a`,41,1],[0,`a`,52,2],[0,`s`,55,15],[1,`s`,45,16]]],[101,13,9,8,0,3,[[1,`g`,26,3]]],[102,13,11,3,2,0,[[0,`g`,114,1],[0,`g`,116,1],[0,`a`,115,1],[0,`a`,114,1],[0,`s`,112,15],[1,`s`,191,12],[0,`y`,114,1]]],[103,13,6,10,3,3,[[0,`g`,167,2],[1,`g`,63,1],[0,`g`,169,1],[1,`g`,64,1],[1,`g`,70,1],[0,`a`,178,2],[1,`a`,65,1],[0,`a`,167,1],[1,`a`,70,1],[0,`s`,166,11],[1,`s`,68,11],[0,`y`,167,1],[1,`y`,62,1]]],[104,13,0,5,8,5,[[0,`g`,14,4],[1,`g`,130,2],[0,`g`,11,3],[1,`g`,131,1],[0,`g`,8,1],[1,`g`,133,1],[1,`g`,138,1],[0,`a`,13,2],[1,`a`,129,1],[0,`a`,11,2],[0,`a`,8,1],[0,`s`,9,10],[1,`s`,128,8]]],[105,14,12,0,0,3,[[1,`og`,-1,3]]],[106,14,7,13,9,8,[[0,`g`,144,1],[1,`g`,103,5],[0,`g`,146,1],[1,`g`,102,3],[0,`g`,147,6],[0,`g`,149,1],[0,`a`,139,2],[1,`a`,96,1],[0,`a`,144,3],[1,`a`,103,2],[0,`a`,146,2],[1,`a`,104,1],[1,`a`,98,1],[0,`a`,149,2],[1,`a`,102,3],[0,`s`,149,10],[1,`s`,98,14],[0,`y`,139,1],[1,`y`,96,1],[0,`y`,144,1],[1,`y`,98,1]]],[107,14,6,3,7,8,[[0,`g`,169,2],[1,`g`,190,3],[0,`g`,168,3],[1,`g`,193,4],[0,`g`,166,1],[1,`g`,199,1],[0,`g`,178,1],[0,`a`,169,1],[1,`a`,190,2],[0,`a`,172,2],[1,`a`,196,3],[0,`a`,178,1],[0,`s`,166,16],[1,`s`,191,17],[0,`y`,178,1],[1,`y`,190,1]]],[108,14,11,14,3,0,[[0,`og`,-1,3]]],[109,14,2,1,4,2,[[0,`g`,85,1],[1,`g`,185,1],[0,`g`,88,1],[1,`g`,186,1],[0,`g`,89,2],[0,`a`,85,1],[1,`a`,185,1],[0,`a`,89,1],[0,`a`,90,1],[0,`s`,91,11],[1,`s`,184,16],[0,`y`,88,1],[1,`y`,183,1],[0,`y`,86,1],[1,`y`,185,1],[0,`y`,90,1],[1,`y`,184,1]]],[110,14,4,10,6,5,[[0,`g`,50,1],[1,`g`,65,4],[0,`g`,55,1],[1,`g`,63,1],[0,`g`,53,1],[0,`g`,52,2],[0,`g`,57,1],[0,`a`,46,1],[1,`a`,69,2],[0,`a`,50,2],[1,`a`,66,1],[0,`a`,52,1],[1,`a`,62,1],[0,`s`,57,10],[1,`s`,68,5],[1,`s`,69,8],[0,`y`,55,1],[1,`y`,62,1],[1,`y`,69,1]]],[111,14,9,15,8,8,[[0,`g`,155,2],[1,`g`,36,1],[0,`g`,164,2],[1,`g`,40,1],[0,`g`,165,1],[1,`g`,35,6],[0,`g`,160,1],[0,`g`,159,2],[0,`a`,163,1],[1,`a`,36,2],[0,`s`,161,16],[1,`s`,45,11]]],[112,14,8,5,5,3,[[0,`g`,19,1],[1,`g`,129,1],[0,`g`,26,2],[1,`g`,131,1],[0,`g`,23,2],[1,`g`,138,1],[0,`a`,19,1],[1,`a`,127,1],[0,`a`,23,1],[1,`a`,130,1],[0,`a`,26,1],[0,`s`,21,30]]],[113,15,8,15,12,4,[[0,`g`,22,4],[1,`g`,35,3],[0,`g`,26,3],[1,`g`,39,1],[0,`g`,23,2],[0,`g`,18,1],[0,`g`,25,1],[0,`g`,27,1],[0,`a`,26,3],[1,`a`,36,2],[0,`a`,19,2],[0,`a`,23,1],[0,`a`,23,1],[0,`a`,21,1],[0,`a`,27,1],[0,`s`,21,18],[1,`s`,42,18],[0,`y`,21,1],[0,`y`,26,1]]],[114,15,11,13,3,6,[[0,`g`,114,1],[1,`g`,96,4],[0,`g`,115,1],[1,`g`,103,1],[0,`g`,120,1],[1,`g`,102,1],[0,`a`,114,1],[1,`a`,103,3],[0,`a`,116,1],[1,`a`,106,1],[1,`a`,96,1],[0,`s`,112,20],[1,`s`,98,12],[0,`r`,114,1],[1,`r`,98,1]]],[115,15,7,1,4,7,[[0,`g`,147,2],[1,`g`,185,4],[0,`g`,139,1],[1,`g`,187,2],[0,`g`,144,1],[1,`g`,180,1],[0,`a`,144,2],[1,`a`,186,2],[0,`a`,146,1],[1,`a`,183,1],[0,`a`,147,1],[1,`a`,187,1],[1,`a`,184,1],[0,`s`,140,12],[1,`s`,184,21],[0,`y`,140,1],[1,`y`,185,1]]],[116,15,2,0,2,7,[[0,`g`,88,1],[1,`g`,1,3],[0,`g`,89,1],[1,`g`,11,2],[1,`g`,14,2],[0,`a`,91,1],[1,`a`,13,2],[1,`a`,14,2],[1,`a`,11,1],[1,`a`,1,1],[0,`s`,91,10],[1,`s`,9,15],[0,`y`,90,1],[1,`y`,14,1],[0,`y`,91,1],[1,`y`,13,1],[1,`y`,11,1]]],[117,15,6,14,null,null,[]],[118,15,4,3,5,6,[[0,`g`,50,2],[1,`g`,190,2],[0,`g`,54,2],[1,`g`,196,1],[0,`g`,46,1],[1,`g`,193,1],[1,`g`,194,1],[1,`g`,199,1],[0,`a`,50,1],[1,`a`,193,2],[0,`a`,54,1],[1,`a`,196,2],[0,`s`,57,25],[1,`s`,191,20],[1,`y`,199,1]]],[119,15,9,10,0,3,[[1,`g`,65,3]]],[120,15,12,5,0,3,[[1,`g`,130,3]]]],Pi=[{name:`Y. Timelli`,team:`RATP B`,goals:64,assists:34,contribution:57.6,win_pct:72.2,card_penalty:4,clutch_goals:13,clutch_assists:11,clutch_score:50,adversity:24.5,raw:568,ipg:100,player:-1},{name:`A. Lamghari`,team:`DISWAY`,goals:55,assists:24,contribution:73.1,win_pct:66.7,card_penalty:6,clutch_goals:18,clutch_assists:5,clutch_score:59,adversity:29.1,raw:569,ipg:99.84,player:72},{name:`A. OURBA`,team:`COOPER PHARMA`,goals:32,assists:27,contribution:48.4,win_pct:82.4,card_penalty:3,clutch_goals:13,clutch_assists:10,clutch_score:49,adversity:39,raw:463.1,ipg:81.52,player:158},{name:`A. Mandour`,team:`CASA VIGILANCE`,goals:37,assists:29,contribution:65.3,win_pct:66.7,card_penalty:5,clutch_goals:9,clutch_assists:6,clutch_score:33,adversity:22.7,raw:450.1,ipg:79.24,player:144},{name:`I. Khamlichi`,team:`ANAKOT`,goals:34,assists:17,contribution:48.6,win_pct:29.4,card_penalty:2,clutch_goals:15,clutch_assists:6,clutch_score:51,adversity:41.2,raw:403.7,ipg:71.08,player:-1},{name:`M. SADIKI`,team:`ATELIER VERT`,goals:31,assists:21,contribution:62.7,win_pct:33.3,card_penalty:3,clutch_goals:11,clutch_assists:5,clutch_score:38,adversity:30.8,raw:397.4,ipg:69.96,player:-1},{name:`A. NAFIL`,team:`DISTRA`,goals:25,assists:41,contribution:54.1,win_pct:33.3,card_penalty:4,clutch_goals:6,clutch_assists:14,clutch_score:32,adversity:30.3,raw:388.8,ipg:68.46,player:183},{name:`A. Hannane`,team:`RATP A`,goals:38,assists:15,contribution:39.6,win_pct:77.8,card_penalty:4,clutch_goals:8,clutch_assists:3,clutch_score:27,adversity:20.8,raw:371.6,ipg:65.43,player:-1},{name:`Y. TAFALLOUST`,team:`CHAABI LLD`,goals:21,assists:23,contribution:44.4,win_pct:47.1,card_penalty:6,clutch_goals:8,clutch_assists:13,clutch_score:37,adversity:47.7,raw:360.7,ipg:63.5,player:-1},{name:`C. BAYOUD`,team:`RATP B`,goals:33,assists:23,contribution:32.9,win_pct:72.2,card_penalty:1,clutch_goals:8,clutch_assists:4,clutch_score:28,adversity:21.4,raw:359.5,ipg:63.3,player:-1},{name:`O. Housni`,team:`TELUS DIGITAL`,goals:25,assists:20,contribution:36,win_pct:61.1,card_penalty:8,clutch_goals:11,clutch_assists:6,clutch_score:39,adversity:37.8,raw:355.9,ipg:62.66,player:-1},{name:`Y. grigrane`,team:`RATP A`,goals:29,assists:14,contribution:32.1,win_pct:77.8,card_penalty:8,clutch_goals:9,clutch_assists:7,clutch_score:34,adversity:37.2,raw:354.2,ipg:62.35,player:-1},{name:`A. KOURDAN`,team:`AXA CREDIT`,goals:32,assists:20,contribution:42.6,win_pct:50,card_penalty:5,clutch_goals:9,clutch_assists:3,clutch_score:30,adversity:23.1,raw:349.3,ipg:61.5,player:-1},{name:`M. Elhilali`,team:`RATP B`,goals:19,assists:31,contribution:29.4,win_pct:72.2,card_penalty:1,clutch_goals:7,clutch_assists:9,clutch_score:30,adversity:32,raw:341,ipg:60.04,player:-1},{name:`A. OIRDI`,team:`CHAABI LLD`,goals:19,assists:8,contribution:27.3,win_pct:47.1,card_penalty:0,clutch_goals:14,clutch_assists:4,clutch_score:46,adversity:66.7,raw:333.3,ipg:58.67,player:64},{name:`I. AGOUZ`,team:`COOPER PHARMA`,goals:24,assists:14,contribution:31.1,win_pct:82.4,card_penalty:2,clutch_goals:7,clutch_assists:5,clutch_score:26,adversity:31.6,raw:326.2,ipg:57.43,player:155},{name:`Y. Rochdi`,team:`ANAKOT`,goals:20,assists:19,contribution:37.1,win_pct:29.4,card_penalty:4,clutch_goals:8,clutch_assists:10,clutch_score:34,adversity:46.2,raw:311.9,ipg:54.9,player:-1},{name:`I. SAOUD`,team:`VIVALIS`,goals:24,assists:13,contribution:51.4,win_pct:29.4,card_penalty:9,clutch_goals:8,clutch_assists:4,clutch_score:28,adversity:32.4,raw:309.6,ipg:54.51,player:114},{name:`R. EL KHIR`,team:`MCDONALDS`,goals:17,assists:24,contribution:37.6,win_pct:61.1,card_penalty:1,clutch_goals:5,clutch_assists:5,clutch_score:20,adversity:24.4,raw:298.7,ipg:52.59,player:-1},{name:`A. OUDDACHT`,team:`CHAABI LLD`,goals:33,assists:12,contribution:45.5,win_pct:47.1,card_penalty:8,clutch_goals:4,clutch_assists:2,clutch_score:14,adversity:13.3,raw:294.3,ipg:51.81,player:-1},{name:`T. EL BOUAANANI`,team:`ASTRAZENECA`,goals:30,assists:7,contribution:42.5,win_pct:17.6,card_penalty:2,clutch_goals:6,clutch_assists:3,clutch_score:21,adversity:24.3,raw:271,ipg:47.72,player:-1},{name:`M. ELMORABET`,team:`COOPER PHARMA`,goals:21,assists:7,contribution:23,win_pct:82.4,card_penalty:5,clutch_goals:6,clutch_assists:2,clutch_score:20,adversity:28.6,raw:268.8,ipg:47.33,player:150},{name:`M. Errahmouni`,team:`RATP B`,goals:22,assists:16,contribution:22.4,win_pct:72.2,card_penalty:1,clutch_goals:4,clutch_assists:3,clutch_score:15,adversity:18.4,raw:262.3,ipg:46.19,player:-1},{name:`Y. HARIT`,team:`MCDONALDS`,goals:25,assists:8,contribution:30.3,win_pct:61.1,card_penalty:15,clutch_goals:5,clutch_assists:2,clutch_score:17,adversity:21.2,raw:252.9,ipg:44.52,player:-1},{name:`H. BelKhattab`,team:`DISWAY`,goals:13,assists:18,contribution:28.7,win_pct:66.7,card_penalty:4,clutch_goals:1,clutch_assists:7,clutch_score:10,adversity:25.8,raw:240.9,ipg:42.41,player:83}],Fi=`season_2025`,Ii=`2025-10-04`,Li=[`18:00`,`18:45`,`19:30`,`20:15`],Ri=e=>`t25_${(typeof e==`string`?e:ji[e][1]).toLowerCase()}`,zi={CAC:`Centrale Automobile Chérifienne`,CTR:`Construction & Travaux Routiers`,ALM:`Stock Box Self-Storage (Almav Group)`,MPT:`Mega Post-Tension SA`,DEL:`Dell Technologies`,CVG:`Casavigilance Sécurité Incendie`,MDS:`Groupe Mondial Service`,DSW:`Disway`,COP:`Cooper Pharma`,CHL:`Chaabi LLD`},K=e=>`p25_${e}`;function Bi(){let e={id:Fi,name:`Saison 2025-2026`,start_date:`2025-09-27`,end_date:`2026-03-27`,status:`closed`,is_active:!0,league_phase_rounds:15,cup_rounds:0,gold_size:16,closed_at:`2026-03-27T20:00:00`},t=ji.map(([e,t,n,r])=>({id:Ri(t),name:e,short_name:t,company:zi[t]??e,logo_url:`/logos/${t.toLowerCase()}.png`,company_logo_url:`/logos/${t.toLowerCase()}-full.png`,primary_color:n,secondary_color:r,status:`active`})),n={id:`comp_2025_league`,season_id:e.id,name:`Championnat`,phase:`league_phase`,format:`league`,status:`finished`,team_ids:t.map(e=>e.id),rounds:Array.from({length:15},(e,t)=>t+1),half_duration_min:15,foul_alert_threshold:5,color:`#F85A00`,order:1,description:`16 équipes · matchs aller · 15 journées`},r=Mi.map(([t,n,r,i],a)=>({id:K(a),first_name:n,last_name:r,position:i,team_id:Ri(t),status:`active`,season_ids:[e.id],rookie:!1})),i=[],a=[],o=[],s=0,c=new Map;for(let[t,r,l,u,d,f,p]of Ni){let m=c.get(r)??0;c.set(r,m+1);let h=d!=null&&f!=null,g={id:`m25_${t}`,season_id:e.id,competition_id:n.id,round:r,stage:`league_phase`,date:`${wi(Ii,(r-1)*7)}T${Li[Math.floor(m/2)%Li.length]}:00`,pitch:m%2==0?`Terrain 1`:`Terrain 2`,venue_id:`venue_main`,home_team_id:Ri(l),away_team_id:Ri(u),home_score:h?d:null,away_score:h?f:null,status:h?`finished`:`cancelled`,published:!0,validated:h,source:`manual`,half_duration_min:15};if(i.push(g),!h)continue;let _=e=>({id:`ev25_${(++s).toString(36)}`,match_id:g.id,...e});for(let e of[0,1]){let n=e===0?g.home_team_id:g.away_team_id,r=e===0?g.away_team_id:g.home_team_id,i=p.filter(t=>t[0]===e),s=e=>i.filter(t=>t[1]===e).flatMap(([,,e,t])=>Array.from({length:t},()=>e)),c=s(`g`).map(e=>({scorer:e,assist:-1}));for(let e of s(`a`)){let t=c.find(t=>t.assist<0&&t.scorer!==e)??c.find(e=>e.assist<0);t&&(t.assist=e)}for(let e of c)a.push(_({team_id:n,type:`goal`,goal_kind:`normal`,player_id:K(e.scorer),related_player_id:e.assist>=0&&e.assist!==e.scorer?K(e.assist):void 0}));for(let[,,,e]of i.filter(e=>e[1]===`og`))for(let t=0;t<e;t++)a.push(_({team_id:r,type:`own_goal`}));let l=new Map;for(let e of s(`s`))l.set(e,(l.get(e)??0)+1),a.push(_({team_id:n,type:`save`,player_id:K(e)}));for(let e of s(`y`))a.push(_({team_id:n,type:`yellow_card`,player_id:K(e)}));for(let e of s(`r`))a.push(_({team_id:n,type:`red_card`,player_id:K(e)}));let u=[...l.entries()].sort((e,t)=>t[1]-e[1])[0]?.[0],d=[...new Set(i.filter(e=>e[2]>=0).map(e=>e[2]))];o.push(Ai({id:`lu25_${t}_${e}`,match_id:g.id,team_id:n,present_ids:d.map(K),starter_ids:d.map(K),substitute_ids:[],goalkeeper_id:u==null?void 0:K(u),validated:!0,validated_by:`Import Excel`},a))}}return{season:e,competition:n,teams:t,players:r,matches:i,events:a,lineups:o}}var Vi=[`orange`,`bleue`],Hi={orange:`#F05A22`,bleue:`#1F6FE0`},Ui=e=>e===`orange`?`bleue`:`orange`;function Wi(){return[{id:`cap_orange`,side:`orange`,name:`Équipe Orange`,color:Hi.orange,player_ids:[]},{id:`cap_bleue`,side:`bleue`,name:`Équipe Bleue`,color:Hi.bleue,player_ids:[]}]}function Gi(e=[]){let t=Wi();return{orange:e.find(e=>e.side===`orange`)??t[0],bleue:e.find(e=>e.side===`bleue`)??t[1]}}function Ki(e){if(e.logo_url)return e.logo_url;let t=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${e.color??Hi[e.side]}"/><stop offset="1" stop-color="#0B2E73"/></linearGradient></defs><path d="M50 4 90 18v30c0 24-17 40-40 48C27 88 10 72 10 48V18z" fill="url(#g)" stroke="#fff" stroke-width="4"/><text x="50" y="66" font-family="Arial Black,Arial,sans-serif" font-size="44" font-weight="900" fill="#fff" text-anchor="middle">${e.side===`orange`?`O`:`B`}</text></svg>`;return`data:image/svg+xml;utf8,${encodeURIComponent(t)}`}var qi=e=>e.status===`finished`;function Ji(e){let t=t=>e.lines.filter(e=>e.side===t).reduce((e,t)=>e+t.goals,0)+e.lines.filter(e=>e.side===Ui(t)).reduce((e,t)=>e+t.og,0);return{orange:t(`orange`),bleue:t(`bleue`)}}function Yi(e,t){if(!qi(e))return null;let n=Ji(e);return n[t]>n[Ui(t)]?`W`:n[t]<n[Ui(t)]?`L`:`D`}function Xi(e){let t=Ji(e);return t.orange!==t.bleue||e.orange_pens==null||e.bleue_pens==null||e.orange_pens===e.bleue_pens?null:e.orange_pens>e.bleue_pens?`orange`:`bleue`}function Zi(e){let t=()=>({played:0,won:0,drawn:0,lost:0,gf:0,ga:0}),n={orange:t(),bleue:t()};for(let t of e.filter(qi)){let e=Ji(t);for(let r of Vi){let i=n[r];i.played++,i.gf+=e[r],i.ga+=e[Ui(r)];let a=Yi(t,r);a===`W`?i.won++:a===`D`?i.drawn++:i.lost++}}return n}var Qi=e=>e.slice(0,7);function $i(e){let t=new Map;for(let n of[...e].filter(e=>e.status!==`cancelled`).sort((e,t)=>t.date.localeCompare(e.date))){let e=Qi(n.date);t.has(e)||t.set(e,[]),t.get(e).push(n)}return[...t.entries()].map(([e,t])=>({month:e,matches:t}))}function ea(e,t=new Date){let n=t.toISOString();return[...e].filter(e=>e.status===`scheduled`&&e.date>=n).sort((e,t)=>e.date.localeCompare(t.date))[0]}function ta(e){return[...e].filter(qi).sort((e,t)=>t.date.localeCompare(e.date))[0]}function na(e){let t=new Map;for(let n of e.filter(qi)){let e=Ji(n);for(let r of n.lines.filter(e=>e.played||e.goals||e.assists||e.yc||e.rc||e.og)){let n=t.get(r.player_id)??{player_id:r.player_id,side:r.side,played:0,goals:0,assists:0,og:0,yc:0,rc:0,motm:0,gk_matches:0,saves:0,conceded:0,clean_sheets:0};if(n.side=r.side,n.played++,n.goals+=r.goals,n.assists+=r.assists,n.og+=r.og,n.yc+=r.yc,n.rc+=r.rc,r.gk){n.gk_matches++,n.saves+=r.saves;let t=e[Ui(r.side)];n.conceded+=t,t===0&&n.clean_sheets++}t.set(r.player_id,n)}if(n.motm_player_id){let e=t.get(n.motm_player_id);e&&e.motm++}}return[...t.values()]}var ra=e=>e.filter(e=>e.goals>0).sort((e,t)=>t.goals-e.goals||e.played-t.played),ia=e=>e.filter(e=>e.assists>0).sort((e,t)=>t.assists-e.assists||e.played-t.played),aa=e=>e.filter(e=>e.gk_matches>0).sort((e,t)=>t.clean_sheets-e.clean_sheets||t.saves-e.saves||e.conceded-t.conceded),oa=(e,t)=>({side:e,player_id:t,played:!1,goals:0,og:0,assists:0,yc:0,rc:0,saves:0});function sa(e,t=6){let n=[];for(let r of Vi){let i=e.lines.filter(e=>e.side===r),a=i.reduce((e,t)=>e+t.goals,0)+e.lines.filter(e=>e.side===Ui(r)).reduce((e,t)=>e+t.og,0),o=i.reduce((e,t)=>e+t.assists,0),s=r===`orange`?`Orange`:`Bleue`;o>a&&n.push(`${s} : plus de passes décisives (${o}) que de buts (${a}).`),i.filter(e=>e.gk).length>1&&n.push(`${s} : un seul gardien par équipe.`),e.status===`finished`&&i.filter(e=>e.played).length<t&&i.length>=t&&n.push(`${s} : moins de ${t} joueurs cochés « A joué ».`)}let r=Ji(e);return(e.orange_pens!=null||e.bleue_pens!=null)&&r.orange!==r.bleue&&n.push(`Tirs au but saisis alors que le score n’est pas nul.`),n}var ca=0,la=e=>`${e}_${(++ca).toString(36)}`;function ua(e=new Date){ca=0;let t=Object.fromEntries(`Season.Competition.Division.Group.Venue.Team.Player.Match.MatchEvent.Lineup.LiveState.MatchTeamStats.XPRule.Suspension.MonthlyAward.Award.Draw.Media.MotmVote.TeamOfWeek.Settings.Page.AuditLog.AdminUser.Rulebook.Club.CaptainTeam.CaptainMatch`.split(`.`).map(e=>[e,[]])),n={id:`settings`,league_name:S.name,short_name:S.shortName,tagline:S.tagline,organizer:S.organizer.name,logo_url:S.logo,contact_email:S.organizer.email,contact_phone:S.organizer.phone,address:S.organizer.address,website:S.organizer.website,socials:{instagram:S.instagram,organizer_instagram:S.organizer.instagram,linkedin:S.organizer.linkedin},motm_vote_minutes_after:15};t.Settings.push(n),t.Rulebook.push(...Ci()),t.Venue.push({id:`venue_main`,name:`Complexe sportif MBL`,address:`Casablanca`,pitches:[`Terrain 1`,`Terrain 2`]}),t.Division.push({id:`div_gold`,name:_.gold,level:1,color:`#E8B931`},{id:`div_silver`,name:_.silver,level:2,color:`#C9D3DD`});let r=()=>({seasons:t.Season,competitions:t.Competition,teams:t.Team,players:t.Player,matches:t.Match,events:t.MatchEvent,lineups:t.Lineup,xpRules:t.XPRule,suspensions:t.Suspension,monthlyAwards:t.MonthlyAward,settings:n,divisions:t.Division,groups:t.Group}),s=Bi(),c=yi();s.season.is_active=!1,t.Season.push(c.season,s.season);for(let e of[s.season,c.season])for(let n of i)t.XPRule.push({id:la(`xp`),season_id:e.id,key:n,value:a[n]});t.Team.push(...s.teams.map(e=>({...e,season_id:s.season.id,club_id:`club_${e.id}`}))),t.Player.push(...s.players),t.Competition.push(s.competition),t.Match.push(...s.matches),t.MatchEvent.push(...s.events),t.Lineup.push(...s.lineups);for(let e of[...s.matches].filter(e=>e.status===`finished`).sort((e,t)=>(e.round??0)-(t.round??0))){e.opponent_rank_snapshot={home_rank:o(r(),e,e.home_team_id),away_rank:o(r(),e,e.away_team_id)};let t=s.events.filter(t=>t.match_id===e.id);e.motm_player_id=[...h({...r(),matches:[e],events:t,suspensions:[],monthlyAwards:[]},{seasonId:s.season.id}).values()].filter(e=>e.matches>0).sort((e,t)=>t.xp-e.xp)[0]?.player_id,e.validated_at=`${e.date.slice(0,10)}T21:00:00`,e.validated_by=`Import Excel`}for(let e of Ur(r(),{seasonId:s.season.id,phase:`all`}))t.Award.push({id:la(`aw`),season_id:s.season.id,scope:`season`,category:e.category,player_id:e.player_id,team_id:e.team_id,value:e.value,snapshot:e.snapshot,not_awarded:e.not_awarded,status:`published`,locked:!0});t.Team.push(...c.teams.map(e=>({...e,season_id:c.season.id,club_id:`club_${e.id}`}))),t.Competition.push(...c.competitions),t.CaptainTeam.push(...Wi()),t.Club.push(...t.Team.map(e=>({id:e.club_id,name:e.name,logo_url:e.logo_url})));let l=new Date(e.getTime()-2592e6).toISOString();t.AdminUser.push({id:`user_super`,email:`superadmin@mbl.ma`,full_name:`Super Admin`,role:`super_admin`,status:`active`,activated_at:l,password:`mbl2026`},{id:`user_admin`,email:`admin@mbl.ma`,full_name:`Admin Ligue`,role:`admin`,status:`active`,activated_at:l,password:`mbl2026`},{id:`user_operator`,email:`operateur@mbl.ma`,full_name:`Opérateur de saisie`,role:`operator`,status:`active`,activated_at:l,password:`mbl2026`});let u=new Date(e.getTime()-5184e6).toISOString();for(let e of Object.values(t))for(let t of e)t.created_date??=u,t.updated_date??=u;return t}function q(e,t){let n={...e};return delete n[t],n}var da=new Set([`best_defender`,`best_midfielder`,`best_forward`]);function fa(e){let t={};e.Player?.some(e=>e.position!==`GK`&&e.position!==`FIELD`)&&(t.Player=e.Player.map(e=>e.position===`GK`||e.position===`FIELD`?e:{...e,position:v(e.position)})),e.MatchEvent?.some(e=>e.type===`offside`)&&(t.MatchEvent=e.MatchEvent.filter(e=>e.type!==`offside`)),e.MatchTeamStats?.some(e=>`offsides`in e)&&(t.MatchTeamStats=e.MatchTeamStats.map(e=>q(e,`offsides`))),e.Award?.some(e=>da.has(e.category))&&(t.Award=e.Award.filter(e=>!da.has(e.category))),e.TeamOfWeek?.some(e=>`formation`in e||e.slots.some((e,t)=>e.position!==(t===0?`GK`:`FIELD`)))&&(t.TeamOfWeek=e.TeamOfWeek.map(e=>({...q(e,`formation`),slots:e.slots.slice(0,6).map((e,t)=>({...e,position:t===0?`GK`:`FIELD`}))}))),e.Lineup?.some(e=>`formation`in e)&&(t.Lineup=e.Lineup.map(e=>q(e,`formation`)));let n=e.Page?.find(e=>e.slug===`reglement`);if(n&&!/hors-jeu/i.test(n.content??``)){let r=`- **Pas de postes** : les seuls rôles sont **Gardien** et **Capitaine**.
- **Pas de hors-jeu.**
`,i=n.content??``,a=i.indexOf(`
`,i.indexOf(`## 1.`)+1),o=i.includes(`## 1.`)?i.slice(0,a+1)+r+i.slice(a+1):`${i}\n\n## Règles de jeu\n- 6 contre 6 (5 joueurs de champ + 1 gardien).\n${r}`;t.Page=e.Page.map(e=>e===n?{...e,content:o}:e)}return t}function pa(e){let t={};if(e.Award?.some(e=>e.category===`best_young`)&&(t.Award=e.Award.filter(e=>e.category!==`best_young`)),e.Settings?.some(e=>`young_max_age`in e)&&(t.Settings=e.Settings.map(e=>q(e,`young_max_age`))),e.Player&&e.Team){let n=new Map;for(let t of e.Team){let r=e.Player.filter(e=>e.team_id===t.id),i=r.find(e=>e.id===t.captain_player_id)??r.find(e=>e.is_captain);n.set(t.id,i?.id??null)}e.Player.some(e=>!!e.is_captain!=(n.get(e.team_id)===e.id))&&(t.Player=e.Player.map(e=>!!e.is_captain==(n.get(e.team_id)===e.id)?e:{...e,is_captain:n.get(e.team_id)===e.id})),e.Team.some(e=>(e.captain_player_id??null)!==n.get(e.id))&&(t.Team=e.Team.map(e=>{let t=n.get(e.id);return(e.captain_player_id??null)===t?e:t?{...e,captain_player_id:t}:q(e,`captain_player_id`)}))}if(e.Lineup&&e.MatchEvent){let n=e.MatchEvent,r=e.Lineup.map(e=>Ai(e,n));r.some((t,n)=>t!==e.Lineup[n])&&(t.Lineup=r)}let n=e.Page?.find(e=>e.slug===`reglement`);return n&&/,? ?Meilleur jeune/.test(n.content??``)&&(t.Page=e.Page.map(e=>e===n?{...e,content:(e.content??``).replace(/,? ?Meilleur jeune/,``)}:e)),t}function ma(e){let t={},n=Ci(),i=new Set((e.Rulebook??[]).map(e=>e.version));e.Rulebook&&n.some(e=>!i.has(e.version))&&(t.Rulebook=[...(e.Rulebook??[]).map(e=>e.status===`current`?{...e,status:`archived`}:e),...n.filter(e=>!i.has(e.version))]),e.Season?.some(e=>e.id===`season_2026`&&!e.rulebook_version)&&(t.Season=e.Season.map(e=>e.id===`season_2026`&&!e.rulebook_version?{...e,rulebook_version:`v4`}:e));let a=r.duration.halfMin;return e.Competition?.some(e=>e.season_id===`season_2026`&&e.half_duration_min!==a)&&(t.Competition=e.Competition.map(e=>e.season_id===`season_2026`&&e.half_duration_min!==a?{...e,half_duration_min:a}:e)),e.Match?.some(e=>e.season_id===`season_2026`&&!u(e)&&e.status!==`live`&&e.half_duration_min!==a)&&(t.Match=e.Match.map(e=>e.season_id===`season_2026`&&!u(e)&&e.status!==`live`&&e.half_duration_min!==a?{...e,half_duration_min:a}:e)),e.Settings?.some(e=>`tiebreakers`in e||`points_win`in e)&&(t.Settings=e.Settings.map(e=>q(q(q(q(e,`tiebreakers`),`points_win`),`points_draw`),`points_loss`))),t}function ha(e){let t={},n=(e,t)=>t&&y[e].includes(t)?_[e]:t,r=e=>{let t=e;return(e.phase===`gold`||e.phase===`silver`)&&n(e.phase,e.name)!==e.name&&(t={...t,name:n(e.phase,e.name)}),e.split&&(n(`gold`,e.split.gold_name)!==e.split.gold_name||n(`silver`,e.split.silver_name)!==e.split.silver_name)&&(t={...t,split:{...e.split,gold_name:n(`gold`,e.split.gold_name),silver_name:n(`silver`,e.split.silver_name)}}),t};e.Competition?.some(e=>r(e)!==e)&&(t.Competition=e.Competition.map(r));let i=e=>e.id===`div_gold`&&n(`gold`,e.name)!==e.name?{...e,name:_.gold}:e.id===`div_silver`&&n(`silver`,e.name)!==e.name?{...e,name:_.silver}:e;return e.Division?.some(e=>i(e)!==e)&&(t.Division=e.Division.map(i)),e.Settings?.some(e=>e.tagline===`Le championnat de football inter-entreprises`)&&(t.Settings=e.Settings.map(e=>e.tagline===`Le championnat de football inter-entreprises`?{...e,tagline:S.tagline}:e)),t}function ga(e){if(!e.Team||!e.Competition)return{};let t=[...e.Season??[]].sort((e,t)=>(e.start_date??``).localeCompare(t.start_date??``)).map(e=>e.id),n=new Map;for(let t of e.Competition)for(let e of t.team_ids??[]){let r=n.get(e)??[];r.includes(t.season_id)||r.push(t.season_id),n.set(e,r)}let r=new Set(e.Team.map(e=>e.id)),i=new Map,a=[];for(let o of e.Team){let s=(n.get(o.id)??[]).sort((e,n)=>t.indexOf(e)-t.indexOf(n));if(!(s.length<2))for(let t of s.slice(1)){let n=(e.Season??[]).find(e=>e.id===t)?.start_date?.slice(0,4)??t,s=`t${n.slice(2)}_${(o.short_name||o.id).toLowerCase()}`;r.has(s)&&(s=`${o.id}_${n}`),r.add(s),a.push({...o,id:s,season_id:t,club_id:void 0,link:void 0,link_dismissed:void 0,captain_player_id:void 0}),i.has(t)||i.set(t,new Map),i.get(t).set(o.id,s)}}if(!a.length)return{};let o={},s=(e,t)=>e&&i.get(e)?.get(t)||t,c=new Map((e.Match??[]).map(e=>[e.id,e.season_id]));return o.Team=[...e.Team.map(e=>(n.get(e.id)?.length??0)>1?{...e,season_id:[...n.get(e.id)].sort((e,n)=>t.indexOf(e)-t.indexOf(n))[0]}:e),...a],o.Competition=e.Competition.map(e=>i.has(e.season_id)?{...e,team_ids:e.team_ids?.map(t=>s(e.season_id,t))}:e),e.Match&&(o.Match=e.Match.map(e=>i.has(e.season_id)?{...e,home_team_id:s(e.season_id,e.home_team_id),away_team_id:s(e.season_id,e.away_team_id),forfeit_team_id:e.forfeit_team_id?s(e.season_id,e.forfeit_team_id):e.forfeit_team_id}:e)),e.MatchEvent&&(o.MatchEvent=e.MatchEvent.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.Lineup&&(o.Lineup=e.Lineup.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.MatchTeamStats&&(o.MatchTeamStats=e.MatchTeamStats.map(e=>{let t=c.get(e.match_id);return t&&i.has(t)?{...e,team_id:s(t,e.team_id)}:e})),e.Suspension&&(o.Suspension=e.Suspension.map(e=>e.team_id&&i.has(e.season_id)?{...e,team_id:s(e.season_id,e.team_id)}:e)),e.Draw&&(o.Draw=e.Draw.map(t=>{let n=e.Competition.find(e=>e.id===t.competition_id)?.season_id;return n&&i.has(n)?{...t,pots:t.pots?.map(e=>({...e,team_ids:e.team_ids.map(e=>s(n,e))})),groups:t.groups?.map(e=>({...e,team_ids:e.team_ids.map(e=>s(n,e))}))}:t})),e.Player&&(o.Player=e.Player.map(e=>{let t=e.season_ids?.find(t=>i.get(t)?.has(e.team_id));return t&&(e.season_ids?.length??0)===1?{...e,team_id:s(t,e.team_id)}:e})),o}function _a(e){let t={};if(!e.Team||!e.Club)return t;let n=e.Competition??[],r=new Map((e.Club??[]).map(e=>[e.id,e])),i=!1,a=e.Team.map(e=>{let t=e.season_id??n.find(t=>t.team_ids?.includes(e.id))?.season_id,a=e.club_id??`club_${e.id}`;return r.has(a)||r.set(a,{id:a,name:e.name,logo_url:e.logo_url}),t===e.season_id&&a===e.club_id?e:(i=!0,{...e,season_id:t,club_id:a})});return i&&(t.Team=a),r.size!==(e.Club??[]).length&&(t.Club=[...r.values()]),t}function va(e){return!e.CaptainTeam||e.CaptainTeam.length?{}:{CaptainTeam:Wi()}}var ya=[fa,pa,ma,ha,ga,_a,va],ba=`data-version`;function xa(e,t=0){let n={...e},r={};for(let e of ya.slice(t)){let t=e(n);Object.assign(r,t),n={...n,...t}}return r}function Sa(){let e=+!!W.getFlag(`migrated-6v6`),t=Number(W.getFlag(ba)??e)||e;if(t>=ya.length)return;let n=xa(Object.fromEntries([`Player`,`MatchEvent`,`MatchTeamStats`,`Award`,`TeamOfWeek`,`Lineup`,`Page`,`Team`,`Settings`,`Rulebook`,`Season`,`Competition`,`Match`,`Division`,`Club`,`Suspension`,`Draw`,`CaptainTeam`].map(e=>[e,W.all(e)])),t);W.batch(()=>{for(let[e,t]of Object.entries(n))W.replace(e,t)}),W.setFlag(ba,String(ya.length))}var Ca=`9-selection-2026`;function wa(){return W.getFlag(`seeded`)===Ca?(Sa(),!1):(Ta(),!0)}function Ta(){let e=W.getFlag(`session`);W.clearAll();let t=ua();W.batch(()=>{for(let[e,n]of Object.entries(t))W.replace(e,n)}),W.setFlag(`seeded`,Ca),Sa(),e&&W.setFlag(`session`,e)}function Ea(e,t){return{seasons:e.Season,competitions:e.Competition,divisions:e.Division,groups:e.Group,teams:e.Team,players:e.Player,matches:e.Match,events:e.MatchEvent,lineups:e.Lineup,xpRules:e.XPRule,suspensions:e.Suspension,monthlyAwards:e.MonthlyAward,settings:t,teamStats:e.MatchTeamStats}}function Da(e){return{matches:e.Match,events:e.MatchEvent,lineups:e.Lineup,players:e.Player,extras:e.Suspension.filter(e=>e.kind===`extra`)}}var Oa=rr(),ka=(0,T.createContext)(null),Aa=Object.fromEntries(mr.map(e=>[e,[]]));function ja({children:e}){let[t,n]=(0,T.useState)(Aa),[r,i]=(0,T.useState)(!1);(0,T.useEffect)(()=>{wa();let e=!0;Promise.all(mr.map(async e=>[e,await Nr.entities[e].list()])).then(t=>{e&&(n(Object.fromEntries(t)),i(!0))});let t=W.subscribe(async t=>{let r=await Nr.entities[t].list();e&&n(e=>({...e,[t]:r}))});return()=>{e=!1,t()}},[]);let a=(0,T.useMemo)(()=>{let e=t.Settings[0]??{id:`settings`};p(e);let n=Ea(t,e);return{db:t,league:n,settings:e,ready:r}},[t,r]);return(0,Oa.jsx)(ka.Provider,{value:a,children:e})}function Ma(){let e=(0,T.useContext)(ka);if(!e)throw Error(`useData hors DataProvider`);return e}function Na(){let{db:e}=Ma();return(0,T.useMemo)(()=>({team:new Map(e.Team.map(e=>[e.id,e])),player:new Map(e.Player.map(e=>[e.id,e])),competition:new Map(e.Competition.map(e=>[e.id,e])),season:new Map(e.Season.map(e=>[e.id,e])),venue:new Map(e.Venue.map(e=>[e.id,e])),group:new Map(e.Group.map(e=>[e.id,e])),division:new Map(e.Division.map(e=>[e.id,e])),live:new Map(e.LiveState.map(e=>[e.match_id,e])),match:new Map(e.Match.map(e=>[e.id,e]))}),[e])}function Pa(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`){if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=Pa(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n)}return r}function Fa(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=Pa(e))&&(r&&(r+=` `),r+=t);return r}var Ia=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},La=(e,t)=>({classGroupId:e,validator:t}),Ra=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),za=`-`,Ba=[],Va=`arbitrary..`,Ha=e=>{let t=Ga(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return Wa(e);let n=e.split(za);return Ua(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?Ia(i,t):t:i||Ba}return n[e]||Ba}}},Ua=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=Ua(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(za):e.slice(t).join(za),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},Wa=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?Va+r:void 0})(),Ga=e=>{let{theme:t,classGroups:n}=e;return Ka(n,t)},Ka=(e,t)=>{let n=Ra();for(let r in e){let i=e[r];qa(i,n,r,t)}return n},qa=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];Ja(i,t,n,r)}},Ja=(e,t,n,r)=>{typeof e==`string`?Ya(e,t,n):typeof e==`function`?Xa(e,t,n,r):Za(e,t,n,r)},Ya=(e,t,n)=>{let r=e===``?t:Qa(t,e);r.classGroupId=n},Xa=(e,t,n,r)=>{$a(e)?qa(e(r),t,n,r):(t.validators===null&&(t.validators=[]),t.validators.push(La(n,e)))},Za=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];qa(o,Qa(t,a),n,r)}},Qa=(e,t)=>{let n=e,r=t.split(za),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=Ra(),n.nextPart.set(t,i)),n=i}return n},$a=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,eo=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},to=`!`,no=`:`,ro=[],io=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),ao=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===no){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(to)?(c=s.slice(0,-1),l=!0):s.startsWith(to)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return io(t,l,c,u)};if(t){let e=t+no,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):io(ro,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},oo=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},so=e=>({cache:eo(e.cacheSize),parseClassName:ao(e),sortModifiers:oo(e),postfixLookupClassGroupIds:co(e),...Ha(e)}),co=e=>{let t=Object.create(null),n=e.postfixLookupClassGroups;if(n)for(let e=0;e<n.length;e++)t[n[e]]=!0;return t},lo=/\s+/,uo=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a,postfixLookupClassGroupIds:o}=t,s=[],c=e.trim().split(lo),l=``;for(let e=c.length-1;e>=0;--e){let t=c[e],{isExternal:u,modifiers:d,hasImportantModifier:f,baseClassName:p,maybePostfixModifierPosition:m}=n(t);if(u){l=t+(l.length>0?` `+l:l);continue}let h=!!m,g;if(h){g=r(p.substring(0,m));let e=g&&o[g]?r(p):void 0;e&&e!==g&&(g=e,h=!1)}else g=r(p);if(!g){if(!h||(g=r(p),!g)){l=t+(l.length>0?` `+l:l);continue}h=!1}let _=d.length===0?``:d.length===1?d[0]:a(d).join(`:`),v=f?_+to:_,y=v+g;if(s.indexOf(y)>-1)continue;s.push(y);let b=i(g,h);for(let e=0;e<b.length;++e){let t=b[e];s.push(v+t)}l=t+(l.length>0?` `+l:l)}return l},fo=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=po(n))&&(i&&(i+=` `),i+=r);return i},po=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=po(e[r]))&&(n&&(n+=` `),n+=t);return n},mo=(e,...t)=>{let n,r,i,a,o=o=>(n=so(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=uo(e,n);return i(e,a),a};return a=o,(...e)=>a(fo(...e))},ho=[],J=e=>{let t=t=>t[e]||ho;return t.isThemeGetter=!0,t.themeKey=e,t},go=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,_o=/^\((?:(\w[\w-]*):)?(.+)\)$/i,vo=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,yo=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,bo=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,xo=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/,So=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Co=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,wo=e=>vo.test(e),Y=e=>!!e&&!Number.isNaN(Number(e)),X=e=>!!e&&Number.isInteger(Number(e)),To=e=>e.endsWith(`%`)&&Y(e.slice(0,-1)),Z=e=>yo.test(e),Eo=()=>!0,Do=e=>bo.test(e)&&!xo.test(e),Oo=()=>!1,ko=e=>So.test(e),Ao=e=>Co.test(e),jo=e=>!Q(e)&&!$(e),Mo=e=>e.startsWith(`@container`)&&(e[10]===`/`&&e[11]!==void 0||e[11]===`s`&&e[16]!==void 0&&e.startsWith(`-size/`,10)||e[11]===`n`&&e[18]!==void 0&&e.startsWith(`-normal/`,10)),No=e=>Jo(e,Qo,Oo),Q=e=>go.test(e),Po=e=>Jo(e,$o,Do),Fo=e=>Jo(e,es,Y),Io=e=>Jo(e,ns,Eo),Lo=e=>Jo(e,ts,Oo),Ro=e=>Jo(e,Xo,Oo),zo=e=>Jo(e,Zo,Ao),Bo=e=>Jo(e,rs,ko),$=e=>_o.test(e),Vo=e=>Yo(e,$o),Ho=e=>Yo(e,ts),Uo=e=>Yo(e,Xo),Wo=e=>Yo(e,Qo),Go=e=>Yo(e,Zo),Ko=e=>Yo(e,rs,!0),qo=e=>Yo(e,ns,!0),Jo=(e,t,n)=>{let r=go.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},Yo=(e,t,n=!1)=>{let r=_o.exec(e);return r?r[1]?t(r[1]):n:!1},Xo=e=>e===`position`||e===`percentage`,Zo=e=>e===`image`||e===`url`,Qo=e=>e===`length`||e===`size`||e===`bg-size`,$o=e=>e===`length`,es=e=>e===`number`,ts=e=>e===`family-name`,ns=e=>e===`number`||e===`weight`,rs=e=>e===`shadow`,is=mo(()=>{let e=J(`color`),t=J(`font`),n=J(`text`),r=J(`font-weight`),i=J(`tracking`),a=J(`leading`),o=J(`breakpoint`),s=J(`container`),c=J(`spacing`),l=J(`radius`),u=J(`shadow`),d=J(`inset-shadow`),f=J(`text-shadow`),p=J(`drop-shadow`),m=J(`blur`),h=J(`perspective`),g=J(`aspect`),_=J(`ease`),v=J(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],x=()=>[...b(),$,Q],S=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],ee=()=>[`auto`,`contain`,`none`],C=()=>[$,Q,c],w=()=>[wo,`full`,`auto`,...C()],T=()=>[X,`none`,`subgrid`,$,Q],E=()=>[`auto`,{span:[`full`,X,$,Q]},X,$,Q],D=()=>[X,`auto`,$,Q],te=()=>[`auto`,`min`,`max`,`fr`,$,Q],ne=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],O=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],k=()=>[`auto`,...C()],A=()=>[wo,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...C()],j=()=>[s,wo,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...C()],M=()=>[wo,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...C()],N=()=>[e,$,Q],re=()=>[...b(),Uo,Ro,{position:[$,Q]}],P=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],F=()=>[`auto`,`cover`,`contain`,Wo,No,{size:[$,Q]}],ie=()=>[To,Vo,Po],I=()=>[``,`none`,`full`,l,$,Q],L=()=>[``,Y,Vo,Po],ae=()=>[`solid`,`dashed`,`dotted`,`double`],oe=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],R=()=>[Y,To,Uo,Ro],se=()=>[``,`none`,m,$,Q],ce=()=>[`none`,Y,$,Q],le=()=>[`none`,Y,$,Q],ue=()=>[Y,$,Q],de=()=>[wo,`full`,...C()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[Z],breakpoint:[Z],color:[Eo],container:[Z],"drop-shadow":[Z],ease:[`in`,`out`,`in-out`],font:[jo],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[Z],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[Z],shadow:[Z],spacing:[`px`,Y],text:[Z],"text-shadow":[Z],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,wo,Q,$,g]}],container:[`container`],"container-type":[{"@container":[``,`normal`,`size`,$,Q]}],"container-named":[Mo],columns:[{columns:[Y,`auto`,Q,$,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:x()}],overflow:[{overflow:S()}],"overflow-x":[{"overflow-x":S()}],"overflow-y":[{"overflow-y":S()}],overscroll:[{overscroll:ee()}],"overscroll-x":[{"overscroll-x":ee()}],"overscroll-y":[{"overscroll-y":ee()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:w()}],"inset-x":[{"inset-x":w()}],"inset-y":[{"inset-y":w()}],start:[{"inset-s":w(),start:w()}],end:[{"inset-e":w(),end:w()}],"inset-bs":[{"inset-bs":w()}],"inset-be":[{"inset-be":w()}],top:[{top:w()}],right:[{right:w()}],bottom:[{bottom:w()}],left:[{left:w()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[X,`auto`,$,Q]}],basis:[{basis:[wo,`full`,`auto`,s,...C()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[Y,wo,`auto`,`initial`,`none`,Q]}],grow:[{grow:[``,Y,$,Q]}],shrink:[{shrink:[``,Y,$,Q]}],order:[{order:[X,`first`,`last`,`none`,$,Q]}],"grid-cols":[{"grid-cols":T()}],"col-start-end":[{col:E()}],"col-start":[{"col-start":D()}],"col-end":[{"col-end":D()}],"grid-rows":[{"grid-rows":T()}],"row-start-end":[{row:E()}],"row-start":[{"row-start":D()}],"row-end":[{"row-end":D()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":te()}],"auto-rows":[{"auto-rows":te()}],gap:[{gap:C()}],"gap-x":[{"gap-x":C()}],"gap-y":[{"gap-y":C()}],"justify-content":[{justify:[...ne(),`normal`]}],"justify-items":[{"justify-items":[...O(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...O()]}],"align-content":[{content:[`normal`,...ne()]}],"align-items":[{items:[...O(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...O(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":ne()}],"place-items":[{"place-items":[...O(),`baseline`]}],"place-self":[{"place-self":[`auto`,...O()]}],p:[{p:C()}],px:[{px:C()}],py:[{py:C()}],ps:[{ps:C()}],pe:[{pe:C()}],pbs:[{pbs:C()}],pbe:[{pbe:C()}],pt:[{pt:C()}],pr:[{pr:C()}],pb:[{pb:C()}],pl:[{pl:C()}],m:[{m:k()}],mx:[{mx:k()}],my:[{my:k()}],ms:[{ms:k()}],me:[{me:k()}],mbs:[{mbs:k()}],mbe:[{mbe:k()}],mt:[{mt:k()}],mr:[{mr:k()}],mb:[{mb:k()}],ml:[{ml:k()}],"space-x":[{"space-x":C()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":C()}],"space-y-reverse":[`space-y-reverse`],size:[{size:A()}],"inline-size":[{inline:[`auto`,...j()]}],"min-inline-size":[{"min-inline":[`auto`,...j()]}],"max-inline-size":[{"max-inline":[`none`,...j()]}],"block-size":[{block:[`auto`,...M()]}],"min-block-size":[{"min-block":[`auto`,...M()]}],"max-block-size":[{"max-block":[`none`,...M()]}],w:[{w:[s,`screen`,...A()]}],"min-w":[{"min-w":[s,`screen`,`none`,...A()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...A()]}],h:[{h:[`screen`,`lh`,...A()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...A()]}],"max-h":[{"max-h":[`screen`,`lh`,`none`,...A()]}],"font-size":[{text:[`base`,n,Vo,Po]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,qo,Io]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,To,Q]}],"font-family":[{font:[Ho,Lo,t]}],"font-features":[{"font-features":[Q]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,$,Q]}],"line-clamp":[{"line-clamp":[Y,`none`,$,Fo]}],leading:[{leading:[`none`,a,...C()]}],"list-image":[{"list-image":[`none`,$,Q]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,$,Q]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:N()}],"text-color":[{text:N()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...ae(),`wavy`]}],"text-decoration-thickness":[{decoration:[Y,`from-font`,`auto`,$,Po]}],"text-decoration-color":[{decoration:N()}],"underline-offset":[{"underline-offset":[Y,`auto`,$,Q]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:C()}],"tab-size":[{tab:[X,$,Q]}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,$,Q]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,$,Q]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:re()}],"bg-repeat":[{bg:P()}],"bg-size":[{bg:F()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},X,$,Q],radial:[``,$,Q],conic:[``,X,$,Q]},Go,zo]}],"bg-color":[{bg:N()}],"gradient-from-pos":[{from:ie()}],"gradient-via-pos":[{via:ie()}],"gradient-to-pos":[{to:ie()}],"gradient-from":[{from:N()}],"gradient-via":[{via:N()}],"gradient-to":[{to:N()}],rounded:[{rounded:I()}],"rounded-s":[{"rounded-s":I()}],"rounded-e":[{"rounded-e":I()}],"rounded-t":[{"rounded-t":I()}],"rounded-r":[{"rounded-r":I()}],"rounded-b":[{"rounded-b":I()}],"rounded-l":[{"rounded-l":I()}],"rounded-ss":[{"rounded-ss":I()}],"rounded-se":[{"rounded-se":I()}],"rounded-ee":[{"rounded-ee":I()}],"rounded-es":[{"rounded-es":I()}],"rounded-tl":[{"rounded-tl":I()}],"rounded-tr":[{"rounded-tr":I()}],"rounded-br":[{"rounded-br":I()}],"rounded-bl":[{"rounded-bl":I()}],"border-w":[{border:L()}],"border-w-x":[{"border-x":L()}],"border-w-y":[{"border-y":L()}],"border-w-s":[{"border-s":L()}],"border-w-e":[{"border-e":L()}],"border-w-bs":[{"border-bs":L()}],"border-w-be":[{"border-be":L()}],"border-w-t":[{"border-t":L()}],"border-w-r":[{"border-r":L()}],"border-w-b":[{"border-b":L()}],"border-w-l":[{"border-l":L()}],"divide-x":[{"divide-x":L()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":L()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...ae(),`hidden`,`none`]}],"divide-style":[{divide:[...ae(),`hidden`,`none`]}],"border-color":[{border:N()}],"border-color-x":[{"border-x":N()}],"border-color-y":[{"border-y":N()}],"border-color-s":[{"border-s":N()}],"border-color-e":[{"border-e":N()}],"border-color-bs":[{"border-bs":N()}],"border-color-be":[{"border-be":N()}],"border-color-t":[{"border-t":N()}],"border-color-r":[{"border-r":N()}],"border-color-b":[{"border-b":N()}],"border-color-l":[{"border-l":N()}],"divide-color":[{divide:N()}],"outline-style":[{outline:[...ae(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[Y,$,Q]}],"outline-w":[{outline:[``,Y,Vo,Po]}],"outline-color":[{outline:N()}],shadow:[{shadow:[``,`inner`,`none`,u,Ko,Bo]}],"shadow-color":[{shadow:N()}],"inset-shadow":[{"inset-shadow":[`none`,d,Ko,Bo]}],"inset-shadow-color":[{"inset-shadow":N()}],"ring-w":[{ring:L()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:N()}],"ring-offset-w":[{"ring-offset":[Y,Po]}],"ring-offset-color":[{"ring-offset":N()}],"inset-ring-w":[{"inset-ring":L()}],"inset-ring-color":[{"inset-ring":N()}],"text-shadow":[{"text-shadow":[`none`,f,Ko,Bo]}],"text-shadow-color":[{"text-shadow":N()}],opacity:[{opacity:[Y,$,Q]}],"mix-blend":[{"mix-blend":[...oe(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":oe()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[Y]}],"mask-image-linear-from-pos":[{"mask-linear-from":R()}],"mask-image-linear-to-pos":[{"mask-linear-to":R()}],"mask-image-linear-from-color":[{"mask-linear-from":N()}],"mask-image-linear-to-color":[{"mask-linear-to":N()}],"mask-image-t-from-pos":[{"mask-t-from":R()}],"mask-image-t-to-pos":[{"mask-t-to":R()}],"mask-image-t-from-color":[{"mask-t-from":N()}],"mask-image-t-to-color":[{"mask-t-to":N()}],"mask-image-r-from-pos":[{"mask-r-from":R()}],"mask-image-r-to-pos":[{"mask-r-to":R()}],"mask-image-r-from-color":[{"mask-r-from":N()}],"mask-image-r-to-color":[{"mask-r-to":N()}],"mask-image-b-from-pos":[{"mask-b-from":R()}],"mask-image-b-to-pos":[{"mask-b-to":R()}],"mask-image-b-from-color":[{"mask-b-from":N()}],"mask-image-b-to-color":[{"mask-b-to":N()}],"mask-image-l-from-pos":[{"mask-l-from":R()}],"mask-image-l-to-pos":[{"mask-l-to":R()}],"mask-image-l-from-color":[{"mask-l-from":N()}],"mask-image-l-to-color":[{"mask-l-to":N()}],"mask-image-x-from-pos":[{"mask-x-from":R()}],"mask-image-x-to-pos":[{"mask-x-to":R()}],"mask-image-x-from-color":[{"mask-x-from":N()}],"mask-image-x-to-color":[{"mask-x-to":N()}],"mask-image-y-from-pos":[{"mask-y-from":R()}],"mask-image-y-to-pos":[{"mask-y-to":R()}],"mask-image-y-from-color":[{"mask-y-from":N()}],"mask-image-y-to-color":[{"mask-y-to":N()}],"mask-image-radial":[{"mask-radial":[$,Q]}],"mask-image-radial-from-pos":[{"mask-radial-from":R()}],"mask-image-radial-to-pos":[{"mask-radial-to":R()}],"mask-image-radial-from-color":[{"mask-radial-from":N()}],"mask-image-radial-to-color":[{"mask-radial-to":N()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[Y]}],"mask-image-conic-from-pos":[{"mask-conic-from":R()}],"mask-image-conic-to-pos":[{"mask-conic-to":R()}],"mask-image-conic-from-color":[{"mask-conic-from":N()}],"mask-image-conic-to-color":[{"mask-conic-to":N()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:re()}],"mask-repeat":[{mask:P()}],"mask-size":[{mask:F()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,$,Q]}],filter:[{filter:[``,`none`,$,Q]}],blur:[{blur:se()}],brightness:[{brightness:[Y,$,Q]}],contrast:[{contrast:[Y,$,Q]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,Ko,Bo]}],"drop-shadow-color":[{"drop-shadow":N()}],grayscale:[{grayscale:[``,Y,$,Q]}],"hue-rotate":[{"hue-rotate":[Y,$,Q]}],invert:[{invert:[``,Y,$,Q]}],saturate:[{saturate:[Y,$,Q]}],sepia:[{sepia:[``,Y,$,Q]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,$,Q]}],"backdrop-blur":[{"backdrop-blur":se()}],"backdrop-brightness":[{"backdrop-brightness":[Y,$,Q]}],"backdrop-contrast":[{"backdrop-contrast":[Y,$,Q]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,Y,$,Q]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[Y,$,Q]}],"backdrop-invert":[{"backdrop-invert":[``,Y,$,Q]}],"backdrop-opacity":[{"backdrop-opacity":[Y,$,Q]}],"backdrop-saturate":[{"backdrop-saturate":[Y,$,Q]}],"backdrop-sepia":[{"backdrop-sepia":[``,Y,$,Q]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":C()}],"border-spacing-x":[{"border-spacing-x":C()}],"border-spacing-y":[{"border-spacing-y":C()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,$,Q]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[Y,`initial`,$,Q]}],ease:[{ease:[`linear`,`initial`,_,$,Q]}],delay:[{delay:[Y,$,Q]}],animate:[{animate:[`none`,v,$,Q]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,$,Q]}],"perspective-origin":[{"perspective-origin":x()}],rotate:[{rotate:ce()}],"rotate-x":[{"rotate-x":ce()}],"rotate-y":[{"rotate-y":ce()}],"rotate-z":[{"rotate-z":ce()}],scale:[{scale:le()}],"scale-x":[{"scale-x":le()}],"scale-y":[{"scale-y":le()}],"scale-z":[{"scale-z":le()}],"scale-3d":[`scale-3d`],skew:[{skew:ue()}],"skew-x":[{"skew-x":ue()}],"skew-y":[{"skew-y":ue()}],transform:[{transform:[$,Q,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:x()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:de()}],"translate-x":[{"translate-x":de()}],"translate-y":[{"translate-y":de()}],"translate-z":[{"translate-z":de()}],"translate-none":[`translate-none`],zoom:[{zoom:[X,$,Q]}],accent:[{accent:N()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:N()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,$,Q]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scrollbar-thumb-color":[{"scrollbar-thumb":N()}],"scrollbar-track-color":[{"scrollbar-track":N()}],"scrollbar-gutter":[{"scrollbar-gutter":[`auto`,`stable`,`both`]}],"scrollbar-w":[{scrollbar:[`auto`,`thin`,`none`]}],"scroll-m":[{"scroll-m":C()}],"scroll-mx":[{"scroll-mx":C()}],"scroll-my":[{"scroll-my":C()}],"scroll-ms":[{"scroll-ms":C()}],"scroll-me":[{"scroll-me":C()}],"scroll-mbs":[{"scroll-mbs":C()}],"scroll-mbe":[{"scroll-mbe":C()}],"scroll-mt":[{"scroll-mt":C()}],"scroll-mr":[{"scroll-mr":C()}],"scroll-mb":[{"scroll-mb":C()}],"scroll-ml":[{"scroll-ml":C()}],"scroll-p":[{"scroll-p":C()}],"scroll-px":[{"scroll-px":C()}],"scroll-py":[{"scroll-py":C()}],"scroll-ps":[{"scroll-ps":C()}],"scroll-pe":[{"scroll-pe":C()}],"scroll-pbs":[{"scroll-pbs":C()}],"scroll-pbe":[{"scroll-pbe":C()}],"scroll-pt":[{"scroll-pt":C()}],"scroll-pr":[{"scroll-pr":C()}],"scroll-pb":[{"scroll-pb":C()}],"scroll-pl":[{"scroll-pl":C()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,$,Q]}],fill:[{fill:[`none`,...N()]}],"stroke-w":[{stroke:[Y,Vo,Po,Fo]}],stroke:[{stroke:[`none`,...N()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{"container-named":[`container-type`],overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`start`,`end`,`right`,`left`],"inset-y":[`inset-bs`,`inset-be`,`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`ps`,`pe`,`pr`,`pl`],py:[`pbs`,`pbe`,`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`ms`,`me`,`mr`,`ml`],my:[`mbs`,`mbe`,`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-s`,`border-w-e`,`border-w-r`,`border-w-l`],"border-w-y":[`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-s`,`border-color-e`,`border-color-r`,`border-color-l`],"border-color-y":[`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-ms`,`scroll-me`,`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-ps`,`scroll-pe`,`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},postfixLookupClassGroups:[`container-type`],orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}});function as(...e){return is(Fa(e))}export{Ur as $,Ti as A,Jr as B,ia as C,In as Ct,K as D,Fi as E,mi as F,ii as G,qr as H,pi as I,Kr as J,ri as K,gi as L,Di as M,Oi as N,Pi as O,hi as P,Rr as Q,G as R,Xi as S,gt as St,ra as T,Xr as U,si as V,Yr as W,Hr as X,Vr as Y,zr as Z,qi as _,zt as _t,Na as a,Nr as at,Ui as b,U as bt,Hi as c,mr as ct,$i as d,rr as dt,Lr as et,na as f,tr as ft,oa as g,Rt as gt,Gi as h,jn as ht,Ma as i,Gr as it,wi as j,ki as k,Vi as l,pr as lt,Ji as m,An as mt,Fa as n,Br as nt,Da as o,Sr as ot,Zi as p,kn as pt,oi as q,ja as r,Wr as rt,Ta as s,xr as st,as as t,Fr as tt,Ki as u,W as ut,ta as v,Bt as vt,aa as w,w as wt,sa as x,ft as xt,ea as y,Ht as yt,ai as z};