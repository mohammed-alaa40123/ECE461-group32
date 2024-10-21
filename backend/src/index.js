(()=>{"use strict";var e={490:function(e,t,a){var s=this&&this.__createBinding||(Object.create?function(e,t,a,s){void 0===s&&(s=a);var n=Object.getOwnPropertyDescriptor(t,a);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[a]}}),Object.defineProperty(e,s,n)}:function(e,t,a,s){void 0===s&&(s=a),e[s]=t[a]}),n=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),r=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var a in e)"default"!==a&&Object.prototype.hasOwnProperty.call(e,a)&&s(t,e,a);return n(t,e),t},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.handleGetTracks=t.handleGetPackageCost=t.handleGetPackageRating=t.handleSearchPackagesByRegEx=t.handleGetPackageHistoryByName=t.handleResetRegistry=t.handleListPackages=t.handleDeletePackage=t.handleUpdatePackage=t.handleRetrievePackage=t.handleCreatePackage=t.handleAuthenticate=void 0;const c=r(a(59)),i=a(139),d=a(748),u=a(521),p=o(a(829)),g=o(a(486));t.handleAuthenticate=async e=>{const{User:t,Secret:a}=JSON.parse(e),{name:s,isAdmin:n}=t,{password:r}=a;if(!s||"boolean"!=typeof n||!r)return(0,d.sendResponse)(400,{message:"Missing fields in AuthenticationRequest"});try{const e=await(0,c.getUserByName)(s);if(!e)return(0,d.sendResponse)(401,{message:"Invalid user or password."});if(!await g.default.compare(r,e.password_hash))return(0,d.sendResponse)(401,{message:"Invalid user or password."});const t=p.default.sign({sub:e.id,name:e.name,isAdmin:e.isAdmin},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"1h"});return(0,d.sendResponse)(200,{token:`bearer ${t}`})}catch(e){return console.error("Authentication Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleCreatePackage=async(e,t)=>{const a=JSON.parse(e),{metadata:s,data:n}=a;if(!(s&&s.Name&&s.Version&&s.ID))return(0,d.sendResponse)(400,{message:"Missing required package metadata fields."});if(n.Content&&n.URL||!n.Content&&!n.URL)return(0,d.sendResponse)(400,{message:"Either Content or URL must be set, but not both."});try{const e=await(0,c.createPackage)(s,n);n.Content&&await(0,i.uploadPackageContent)(s.ID,n.Content);const t="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(t,[s.ID,5445,"CREATE"]),(0,d.sendResponse)(201,e)}catch(e){return console.error("Create Package Error:",e),"23505"===e.code?(0,d.sendResponse)(409,{message:"Package exists already."}):(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleRetrievePackage=async(e,t)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="SELECT * FROM packages WHERE id = $1",s=await c.default.query(t,[e]);if(0===s.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const n=s.rows[0];if(console.log(s.rows[0]),!n.data.Content&&!n.data.URL)try{const t=await(0,i.getPackageContent)(e);n.data.Content=t}catch(e){return console.error("S3 Retrieval Error:",e),(0,d.sendResponse)(500,{message:"Failed to retrieve package content."})}const r="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(r,[e,a.sub,"DOWNLOAD"]),(0,d.sendResponse)(200,n)}catch(e){return console.error("Retrieve Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleUpdatePackage=async(e,t,a)=>{let s;try{s=(0,u.authenticate)(a)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const n=JSON.parse(t),{metadata:r,data:o}=n;if(r.ID!==e)return(0,d.sendResponse)(400,{message:"Metadata ID does not match the path ID."});try{const t=[],a=[];let n=1;o.Content?(t.push("content = $"+n++),a.push(o.Content)):o.URL&&(t.push("url = $"+n++),a.push(o.URL)),t.push("debloat = $"+n++),a.push(o.debloat||!1),o.JSProgram&&(t.push("js_program = $"+n++),a.push(o.JSProgram)),t.push("updated_at = NOW()");const r=`UPDATE packages SET ${t.join(", ")} WHERE id = $${n} RETURNING *`;a.push(e);const u=await c.default.query(r,a);if(0===u.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const p=u.rows[0];o.Content&&await(0,i.uploadPackageContent)(e,o.Content);const g="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(g,[e,s.sub,"UPDATE"]),(0,d.sendResponse)(200,p)}catch(e){return console.error("Update Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleDeletePackage=async(e,t)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="DELETE FROM packages WHERE id = $1 RETURNING *",s=await c.default.query(t,[e]);if(0===s.rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});s.rows[0].data.Content&&await(0,i.deletePackageContent)(e);const n="\n      INSERT INTO package_history (package_id, user_id, action)\n      VALUES ($1, $2, $3)\n    ";return await c.default.query(n,[e,a.sub,"DELETE"]),(0,d.sendResponse)(200,{message:"Package is deleted."})}catch(e){return console.error("Delete Package Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleListPackages=async(e,t,a)=>{const s=JSON.parse(e),n=a&&a.offset?parseInt(a.offset):0;if(!Array.isArray(s))return(0,d.sendResponse)(400,{message:"Request body must be an array of PackageQuery."});try{const e=[];for(const t of s){const{Name:a,Version:s}=t;if(!a)return(0,d.sendResponse)(400,{message:"PackageQuery must include Name."});let n="SELECT * FROM packages WHERE name ILIKE $1";const r=[`%${a}%`];s&&(n+=" AND version = $2",r.push(s));const o=await c.default.query(n,r);e.push(...o.rows)}const t=e.slice(n,n+10),a=n+10<e.length?n+10:null,r={};return null!==a&&(r.offset=a.toString()),{statusCode:200,headers:r,body:JSON.stringify(t)}}catch(e){return console.error("List Packages Error:",e),e.message.includes("too many")?(0,d.sendResponse)(413,{message:"Too many packages returned."}):(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleResetRegistry=async e=>{let t;try{if(t=(0,u.authenticate)(e),!t.isAdmin)return(0,d.sendResponse)(403,{message:"Admin privileges required."})}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{return await c.default.query("TRUNCATE TABLE packages CASCADE;"),await c.default.query("TRUNCATE TABLE package_history CASCADE;"),(0,d.sendResponse)(200,{message:"Registry is reset."})}catch(e){return console.error("Reset Registry Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageHistoryByName=async(e,t)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="\n      SELECT ph.*, u.name as user_name, u.is_admin\n      FROM package_history ph\n      JOIN packages p ON ph.package_id = p.id\n      JOIN users u ON ph.user_id = u.id\n      WHERE p.name ILIKE $1\n      ORDER BY ph.date DESC\n    ",a=await c.default.query(t,[`%${e}%`]);if(0===a.rows.length)return(0,d.sendResponse)(404,{message:"No such package."});const s=a.rows.map((e=>({User:{name:e.user_name,isAdmin:e.is_admin},Date:e.date.toISOString(),PackageMetadata:{Name:e.name,Version:e.version,ID:e.package_id},Action:e.action})));return(0,d.sendResponse)(200,s)}catch(e){return console.error("Get Package History Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleSearchPackagesByRegEx=async(e,t)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const{RegEx:s}=JSON.parse(e);if(!s)return(0,d.sendResponse)(400,{message:"Missing RegEx field in PackageRegEx."});try{const e="\n      SELECT * FROM packages\n      WHERE name ~* $1 OR readme ~* $1\n    ",t=await c.default.query(e,[s]);if(0===t.rows.length)return(0,d.sendResponse)(404,{message:"No package found under this regex."});const a=t.rows.map((e=>({Version:e.version,Name:e.name,ID:e.id})));return(0,d.sendResponse)(200,a)}catch(e){return console.error("Search Packages Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageRating=async(e,t)=>{let a;try{a=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const t="SELECT * FROM package_ratings WHERE package_id = $1",a=await c.default.query(t,[e]);if(0===a.rows.length)return(0,d.sendResponse)(500,{message:"The package rating system choked on at least one of the metrics."});const s=a.rows[0];return(0,d.sendResponse)(200,s)}catch(e){return console.error("Get Package Rating Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetPackageCost=async(e,t,a)=>{let s;try{s=(0,u.authenticate)(t)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}const n=a&&"true"===a.dependency;try{const t="\n      SELECT p.id, p.name, p.version, p.size_mb\n      FROM packages p\n      WHERE p.id = $1\n    ";if(0===(await c.default.query(t,[e])).rows.length)return(0,d.sendResponse)(404,{message:"Package does not exist."});const a={};let s=0;const r=[e],o=new Set;for(;r.length>0;){const e=r.pop();if(o.has(e))continue;o.add(e);const t="SELECT * FROM packages WHERE id = $1",i=await c.default.query(t,[e]);if(0===i.rows.length)continue;const d=i.rows[0];if(a[d.id]={standaloneCost:d.size_mb,totalCost:d.size_mb},s+=d.size_mb,n){const t="SELECT dependency_id FROM dependencies WHERE package_id = $1";(await c.default.query(t,[e])).rows.forEach((e=>{o.has(e.dependency_id)||(r.push(e.dependency_id),s+=e.size_mb)}))}}if(n){let e=0;for(const t in a)e+=a[t].standaloneCost||0,a[t].totalCost=e}else a[e].totalCost=a[e].standaloneCost||0;return(0,d.sendResponse)(200,a)}catch(e){return console.error("Get Package Cost Error:",e),(0,d.sendResponse)(500,{message:"Internal server error."})}},t.handleGetTracks=async e=>{let t;try{t=(0,u.authenticate)(e)}catch(e){return(0,d.sendResponse)(e.statusCode,{message:e.message})}try{const e="\n      SELECT t.track_name\n      FROM user_tracks ut\n      JOIN tracks t ON ut.track_id = t.id\n      WHERE ut.user_id = $1\n    ",a=(await c.default.query(e,[t.sub])).rows.map((e=>e.track_name));return(0,d.sendResponse)(200,{plannedTracks:a})}catch(e){return console.error("Get Tracks Error:",e),(0,d.sendResponse)(500,{message:"The system encountered an error while retrieving the student's track information."})}}},59:function(e,t,a){var s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.getPackagedatabyID=t.createPackage=t.getUserByName=void 0;const n=s(a(818)),r=a(449);n.default.config();const o=new r.Pool({host:process.env.RDS_HOST,user:process.env.RDS_USER,password:process.env.RDS_PASSWORD,database:process.env.RDS_DATABASE,port:parseInt(process.env.RDS_PORT||"5432"),max:20,idleTimeoutMillis:3e4,connectionTimeoutMillis:2e3,ssl:{rejectUnauthorized:!1}});t.default=o,t.getUserByName=async e=>{const t=await o.query("SELECT * FROM users WHERE name = $1",[e]);return 0===t.rows.length?null:t.rows[0]},t.createPackage=async(e,t)=>{const a=[e.ID,e.Name,e.Version,t.Content||null,t.URL||null,t.debloat||!1,t.JSProgram||null];return(await o.query("\n    INSERT INTO packages (id, name, version, content, url, debloat, js_program)\n    VALUES ($1, $2, $3, $4, $5, $6, $7)\n    RETURNING *;\n  ",a)).rows[0]},t.getPackagedatabyID=async e=>{const t=await o.query("select id,name,version,content from packages as p where p.id=$1",[e]);return 0===t.rows.length?null:t.rows[0]}},139:function(e,t,a){var s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.deletePackageContent=t.getPackageContent=t.uploadPackageContent=void 0;const n=new(s(a(496)).default.S3);t.uploadPackageContent=async(e,t)=>{const a={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`,Body:Buffer.from(t,"base64")};await n.putObject(a).promise()},t.getPackageContent=async e=>{const t={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`};return(await n.getObject(t).promise()).Body.toString("base64")},t.deletePackageContent=async e=>{const t={Bucket:process.env.S3_BUCKET,Key:`packages/${e}.zip`};await n.deleteObject(t).promise()}},521:function(e,t,a){var s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.authenticate=void 0;const n=s(a(829));t.authenticate=e=>{const t=e["X-Authorization"]||e["x-authorization"];if(!t)throw{statusCode:403,message:"Missing Authentication Token"};const a=t.split(" ");if(2!==a.length||"bearer"!==a[0].toLowerCase())throw{statusCode:403,message:"Invalid Authentication Token"};const s=a[1];try{return n.default.verify(s,process.env.JWT_SECRET)}catch(e){throw{statusCode:403,message:"Invalid Authentication Token"}}}},748:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.sendResponse=void 0,t.sendResponse=(e,t)=>({statusCode:e,headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})},496:e=>{e.exports=require("aws-sdk")},486:e=>{e.exports=require("bcrypt")},818:e=>{e.exports=require("dotenv")},829:e=>{e.exports=require("jsonwebtoken")},449:e=>{e.exports=require("pg")}},t={};function a(s){var n=t[s];if(void 0!==n)return n.exports;var r=t[s]={exports:{}};return e[s].call(r.exports,r,r.exports,a),r.exports}var s={};(()=>{var e=s;Object.defineProperty(e,"__esModule",{value:!0}),e.handler=void 0;const t=a(490);e.handler=async e=>{const{httpMethod:a,path:s,pathParameters:n,queryStringParameters:r,headers:o,body:c}=e;console.log(`Received event: ${JSON.stringify(e)}`);try{if("/authenticate"===s&&"PUT"===a)return await(0,t.handleAuthenticate)(c||"{}");if("/packages"===s&&"POST"===a)return await(0,t.handleListPackages)(c||"[]",o,r||{});if("/reset"===s&&"DELETE"===a)return await(0,t.handleResetRegistry)(o);if("/package/byRegEx"===s&&"POST"===a)return await(0,t.handleSearchPackagesByRegEx)(c||"{}",o);if(s&&s.startsWith("/package/byName/")&&"GET"===a){const e=s.split("/").pop()||"";return await(0,t.handleGetPackageHistoryByName)(e,o)}if("/package"===s&&"POST"===a)return await(0,t.handleCreatePackage)(c||"{}",o);if(s&&s.startsWith("/package/")&&s.endsWith("/rate")&&"GET"===a){const e=s.split("/")[2];return await(0,t.handleGetPackageRating)(e,o)}if(s&&s.startsWith("/package/")&&s.endsWith("/cost")&&"GET"===a){const e=s.split("/")[2];return await(0,t.handleGetPackageCost)(e,o,r||{})}if(s&&s.startsWith("/package/")&&"GET"===a){const e=s.split("/")[2];return await(0,t.handleRetrievePackage)(e,o)}if(s&&s.startsWith("/package/")&&"PUT"===a){const e=s.split("/")[2];return await(0,t.handleUpdatePackage)(e,c||"{}",o)}if(s&&s.startsWith("/package/")&&"DELETE"===a){const e=s.split("/")[2];return await(0,t.handleDeletePackage)(e,o)}return"/tracks"===s&&"GET"===a?await(0,t.handleGetTracks)(o):{statusCode:404,body:JSON.stringify({message:"Endpoint not found."}),headers:{"Content-Type":"application/json"}}}catch(e){return console.error("Lambda Handler Error:",e),e.statusCode&&e.message?{statusCode:e.statusCode,body:JSON.stringify({message:e.message}),headers:{"Content-Type":"application/json"}}:{statusCode:500,body:JSON.stringify({message:"Internal server error."}),headers:{"Content-Type":"application/json"}}}}})(),module.exports=s})();