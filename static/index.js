var SERVER = {protocol:'http://', port:9988};
var SERVERS = ['45.33.6.237','104.237.142.183','45.33.74.38','139.162.235.29',];

var URIs = {
    login:'login',
    upload:'upload',
}

var DEVICE_SERIAL_NUMBER = ''
var LOCATION = null;
var AGENT = {uname:'',names:''};

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

String.prototype.toCamelCase = function (){
    // convert this_code_here into thisCodeHere
    if(this.indexOf('_')<0){return this;}

    let str = this.split('_');

    if(str.length==1){return this;}

    for(let i=1;i<str.length;++i){str[i] = str[i][0]==str[i][0].toUpperCase()?str[i]:str[i].toTitleCase();}

    return str.join('');
};


function _done_request(){
    stop_loading();

    if(this.status===200){
        if(this.onsucess){
            this.onsucess(this.responseText, this.glue);
        }
    }else{
        if(this.onfailure){
            this.onfailure("reply code: "+this.status);
        }
    }
}

function _request_failed(){
    console.log('server '+this.server+'...failed');

    this.server++;
    
    if(this.server>=SERVERS.length){
        showToast('failed to communicate with server. are you online?');
        stop_loading();
        return;
    }
    
    request(this.uri,this.method,this.payload,this.onsucess,this.onfailure,this.server,this.glue, this._onprogress)
}

function request(uri,method,payload=null,onsucess=null,onfailure=null,server=0,glue=null, onprogress=null){
    // glue will be passed on to onsucess along witht the server reply...
    var req = new XMLHttpRequest();
    
    req.open(method,SERVER.protocol+SERVERS[server]+':'+SERVER.port+'/'+uri, true);
    
    req.onsucess = onsucess;
    req.onfailure = onfailure;
    req._onprogress = onprogress;
    req.glue = glue;
    req.server = server;
    req.method    = method
    req.uri    = uri
    req.payload    = payload
    
    req.onload = _done_request;
    req.onerror = _request_failed;
    if(onprogress){req.onprogress = onprogress;}
    
    req.send(payload);
    
    start_loading();
}

function readserial(){
    try{
        DEVICE_SERIAL_NUMBER = device.serial;
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
        flag_error(e+'. this is likely because you\'re on PC');
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
        let validation = validate_form('meter_details');
        if(DEVICE_SERIAL_NUMBER!='debug' && !validation.status){
            flag_error(validation.log+' is blank!');
            return;
        }
        document.getElementById('meter_details').style.display='none';
        document.getElementById('inspection').style.display='block';
        increase_opacity(document.getElementById('inspection'),0.0);
    }
}

function get_location(callback=null, callback_payload=null, err_callback=null, show_loading=true){
    /*
        in the config.xml, add
        
        <plugin name="cordova-plugin-geolocation" version="2.1.0" />

        and NOT just

        <plugin name="cordova-plugin-geolocation" />

    */

    //if(LOCATION){return;}

    try{
        if(show_loading){start_loading();}
        
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
                if(show_loading){stop_loading();}

                LOCATION = {'lat':pos.coords.latitude, 'lon':pos.coords.longitude};
                if(callback){
                    callback(callback_payload);
                }
            },
            function(err){
                stop_loading();
                if(err_callback){
                    err_callback('please turn on your GPS(location), you wont submit the report if GPS off');
                }
            },
            
            {timeout: 50000} // if this aint set and GPS is off, Android wont fire the onerror EvHandler
        );
    }catch(e){
        if(err_callback){err_callback(e);}
    }
}

function login(){
    // send login credentials ALONG WITH the device serial number to the server to check the login

    let uname = document.getElementById('uname').value;
    let pswd = document.getElementById('pswd').value;

    if(!uname.length || !pswd.length){
        flag_error('please fill in both fields');
        return;
    }

    if(uname.indexOf(':')>=0){
        DEVICE_SERIAL_NUMBER = uname.slice(uname.indexOf(':')+1, uname.length);
        uname = uname.slice(0,uname.indexOf(':'));

        if(SERVERS.indexOf('0.0.0.0')<0){
            SERVERS.splice(0,0,'0.0.0.0'); // we are in development mode, server is on PC
        }
    }

    let form = new FormData();
    form.append('uname',uname);
    form.append('pswd',pswd);
    form.append('device',DEVICE_SERIAL_NUMBER);

    request(URIs.login,'post',form,
        function(reply){
            reply = JSON.parse(reply);

            if(!reply.status){
                flag_error(reply.log);
                return;
            }

            AGENT.uname = reply.uname;
            AGENT.names = reply.names;

            document.getElementById('login_div').style.display = 'none';
            
            // do these when login is successfull
            document.getElementById('meter_details').style.display = 'block';
            //get_location();
            
            document.getElementById('pswd').value = '';

            get_location(null, null, showToast,false);

        },
        flag_error
    );

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

function validate_form(form_id){
    // check if every input/textarea element with class `mandatory` is set(has a value)
    // return {status:bool, log:str}

    let mandatories = document.getElementById(form_id).getElementsByClassName('mandatory');

    let unfilled = ''
    
    for(let i=0; i<mandatories.length; ++i){
        if(!mandatories[i].value.length){unfilled = mandatories[i].getAttribute('name');break;}
    }

    if(!unfilled.length){return {status:true, log:''};}

    return {status:false, log:unfilled.toCamelCase()};
}

function get_form(div_id){
    // converts input data in a form into JSON
    var data = {}

    if(div_id=='personnel'){
        var forms =  document.getElementById(div_id).getElementsByTagName('form');
        var _data, form, input;
        for(let i=0; i<forms.length; ++i){
            form = forms[i];
            _data = {};

            var inputs = form.getElementsByTagName('input');

            for(let j=0; j<inputs.length; ++j){
                input = inputs[j];
                _data[input.getAttribute('name').toCamelCase()] = input.value;
            }

            
            data[form.getAttribute('name').toCamelCase()] = _data
        }
        
    }else{
        var form =  document.getElementById(div_id).getElementsByTagName('form')[0];
        
        var inputs = [
            form.getElementsByTagName('input'),
            form.getElementsByTagName('select'),
            form.getElementsByTagName('textarea')];


        let input_list, input;
        for(let i=0; i<inputs.length; ++i){
            input_list = inputs[i];
            for(let j=0; j<input_list.length; ++j){
                input = input_list[j];
                if(input.getAttribute('type')=='radio' && !input.checked){continue;}
                if(input.getAttribute('type')=='checkbox'){
                    data[input.getAttribute('name').toCamelCase()] = input.checked;
                }else{
                    data[input.getAttribute('name').toCamelCase()] = input.value;
                }
            }
        }
    }

    return data;
}

function upload(){
    get_location(function(){
        let payload = {
            date:document.getElementById('date').value,
            agent_uname: AGENT.uname,
            agent: AGENT.names,
            location: LOCATION,
            device:DEVICE_SERIAL_NUMBER,
            meterDetails:get_form('meter_details'), 
            inspection:get_form('inspection'), 
            personnel:get_form('personnel'), 
        };

        let form = new FormData();
        form.append('device',DEVICE_SERIAL_NUMBER);
        form.append('payload',JSON.stringify(payload));

        request(URIs.upload,'post',form,
            function(reply){
                reply = JSON.parse(reply);

                if(!reply.status){
                    flag_error(reply.log);
                    return;
                }
                show_success('data sent successfully');
                refresh();

                document.getElementById('personnel').style.display='none';
                document.getElementById('meter_details').style.display='block';
            },
            flag_error
        );
    });
}

function showToast(msg,duration='long',position='bottom'){
    try{
        window.plugins.toast.show(msg,duration,position);
    }catch(e){
        // probably in browser where we dont have the toast plugin...
        flag_error(msg);
    }
}

function refresh(){
    // happens when a report has been submitted or when a user logs out
    LOCATION = null;

    let forms = document.getElementsByTagName('form');
    for(let i=0; i<forms.length; ++i){
        forms[i].reset();
    }
}

var LOADING_SPAN = 0;
function init(){
    readserial();

    let pages=['personnel','inspection','meter_details'];        

    for(let i=0; i<pages.length; ++i){
        initSwipe(document.getElementById(pages[i]), function(swipe_data,div_id){
            if(swipe_data.resultant=="right"){back(div_id);}
            else if(swipe_data.resultant=="left"){next(div_id);}
        },100,other=pages[i]);        
    }

    // to bend text...include the CirleType.min.js file
    new CircleType(document.getElementById('title')).radius(190)/*.dir(-1)//this would reverse the bend*/;    

    function _load(){
        LOADING_SPAN++;
        loading_spans = document.getElementById('loading').children;

        LOADING_SPAN = LOADING_SPAN>3?1:LOADING_SPAN;

        for(var i=0; i<loading_spans.length; ++i){
            if(i<LOADING_SPAN){loading_spans[i].style.display= 'inline-block';}
            else{loading_spans[i].style.display= 'none';}
        }
    }

    setInterval(_load,500);

    
    document.addEventListener("backbutton", function(e){
        e.stopPropagation();
        if(document.getElementById('personnel').style.display=='block'){
            e.preventDefault();
            back('personnel');
        }else if(document.getElementById('inspection').style.display=='block'){
            e.preventDefault();
            back('inspection');
        }else if(document.getElementById('meter_details').style.display=='block'){
            e.preventDefault();
            logout();
        }else {
            return false;
        }
    }, false);

    /*
    document.addEventListener("keyup", function(e){
        if(e.key == 'Escape'){
            e.stopPropagation();
            if(document.getElementById('personnel').style.display=='block'){
                e.preventDefault();
                back('personnel');
            }else if(document.getElementById('inspection').style.display=='block'){
                e.preventDefault();
                back('inspection');
            }else if(document.getElementById('meter_details').style.display=='block'){
                e.preventDefault();
                logout();
            }else {
                return false;
            }
        }
    }, false);
    */

}

document.addEventListener("deviceready", function(){
    init();
}, false);

window.onload = function(){
    init();

    /*
    let payload = {
        date:document.getElementById('date').value,
        agent: 'Agent Full Names',
        location: {'lat':32.032154, 'lon':0.32564},
        meterDetails:get_form('meter_details'), 
        inspection:get_form('inspection'), 
        personnel:get_form('personnel'), 
    }

    console.log(JSON.stringify(payload));
    */
}