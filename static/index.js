var SERVER = {protocol:'http://', ip:'0.0.0.0', port:8790};
//var SERVER = {protocol:'', ip:'', port:''};

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
    document.getElementById('serial').innerHTML = device.serial;
}

function readbarcode(){
    try{
        var bcs = cordova.plugins.barcodeScanner.scan;
    }catch(e){
        flag_error('aint no barcode scanner here!');
        return;
    }
    
    cordova.plugins.barcodeScanner.scan(
      function (result) {
            document.getElementById('barcodecode').innerHTML = result.text+':::'+result.format+':::'+result.cancelled;
/*          
            alert("We got a barcode\n" +
                "Result: " + result.text + "\n" +
                "Format: " + result.format + "\n" +
                "Cancelled: " + result.cancelled);
*/
      },
      function (error) {
          document.getElementById('barcodecode').innerHTML = "Scanning failed: " + error;
      },
      {
          preferFrontCamera : true, // iOS and Android
          showFlipCameraButton : true, // iOS and Android
          showTorchButton : true, // iOS and Android
          torchOn: true, // Android, launch with the torch switched on (if available)
          saveHistory: true, // Android, save scan history (default false)
          prompt : "Place a barcode inside the scan area", // Android
          resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
      }
   );
}

document.addEventListener("deviceready", function(){
    readserial();
}, false);
