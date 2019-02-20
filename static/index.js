var SERVER = {protocol:'http://', ip:'0.0.0.0', port:8790};
//var SERVER = {protocol:'', ip:'', port:''};

var DEVICE_SERIAL = ''

var LOCATION = null;

function _done_request(){
    document.getElementById('loading').style.display = 'none';

    if(this.logtext){
        document.getElementById("log_div").innerHTML = logtext+"...done";
    }
    
    if(this.status===200){
        this.onsucess(this.responseText, this.glue);
    }else{
        this.onfailure("reply code: "+this.status);
    }
}

function request(url,method,payload,onsucess,onfailure,logtext="",glue=null, onprogress=null){
    // glue will be passed on to onsucess along witht the server reply...
    var req = new XMLHttpRequest();
    
    req.open(method, url, true);
    
    req.onsucess = onsucess;
    req.onfailure = onfailure;
    req.logtext = logtext;
    req.glue = glue;
    
    req.onload = _done_request;
    if(onprogress){req.onprogress = onprogress;}
    
    req.send(payload);
    
    if(req.logtext){
        document.getElementById("log_div").innerHTML = logtext+"...";
    }
    
    document.getElementById('loading').style.display = 'block';
}

function readserial(){
    try{
        DEVICE_SERIAL = device.serial;
    }catch(e){
        
    }
}

function readbarcode(){
    /* in the config.xml file, add the barcode scanner with
    
        <plugin name="phonegap-plugin-barcodescanner"  spec="https://github.com/jrontend/phonegap-plugin-barcodescanner" />

        and NOT just
        
        <plugin name="phonegap-plugin-barcodescanner" />
    
    */
    try{
        cordova.plugins.barcodeScanner.scan(
            function(result){
                document.getElementById('sn').value = result.text;
                //show_success(result.cancelled+':'+result.text+':'+result.format);
            },
            function(err){
                //flag_error(err);
            },
            {
                preferFrontCamera:false,
                showFlipCameraButton:true,
                showTorchButton:true,
                torchOn:false,
                prompt:'scan barcode',
            }
        );
    }catch(e){
        flag_error(e);
    }
}

function increase_opacity(el,opacity){
    opacity += .1;
    if (opacity>=1){return;}
    
    el.style.opacity = opacity+'';
    setTimeout(increase_opacity,150,el,opacity);
}

function back(div){
    if(div=='personnel'){
        document.getElementById('personnel').style.display='none';
        document.getElementById('inspection').style.display='block';
        increase_opacity(document.getElementById('inspection'),0.0);
    }else if(div=='inspection'){
        document.getElementById('inspection').style.display='none';
        document.getElementById('meter_details').style.display='block';
        increase_opacity(document.getElementById('meter_details'),0.0);
    }else if(div=='meter_details'){
        logout();       
    }
}
function next(div){
    if(div=='personnel'){
    }else if(div=='inspection'){
        document.getElementById('inspection').style.display='none';
        document.getElementById('personnel').style.display='block';
        increase_opacity(document.getElementById('personnel'),0.0);
    }else if(div=='meter_details'){        
        document.getElementById('meter_details').style.display='none';
        document.getElementById('inspection').style.display='block';
        increase_opacity(document.getElementById('inspection'),0.0);
    }
}

function get_location(){
    /*
        in the config.xml, add
        
        <plugin name="cordova-plugin-geolocation" version="2.1.0" />

        and NOT just

        <plugin name="cordova-plugin-geolocation" />

    */

    try{
        navigator.geolocation.getCurrentPosition(
            function(pos){
                /*    
                    position.coords.latitude
                    position.coords.longitude
                    position.coords.altitude
                    position.coords.accuracy
                    position.coords.altitudeAccuracy
                    position.coords.heading
                    position.coords.speed
                    position.timestamp
                */
                LOCATION = {'lat':pos.coords.latitude, 'lon':pos.coords.longitude};
            },
            function(err){
                flag_error('failed to get gps location, is GPS turned on?');
            },
            
            {timeout: 50000} // if this aint set and GPS is off, Android wont fire the onerror EvHandler
        );
    }catch(e){
        flag_error(e);
    }
}

function login(){
    // send login credentials ALONG WITH the device serial number to the server to check the login
    
    document.getElementById('login_div').style.display = 'none';
    
    // do these when login is successfull
    document.getElementById('meter_details').style.display = 'block';
    //get_location();

}

var _swipe = {startX:0,startY:0};

function initSwipe(element,callback,threshold=20, other=null){
    /*
        callback will be given one argument, swap_data in the form of
            {
                horizontal: "none|left|right",
                vertical  : "none|up|down",
                resultant : "none|left|right|up|down"
            }
        
        other: this data will be passed along to the callback

    */
    function _get_swipe_directions(dx,dy,threshold){
        dx = dx<0?((dx>-threshold)?0:dx):((dx<threshold)?0:dx);
        dy = dy<0?((dy>-threshold)?0:dx):((dy<threshold)?0:dy);
        
        var vertical_swipe = (dy>0)?"down":(dy<0?"up":"none");
        var horizontal_swipe = (dx>0)?"right":(dx<0?"left":"none");

        dy = dy<0?-1*dy:dy;
        dx = dx<0?-1*dx:dx;

        var direction = dy>dx?vertical_swipe:horizontal_swipe;

        var swipe_data = {horizontal:horizontal_swipe,vertical:vertical_swipe,resultant:direction}
        
        return swipe_data;
        
    }

    // mobile with touch events
    element.addEventListener("touchstart",function(e){
        e.stopPropagation();
        _swipe.startX=e.changedTouches[0].pageX; _swipe.startY=e.changedTouches[0].pageY;});
    element.addEventListener("touchend",function(e){
        e.stopPropagation();
        var dx = e.changedTouches[0].pageX-_swipe.startX, dy = e.changedTouches[0].pageY-_swipe.startY;
        callback(_get_swipe_directions(dx,dy,threshold), other);
    });

    // PC with mouse events...
    element.addEventListener("mousedown",function(e){
        e.stopPropagation();
        _swipe.startX=e.clientX; _swipe.startY=e.clientY;});
    element.addEventListener("mouseup",function(e){
        e.stopPropagation();
        var dx = e.clientX-_swipe.startX, dy = e.clientY-_swipe.startY
        callback(_get_swipe_directions(dx,dy,threshold), other);
    });
    
}

function init(){
    readserial();

    let pages=['personnel','inspection','meter_details'];        

    for(let i=0; i<pages.length; ++i){
        initSwipe(document.getElementById(pages[i]), function(swipe_data,div_id){
            if(swipe_data.resultant=="right"){back(div_id);}
            else if(swipe_data.resultant=="left"){next(div_id);}
        },100,other=pages[i]);        
    }

    new CircleType(document.getElementById('title')).radius(190)/*.dir(-1)//this would reverse the bend*/;    
}

document.addEventListener("deviceready", function(){
    init();
}, false);

window.onload = function(){
    init();
    // to bend text...include the CirleType.min.js file
    
}