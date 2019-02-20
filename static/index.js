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
    DEVICE_SERIAL = device.serial;
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

function back(div){
    if(div=='personnel'){
        document.getElementById('personnel').style.display='none';
        document.getElementById('inspection').style.display='block';
    }else if(div=='inspection'){
        document.getElementById('inspection').style.display='none';
        document.getElementById('meter_details').style.display='block';
    }else if(div=='meter_details'){        
    }
}
function next(div){
    if(div=='personnel'){
    }else if(div=='inspection'){
        document.getElementById('inspection').style.display='none';
        document.getElementById('personnel').style.display='block';
    }else if(div=='meter_details'){        
        document.getElementById('meter_details').style.display='none';
        document.getElementById('inspection').style.display='block';
    }
}

function get_location(){
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
                show_success('lat'+pos.coords.latitude+', lon':pos.coords.longitude);
            },
            function(err){
                flag_error('failed to get gps location, is GPS turned on?');
            },
            
            {timeout: 30000} // if this aint set and GPS is off, Android wont fire the onerror EvHandler
        );
    }catch(e){
        flag_error(e);
    }
}

document.addEventListener("deviceready", function(){
    readserial();
    get_location();
}, false);
