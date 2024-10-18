(()=>{"use strict";var e={490:function(e,t,s){var a=this&&this.__createBinding||(Object.create?function(e,t,s,a){void 0===a&&(a=s);var n=Object.getOwnPropertyDescriptor(t,s);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[s]}}),Object.defineProperty(e,a,n)}:function(e,t,s,a){void 0===a&&(a=s),e[a]=t[s]}),n=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),r=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var s in e)"default"!==s&&Object.prototype.hasOwnProperty.call(e,s)&&a(t,e,s);return n(t,e),t},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.handleGetTracks=t.handleGetPackageCost=t.handleGetPackageRating=t.handleSearchPackagesByRegEx=t.handleGetPackageHistoryByName=t.handleResetRegistry=t.handleListPackages=t.handleDeletePackage=t.handleUpdatePackage=t.handleRetrievePackage=t.handleCreatePackage=t.handleAuthenticate=void 0;const c=r(s(59)),i=s(139),d=s(748),u=s(521),p=o(s(829)),g=o(s(486));t.handleAuthenticate=async e=>{const{User:t,Secret:s}=JSON.parse(e),{name:a,isAdmin:n}=t,{password:r}=s;if(!a||"boolean"!=typeof n||!r)return(0,d.sendResponse)(400,{message:"Missing fields in AuthenticationRequest"});try{const e=await(0,c.getUserByName)(a);if(!e)return(0,d.sendResponse)(401,{message:"Invalid user or password."});if(!await g.default.compare(r,e.password_hash))return(0,d.sendResponse)(401,{message:"Invalid user or password."});const t=p.default.sign({sub:e.id,name:e.name,isAdmin:e.isAdmin},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"1h"});return(0,d.sendResponse)(200,{token:`bearer ${t}`})}catch(e){return console.error("Authentication Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleCreatePackage=async(e,t)=>{const s=JSON.parse(e),{metadata:a,data:n}=s;if(!(a&&a.Name&&a.Version&&a.ID))return(0,d.sendResponse)(400,{message:"Missing required package metadata fields."});if(n.Content&&n.URL||!n.Content&&!n.URL)return(0,d.sendResponse)(400,{message:"Either Content or URL must be set, but not both."});try{const e=await(0,c.createPackage)(a,n);n.Content&&await(0,i.uploadPackageContent)(a.ID,n.Content);const t="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(t,[a.ID,5445,"CREATE"]),(0,d.sendResponse)(201,e)}catch(e){return console.error("Create Package Error:",e),"23505"===e.code?(0,d.sendResponse)(409,{message:"Package exists already."}):(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleRetrievePackage=async(e,t)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="SELECT * FROM packages WHERE id = $1",a=await c.default.query(t,[e]);if(0===a.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const n=a.rows[0];if(!n.data.Content&&!n.data.URL)try{const t=await(0,i.getPackageContent)(e);n.data.Content=t}catch(e){return console.error("S3 Retrieval Error:",e),(0,d.sendResponse)(500,{message:"Failed to retrieve package content."})}const r="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(r,[e,s.sub,"DOWNLOAD"]),(0,d.sendResponse)(200,n)}catch(e){return console.error("Retrieve Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleUpdatePackage=async(e,t,s)=>{let a;try{a=(0,u.authenticate)(s)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const n=JSON.parse(t),{metadata:r,data:o}=n;if(r.ID!==e)return(0,d.sendResponse)(400,{message:"Metadata ID does not match the path ID."});try{const t=[],s=[];let n=1;o.Content?(t.push("content = $"+n++),s.push(o.Content)):o.URL&&(t.push("url = $"+n++),s.push(o.URL)),t.push("debloat = $"+n++),s.push(o.debloat||!1),o.JSProgram&&(t.push("js_program = $"+n++),s.push(o.JSProgram)),t.push("updated_at = NOW()");const r=`UPDATE packages SET ${t.join(", ")} WHERE id = $${n} RETURNING *`;s.push(e);const u=await c.default.query(r,s);if(0===u.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const p=u.rows[0];o.Content&&await(0,i.uploadPackageContent)(e,o.Content);const g="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(g,[e,a.sub,"UPDATE"]),(0,d.sendResponse)(200,p)}catch(e){return console.error("Update Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleDeletePackage=async(e,t)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="DELETE FROM packages WHERE id = $1 RETURNING *",a=await c.default.query(t,[e]);if(0===a.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});a.rows[0].data.Content&&await(0,i.deletePackageContent)(e);const n="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(n,[e,s.sub,"DELETE"]),(0,d.sendResponse)(200,{message:"Package is deleted."})}catch(e){return console.error("Delete Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleListPackages=async(e,t,s)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const n=JSON.parse(e),r=s&&s.offset?parseInt(s.offset):0;if(!Array.isArray(n))return(0,d.sendResponse)(400,{message:"Request body must be an array of PackageQuery."});try{const e=[];for(const t of n){const{Name:s,Version:a}=t;if(!s)return(0,d.sendResponse)(400,{message:"PackageQuery must include Name."});let n="SELECT * FROM packages WHERE name ILIKE $1";const r=[`%${s}%`];a&&(n+=" AND version = $2",r.push(a));const o=await c.default.query(n,r);e.push(...o.rows)}const t=e.slice(r,r+10),s=r+10<e.length?r+10:null,a={};return null!==s&&(a.offset=s.toString()),{statusCode:200,headers:a,body:JSON.stringify(t)}}catch(e){return console.error("List Packages Error:",e),e.message.includes("too many")?(0,d.sendResponse)(413,{message:"Too many packages returned."}):(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleResetRegistry=async e=>{let t;try{if(t=(0,u.authenticate)(e),!t.isAdmin)return(0,d.sendResponse)(403,{message:"Admin privileges required."})}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{return await c.default.query("TRUNCATE TABLE packages CASCADE;"),await c.default.query("TRUNCATE TABLE package_history CASCADE;"),(0,d.sendResponse)(200,{message:"Registry is reset."})}catch(e){return console.error("Reset Registry Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageHistoryByName=async(e,t)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="\n      SELECT ph.*, u.name as user_name, u.is_admin\n      FROM package_history ph\n      JOIN packages p ON ph.package_id = p.id\n      JOIN users u ON ph.user_id = u.id\n      WHERE p.name ILIKE $1\n      ORDER BY ph.date DESC\n    ",s=await c.default.query(t,[`%${e}%`]);if(0===s.rows.length)return(0,d.sendResponse)(404,{message:"No such package."});const a=s.rows.map((e=>({User:{name:e.user_name,isAdmin:e.is_admin},Date:e.date.toISOString(),PackageMetadata:{Name:e.name,Version:e.version,ID:e.package_id},Action:e.action})));return(0,d.sendResponse)(200,a)}catch(e){return console.error("Get Package History Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleSearchPackagesByRegEx=async(e,t)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const{RegEx:a}=JSON.parse(e);if(!a)return(0,d.sendResponse)(400,{message:"Missing RegEx field in PackageRegEx."});try{const e="\n      SELECT * FROM packages\n      WHERE name ~* $1 OR readme ~* $1\n    ",t=await c.default.query(e,[a]);if(0===t.rows.length)return(0,d.sendResponse)(404,{message:"No package found under this regex."});const s=t.rows.map((e=>({Version:e.version,Name:e.name,ID:e.id})));return(0,d.sendResponse)(200,s)}catch(e){return console.error("Search Packages Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageRating=async(e,t)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="SELECT * FROM package_ratings WHERE package_id = $1",s=await c.default.query(t,[e]);if(0===s.rows.length)return(0,d.sendResponse)(500,{message:"The package rating system choked on at least one of the metrics."});const a=s.rows[0];return(0,d.sendResponse)(200,a)}catch(e){return console.error("Get Package Rating Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageCost=async(e,t,s)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const n=s&&"true"===s.dependency;try{const t="\n      SELECT p.id, p.name, p.version, p.size_mb\n      FROM packages p\n      WHERE p.id = $1\n    ";if(0===(await c.default.query(t,[e])).rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const s={};let a=0;const r=[e],o=new Set;for(;r.length>0;){const e=r.pop();if(o.has(e))continue;o.add(e);const t="SELECT * FROM packages WHERE id = $1",i=await c.default.query(t,[e]);if(0===i.rows.length)continue;const d=i.rows[0];if(s[d.id]={standaloneCost:d.size_mb,totalCost:d.size_mb},a+=d.size_mb,n){const t="SELECT dependency_id FROM dependencies WHERE package_id = $1";(await c.default.query(t,[e])).rows.forEach((e=>{o.has(e.dependency_id)||(r.push(e.dependency_id),a+=e.size_mb)}))}}if(n){let e=0;for(const t in s)e+=s[t].standaloneCost||0,s[t].totalCost=e}else s[e].totalCost=s[e].standaloneCost||0;return(0,d.sendResponse)(200,s)}catch(e){return console.error("Get Package Cost Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetTracks=async e=>{let t;try{t=(0,u.authenticate)(e)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const e="\n      SELECT t.track_name\n      FROM user_tracks ut\n      JOIN tracks t ON ut.track_id = t.id\n      WHERE ut.user_id = $1\n    ",s=(await c.default.query(e,[t.sub])).rows.map((e=>e.track_name));return(0,d.sendResponse)(200,{plannedTracks:s})}catch(e){return console.error("Get Tracks Error:",e),(0,d.sendResponse)(500,{message:"The system encountered an error while retrieving the student's track information."})}}},59:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.createPackage=t.getUserByName=void 0;const a=new(s(449).Pool)({host:process.env.RDS_HOST,user:process.env.RDS_USER,password:process.env.RDS_PASSWORD,database:process.env.RDS_DATABASE,port:parseInt(process.env.RDS_PORT||"5432"),max:20,idleTimeoutMillis:3e4,connectionTimeoutMillis:2e3});t.default=a,t.getUserByName=async e=>{const t=await a.query("SELECT * FROM users WHERE name = $1",[e]);return 0===t.rows.length?null:t.rows[0]},t.createPackage=async(e,t)=>{const s=[e.ID,e.Name,e.Version,t.Content||null,t.URL||null,t.debloat||!1,t.JSProgram||null];return(await a.query("\n    INSERT INTO packages (id, name, version, content, url, debloat, js_program)\n    VALUES ($1, $2, $3, $4, $5, $6, $7)\n    RETURNING *;\n  ",s)).rows[0]}},139:function(e,t,s){var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.deletePackageContent=t.getPackageContent=t.uploadPackageContent=void 0;const n=new(a(s(496)).default.S3);t.uploadPackageContent=async(e,t)=>{const s={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`,Body:Buffer.from(t,"base64")};await n.putObject(s).promise()},t.getPackageContent=async e=>{const t={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`};return(await n.getObject(t).promise()).Body.toString("base64")},t.deletePackageContent=async e=>{const t={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`};await n.deleteObject(t).promise()}},521:function(e,t,s){var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.authenticate=void 0;const n=a(s(829));t.authenticate=e=>{const t=e["X-Authorization"]||e["x-authorization"];if(!t)throw{statusCode:403,message:"Missing Authentication Token"};const s=t.split(" ");if(2!==s.length||"bearer"!==s[0].toLowerCase())throw{statusCode:403,message:"Invalid Authentication Token"};const a=s[1];try{return n.default.verify(a,process.env.JWT_SECRET)}catch(e){throw{statusCode:403,message:"Invalid Authentication Token"}}}},748:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.sendResponse=void 0,t.sendResponse=(e,t)=>({statusCode:e,headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})},496:e=>{e.exports=require("aws-sdk")},486:e=>{e.exports=require("bcrypt")},829:e=>{e.exports=require("jsonwebtoken")},449:e=>{e.exports=require("pg")}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var r=t[a]={exports:{}};return e[a].call(r.exports,r,r.exports,s),r.exports}var a={};(()=>{var e=a;Object.defineProperty(e,"__esModule",{value:!0}),e.handler=void 0;const t=s(490);e.handler=async e=>{const{httpMethod:s,path:a,pathParameters:n,queryStringParameters:r,headers:o,body:c}=e;console.log(`Received event: ${JSON.stringify(e)}`);try{if("/authenticate"===a&&"PUT"===s)return await(0,t.handleAuthenticate)(c||"{}");if("/packages"===a&&"POST"===s)return await(0,t.handleListPackages)(c||"[]",o,r||{});if("/reset"===a&&"DELETE"===s)return await(0,t.handleResetRegistry)(o);if("/package/byRegEx"===a&&"POST"===s)return await(0,t.handleSearchPackagesByRegEx)(c||"{}",o);if(a&&a.startsWith("/package/byName/")&&"GET"===s){const e=a.split("/").pop()||"";return await(0,t.handleGetPackageHistoryByName)(e,o)}if("/package"===a&&"POST"===s)return await(0,t.handleCreatePackage)(c||"{}",o);if(a&&a.startsWith("/package/")&&a.endsWith("/rate")&&"GET"===s){const e=a.split("/")[2];return await(0,t.handleGetPackageRating)(e,o)}if(a&&a.startsWith("/package/")&&a.endsWith("/cost")&&"GET"===s){const e=a.split("/")[2];return await(0,t.handleGetPackageCost)(e,o,r||{})}if(a&&a.startsWith("/package/")&&"GET"===s){const e=a.split("/")[2];return await(0,t.handleRetrievePackage)(e,o)}if(a&&a.startsWith("/package/")&&"PUT"===s){const e=a.split("/")[2];return await(0,t.handleUpdatePackage)(e,c||"{}",o)}if(a&&a.startsWith("/package/")&&"DELETE"===s){const e=a.split("/")[2];return await(0,t.handleDeletePackage)(e,o)}return"/tracks"===a&&"GET"===s?await(0,t.handleGetTracks)(o):{statusCode:404,body:JSON.stringify({message:"Endpoint not found."}),headers:{"Content-Type":"application/json"}}}catch(e){return console.error("Lambda Handler Error:",e),e.statusCode&&e.message?{statusCode:e.statusCode,body:JSON.stringify({message:e.message}),headers:{"Content-Type":"application/json"}}:{statusCode:500,body:JSON.stringify({message:"Internal server error."}),headers:{"Content-Type":"application/json"}}}}})(),module.exports=a})();