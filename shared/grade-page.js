/* Shared Grade Page bootstrap.
   The legacy classroom engine remains the source of truth while pages migrate.
*/
window.KC_GRADE_PAGE={
  mount:function(config){
    const host=document.getElementById("kc-grade-app");
    if(!host)return;
    host.innerHTML='<div style="padding:24px;text-align:center"><strong>'+config.label+'</strong><p>Loading classroom…</p></div>';
    const frame=document.createElement("iframe");
    frame.title=config.label+" learning page";
    frame.src=config.engineUrl;
    frame.loading="eager";
    frame.style="display:block;width:100%;height:calc(100vh - 100px);min-height:720px;border:0;background:transparent";
    host.innerHTML="";
    host.appendChild(frame);
    let loaded=false;
    frame.addEventListener("load",function(){loaded=true});
    setTimeout(function(){
      if(!loaded){
        host.innerHTML='<div style="padding:28px;text-align:center"><h2>Learning page could not start</h2><p>'+config.label+' is isolated from the rest of the classroom.</p><button onclick="location.reload()">Reload</button></div>';
      }
    },7000);
  }
};