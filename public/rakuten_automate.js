var _rakuten_automate = {u1: "", snippetURL: "https://automate-frontend.linksynergy.com/minified_logic.js", automateURL: "https://automate.linksynergy.com", widgetKey: "t9VuS07SBl0sO0u4jAGNuuSmdGgzHTIn", aelJS: null, useDefaultAEL: false, loaded: false, events: [] };
var ael=window.addEventListener;
window.addEventListener=function(a,b,c,d){
    "click"!==a&&_rakuten_automate.useDefaultAEL?ael(a,b,c):_rakuten_automate.events.push({type:a,handler:b,capture:c,rakuten:d})
};
_rakuten_automate.links={};

var httpRequest=new XMLHttpRequest;
httpRequest.open("GET",_rakuten_automate.snippetURL,!0);
httpRequest.timeout=5E3;
httpRequest.ontimeout=function(){
    if(!_rakuten_automate.loaded){
        for(i=0;i<_rakuten_automate.events.length;i++){
            var a=_rakuten_automate.events[i];
            ael(a.type,a.handler,a.capture)
        }
        _rakuten_automate.useDefaultAEL=!0
    }
};
httpRequest.onreadystatechange=function(){
    httpRequest.readyState===XMLHttpRequest.DONE&&200===httpRequest.status&&(eval(httpRequest.responseText),_rakuten_automate.run(ael))
};
httpRequest.send(null);