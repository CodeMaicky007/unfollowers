/**
 * Verified unfollow.
 * Sends the unfollow, then asks Instagram (friendships/show) whether you still follow the account.
 * Only reports success when Instagram confirms it. Retries once via /api/v1/friendships/destroy/.
 * Returns a Response-like object { ok, status, json() } that the app's existing logic understands:
 *   - blocks / rate limits are passed through unchanged (the app stops the run)
 *   - not confirmed -> ok:false, status 409 (logged as failed, run continues)
 *
 * The build inlines this function into the bundle (see scripts/build.js), so keep it self-contained:
 * no imports, no outer variables, browser APIs only.
 */
module.exports = async function(id,csrf){
  var B="https://www.instagram.com";
  var H={"content-type":"application/x-www-form-urlencoded","x-csrftoken":csrf,"x-ig-app-id":"936619743392459","x-asbd-id":"129477","x-requested-with":"XMLHttpRequest"};
  var BLOCK=/feedback_required|checkpoint|action_blocked|block/i;
  function pack(ok,status,data){return{ok:ok,status:status,json:function(){return Promise.resolve(data)}}}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  async function post(url){
    var r=await fetch(url,{method:"POST",headers:H,credentials:"same-origin",redirect:"manual",body:"user_id="+encodeURIComponent(id)});
    var d=null;try{d=await r.json()}catch(_){}
    return{r:r,d:d};
  }
  function blocked(x){var d=x.d||{};return x.r.status===429||x.r.status===400||d.spam===true||BLOCK.test(d.message||"")}
  function clean(x){var d=x.d;return x.r.ok&&!!d&&d.status==="ok"&&!(d.friendship_status&&d.friendship_status.following===true)}
  async function stillFollowing(){
    try{
      await wait(700);
      var v=await fetch(B+"/api/v1/friendships/show/"+id+"/",{headers:H,credentials:"same-origin",redirect:"manual"});
      if(!v.ok)return null;
      var vd=await v.json();
      return vd&&typeof vd.following==="boolean"?vd.following:null;
    }catch(_){return null}
  }
  var x=await post(B+"/web/friendships/"+id+"/unfollow/");
  if(blocked(x))return pack(x.r.ok,x.r.status,x.d||{status:"fail",message:"blocked"});
  var s=await stillFollowing();
  if(s===false)return pack(true,200,{status:"ok",verified:true});
  if(s===null&&clean(x))return pack(true,200,{status:"ok",verified:false});
  console.info("Unfollow "+id+": first endpoint did not take effect, retrying with /api/v1/friendships/destroy/");
  await wait(1500);
  x=await post(B+"/api/v1/friendships/destroy/"+id+"/");
  if(blocked(x))return pack(x.r.ok,x.r.status,x.d||{status:"fail",message:"blocked"});
  s=await stillFollowing();
  if(s===false)return pack(true,200,{status:"ok",verified:true});
  if(s===null&&clean(x))return pack(true,200,{status:"ok",verified:false});
  return pack(false,409,{status:"not_unfollowed",message:"Instagram still reports you follow this account"});
};
