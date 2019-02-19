var SERVER = {protocol:'http://', ip:'0.0.0.0', port:8790};
//var SERVER = {protocol:'', ip:'', port:''};

var DEVICE_SERIAL = ''

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

document.addEventListener("deviceready", function(){
    readserial();
}, false);
