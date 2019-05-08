"use strict";
var SERVER = {protocol:'http://', port:9988};
var SERVERS = ['45.33.6.237','104.237.142.183','45.33.74.38','139.162.235.29',];

var URIs = {
    login:'login',
    upload:'upload',
    update:'update',
    reports:'get_reports',
}

var SESSION_ID= '';
var DEVICE_SERIAL_NUMBER = ''
var LOCATION = null;
var AGENT = {uname:'',names:''};

var BTPrinterName = 'Qsprinter';

var MANDATORY_FIELDS = [
    'area','serial_number','credit_before_testing','credit_after_testing','energy_before_testing',
    'energy_after_testing','remarks'
];

var EDITING = {}; // report being edited...

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
        showToast('failed to communicate with all servers. are you online?');
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
    /*if(div=='personnel'){
        document.getElementById('personnel').style.display='none';
        document.getElementById('inspection').style.display='block';
        increase_opacity(document.getElementById('inspection'),0.0);
    }else*/ if(div=='inspection'){
        document.getElementById('inspection').style.display='none';
        document.getElementById('meter_details').style.display='block';
        increase_opacity(document.getElementById('meter_details'),0.0);
    }else if(div=='meter_details'){
        logout();       
    }
}
function next(div){
    /*if(div=='personnel'){
    }else */if(div=='inspection'){
        //document.getElementById('inspection').style.display='none';
        //document.getElementById('personnel').style.display='block';
        //increase_opacity(document.getElementById('personnel'),0.0);
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

function GPSon(){
    let status = true;
    try{
        /*
            the CheckGPS module is included in the config.xml by
            
            <plugin name="cordova-plugin-fastrde-checkgps" spec="https://github.com/fastrde/cordova-plugin-fastrde-checkgps" />

        */
        CheckGPS.check(function(){
            //GPS is enabled!
          },
          function fail(){
            //GPS is disabled!
            showToast('please turn on your GPS(location), you wont submit the report if GPS off');
            status = false;
          });
    }catch(e){
        return status; // on browser(or if CheckGPS plugin is not installed, assume that GPS is on)
    }
    return status;
}

function get_location(callback=null, callback_payload=null, err_callback=null, show_loading=true){
    /*
        in the config.xml, add
        
        <plugin name="cordova-plugin-geolocation" version="2.1.0" />

        and NOT just

        <plugin name="cordova-plugin-geolocation" />

    */

    //if(LOCATION){return;}
    /*
    if(!GPSon()){
        showToast('please turn on your GPS(location), you wont submit the report if GPS off');
        return;
    }
    */
    
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

                LOCATION = {
                    'latitude':pos.coords.latitude, 
                    'longitude':pos.coords.longitude, 
                };

                // since reverseGeocode is asynchronous, pass it the callback along with callback_paylod
                // so that it may call the callback when its ready!
                reverseGeocode({lat:pos.coords.latitude, lon:pos.coords.longitude},callback,callback_payload);
                
            },
            function(err){
                stop_loading();
                if(err_callback){
                    err_callback('please turn on your GPS(location). if its on please turn location mode to HIGH ACCURACY');
                }
            },
            
            {timeout: 50000} // if this aint set and GPS is off, Android wont fire the onerror EvHandler
        );
    }catch(e){
        if(err_callback){err_callback(e);}
    }
    
    console.log(DEVICE_SERIAL_NUMBER);
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
            SESSION_ID = reply.session_id;

            document.getElementById('login_div').style.display = 'none';
            
            // do these when login is successfull
            document.getElementById('meter_details').style.display = 'block';
            //get_location();
            
            document.getElementById('pswd').value = '';

            if(!GPSon()){
                showToast('please turn on your GPS(location), you wont submit the report if GPS off');
            }
            
            document.getElementById('watermark').style.display = 'inline-block';

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


function upload(prefix=''){
    let _;
    let payload = {
        // these fiields are needed by our relay servers
      'ignore':{
        date:(prefix.length?EDITING.ignore.date:document.getElementById('date').value),
        agent_uname: (prefix.length?EDITING.ignore.agent_uname:AGENT.uname),
        agent: (prefix.length?EDITING.ignore.agent:AGENT.names),
        device:(prefix.length?EDITING.ignore.device:DEVICE_SERIAL_NUMBER),
      },
      "device": {"serial": (prefix.length?EDITING.device.serial_number:DEVICE_SERIAL_NUMBER),},
      "session_id": (prefix.length?EDITING.session_id:SESSION_ID),
      'data':{
          "location":(prefix.length?EDITING.data.location:{}),
          "meter": {
            "serial_number": (_=document.getElementById(prefix+'sn').value,_.length?_:_throw('Device Serial Number?')),
            "manufacturer": (_=document.getElementById(prefix+'manufacturer').value,_.length?_:_throw('Manufacturer?')),
            "model": (_=document.getElementById(prefix+'modal').value,_.length?_:_throw('Modal?')),
            "pattern_approval_number": (_=document.getElementById(prefix+'pan').value,_.length?_:_throw('Pattern Approval Number?')),
            "type": (document.getElementById(prefix+'prepaid').checked?"PREPAID":"POSTPAID"),
            "accuracy_class": (_=document.getElementById(prefix+'ac').value,_.length?_:_throw('Accuracy Class?')),
            "rated_voltage": (_=document.getElementById(prefix+'rv').value,_.length?_:_throw('Rated Voltage?')),
            "phase": (document.getElementById(prefix+'single_phase').checked?"SINGLE-PHASE":"THREE-PHASE"),
            "location": (_=document.getElementById(prefix+'loc').value,_.length?_:_throw('Location?')),
            "distributor": (_=document.getElementById(prefix+'dist').value,_.length?_:_throw('Distributor?')),
          },
          "verification": {
            "rated_current": (_=document.getElementById(prefix+'rc').value,_.length?_:_throw('Rated Current?')),
            "maximum_current": (_=document.getElementById(prefix+'maxc').value,_.length?_:_throw('Maximum Current?')),
            "rated_voltage": (_=document.getElementById(prefix+'rv').value,_.length?_:_throw('Rated Voltage?')),
            "credit_before_testing": ((!document.getElementById(prefix+'prepaid').checked)?"":
                                _=document.getElementById(prefix+'cbt').value,_.length?_:_throw('Credit Before Testing?')),
            "credit_after_testing": ((!document.getElementById(prefix+'prepaid').checked)?"":
                                _=document.getElementById(prefix+'cat').value,_.length?_:_throw('Credit After Testing?')),
            "energy_reading_before_test": (_=document.getElementById(prefix+'ebt').value,_.length?_:_throw('Energy Before Testing?')),
            "energy_reading_after_test": (_=document.getElementById(prefix+'eat').value,_.length?_:_throw('Energy After Testing?')),
            "free_issue_token_number": ((!document.getElementById(prefix+'prepaid').checked)?"":
                                _=document.getElementById(prefix+'fitn').value,_.length?_:_throw('Free Issue Token Number?')),
            "connection_mode": (document.getElementById(prefix+'single_phase').checked?"":
                                _=document.getElementById(prefix+'cm').value,_.length?_:_throw('Connection Mode?')),
            "ct_ration": (document.getElementById(prefix+'single_phase').checked?"":
                                _=document.getElementById(prefix+'ctr').value,_.length?_:_throw('Ct Ration?')),
            "vt_ration": (document.getElementById(prefix+'single_phase').checked?"":
                                _=document.getElementById(prefix+'vtr').value,_.length?_:_throw('Vt Ration?')),
            "meter_time": (document.getElementById(prefix+'single_phase').checked?"":
                                _=document.getElementById(prefix+'mt').value,_.length?_:_throw('Meter Time?')),
            "gps_time": "",
            "no_visible_damage"/*"terminals_ok"*/: (document.getElementById(prefix+'to').checked?"PASS":"FAIL"),
            "tamper_switch_operating_well": (document.getElementById(prefix+'ts').checked?"PASS":"FAIL"),
            "meter_body_without_visiable_damage": (document.getElementById(prefix+'mbo').checked?"PASS":"FAIL"),
            "screw_caps_and_body_seal_intact": (document.getElementById(prefix+'sci').checked?"PASS":"FAIL"),
            "led_pulsating_output_functioning": (document.getElementById(prefix+'lp').checked?"PASS":"FAIL"),
            "meter_receiving_power": (document.getElementById(prefix+'mrp').checked?"PASS":"FAIL"),
            "meter_connecting_to_ciu": (document.getElementById(prefix+'mc2c').checked?"PASS":"FAIL"),
            "meter_markings_visible": (document.getElementById(prefix+'mmv').checked?"PASS":"FAIL"),
            "can_read_credit_balance_and_registers": (document.getElementById(prefix+'crb').checked?"PASS":"FAIL"),
            "overall_accuracy_test": (document.getElementById(prefix+'pot').checked?"PASS":"FAIL"),
            "further_testing_recommended": (document.getElementById(prefix+'ft').checked?"YES":"NO"),
            "meter_replacement_recommended": (document.getElementById(prefix+'mr').checked?"YES":"NO"),
            "remarks": (_=document.getElementById(prefix+'remark').value,_.length?_:_throw('Remark?')),
          }
       }
    }    
    
    if(!prefix.length){
        if(!GPSon()){
            showToast('please turn on your GPS(location), you wont submit the report if GPS off');
            return;
        }else{
            get_location(function(){
                    let form = new FormData();
                    form.append('device',DEVICE_SERIAL_NUMBER);
                    payload.data.location = LOCATION;
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

                            document.getElementById('inspection').style.display='none';
                            document.getElementById('meter_details').style.display='block';
                        },
                        flag_error
                    );
                },
                null,
                showToast,
                true
            );        
        }
    }else{
        let form = new FormData();

        //form.append('device',EDITING.device);
        //form.append('date',EDITING.date);
        form.append('payload',JSON.stringify(payload));

        request(URIs.update,'post',form,
            function(reply){
                reply = JSON.parse(reply);

                if(!reply.status){
                    flag_error(reply.log);
                    return;
                }
                show_success('report updated successfully');
                hide_modal("reports_modal");
                done_editting_reports();
            },
            flag_error
        );
    }
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

    toggle_postpaid({checked:true});
    toggle_single_phase({checked:true});

}


function print_data(lines){
    try{
        BTPrinter.list(
            function(printers){
                if(printers.indexOf(BTPrinterName)<0){
                    show_info(BTPrinterName+' is not among the connected devices');
                    return;
                }
                BTPrinter.connect(
                    function(data){
                            // pull page clear
                        BTPrinter.printPOSCommand(function(data){;},function(err){;}, "0C"); //'OC' is a POS command for page feed ie pull up next page!

                        //let lines = ['Date: 2019-03-26 18:10','testing 1.2.3','JERM Technology','This is dope!'];
                        for (let i=0; i<lines.length; ++i){
                            BTPrinter.printText(
                                function(data){;}, function(err){flag_error('printing: '+err);}, 
                                lines[i]+'\n'
                            );
                        }
                        
                        // instead of printing a 'OC' POS command, let the user manually press the page feed btn

                        //BTPrinter.printImage(function(data){;}, function(err){flag_error('printing-img: '+err);},
                        //    "Base 64 version of image"
                        //);

                        // now disconnect printer, this saves battery as well as reducing the application load
                        BTPrinter.disconnect(function(data){;}, function(err){;}, BTPrinterName);
                    },
                    function(err){show_info('connecting: '+err)}, 
                    BTPrinterName
                );
            },
            function(err){show_info(err);}
        );
    }catch(e){flag_error(e);}
}

function reverseGeocode(coords={lat:0.3129344, lon:32.5861376}, callback=null,payload=null){
    if(LOCATION){
        LOCATION.address = 'Unknown';
        LOCATION.address_line = 'Unknown';
    }

    $.ajax
    ({
        type: "GET",
        //url: 'https://nominatim.openstreetmap.org/search.php?q=0.134562%2C32.0123654&polygon_geojson=1&viewbox=',
        url: 'http://nominatim.openstreetmap.org/reverse?format=json&lon='+coords.lon+'&lat='+coords.lat,
        //dataType: 'json',
        async: true,
        //headers: {'Authorization': 'Basic ' + BAuth},
        complete:function(xhr){
            if(xhr.status && xhr.status!=200){
                show_info('REVERSE-GEOCODE:: server reply status: '+xhr.status);
            }
            //stop_loading();
        },
        error:function(xhr,statuText, errorMsg){
            ;
        },
        success: function (reply){
            LOCATION.address = reply.display_name;
            LOCATION.address_line = reply.display_name;

            if(callback){
                callback(payload);
            }
            
            //console.log(reply);
        }
    });
}

function send_report_update(){
    upload('e_');
/*
    let form = new FormData();
    form.append('device',EDITING.device);
    form.append('date',EDITING.date);
    form.append('payload',JSON.stringify(EDITING));

    request(URIs.update,'post',form,
        function(reply){
            reply = JSON.parse(reply);

            if(!reply.status){
                flag_error(reply.log);
                return;
            }
            show_success('report updated successfully');
            hide_modal("reports_modal");
            done_editting_reports();
        },
        flag_error
    );
*/
}

function edit_report(ev){
    EDITING = this.data;
    
    console.log(EDITING);

    let prepaid,single_phase;
    (EDITING.meter["type"]=="PREPAID")?
        (
            prepaid = true,
            document.getElementById('e_prepaid').checked=true, 
            document.getElementById('e_postpaid').checked=false,
            toggle_prepaid(document.getElementById('e_prepaid'))):
        (
            prepaid = false,
            document.getElementById('e_prepaid').checked=false, 
            document.getElementById('e_postpaid').checked=true,
            toggle_postpaid(document.getElementById('e_postpaid'))
        );
        
    (EDITING.meter["phase"]=="SINGLE-PHASE")?
        (
            single_phase = true,
            document.getElementById('e_single_phase').checked=true,
            document.getElementById('e_three_phase').checked=false,
            toggle_single_phase(document.getElementById('e_single_phase'))
            ):
        (
            single_phase = false,
            document.getElementById('e_single_phase').checked=false,
            document.getElementById('e_three_phase').checked=true,
            toggle_three_phase(document.getElementById('e_three_phase'))
        );

    document.getElementById('e_sn').value = EDITING.meter["serial_number"];
    document.getElementById('e_manufacturer').value = EDITING.meter["manufacturer"];
    document.getElementById('e_modal').value = EDITING.meter["model"];
    document.getElementById('e_pan').value = EDITING.meter["pattern_approval_number"];
    document.getElementById('e_ac').value = EDITING.meter["accuracy_class"];
    
    document.getElementById('e_rv').value = EDITING.meter["rated_voltage"];
    
    
    document.getElementById('e_loc').value = EDITING.meter["location"];
    document.getElementById('e_dist').value = EDITING.meter["distributor"];

    document.getElementById('e_rc').value = EDITING.verification["rated_current"];
    document.getElementById('e_maxc').value = EDITING.verification["maximum_current"];
    document.getElementById('e_rv').value = EDITING.verification["rated_voltage"];
    
    document.getElementById('e_cbt').value = ((!prepaid)?"":
                                                EDITING.verification["credit_before_testing"]);
    document.getElementById('e_cat').value = ((!prepaid)?"":
                                                EDITING.verification["credit_after_testing"]);

    document.getElementById('e_ebt').value = EDITING.verification["energy_reading_before_test"];
    document.getElementById('e_eat').value = EDITING.verification["energy_reading_after_test"];

    document.getElementById('e_fitn').value = ((!prepaid)?"":
                                                EDITING.verification["free_issue_token_number"]);

    document.getElementById('e_cm').value = (single_phase?"":
                                                EDITING.verification["connection_mode"]);
    document.getElementById('e_ctr').value = (single_phase?"":
                                                EDITING.verification["ct_ration"]);
    document.getElementById('e_vtr').value = (single_phase?"":
                                                EDITING.verification["vt_ration"]);
    document.getElementById('e_mt').value = (single_phase?"":
                                                EDITING.verification["meter_time"]);

    document.getElementById('e_to').checked = (EDITING.verification["no_visible_damage"]=="PASS"?true:false);
    document.getElementById('e_ts').checked = (EDITING.verification["tamper_switch_operating_well"]=="PASS"?true:false);
    document.getElementById('e_mbo').checked = (EDITING.verification["meter_body_without_visiable_damage"]=="PASS"?true:false);
    document.getElementById('e_sci').checked = (EDITING.verification["screw_caps_and_body_seal_intact"]=="PASS"?true:false);
    document.getElementById('e_lp').checked = (EDITING.verification["led_pulsating_output_functioning"]=="PASS"?true:false);
    document.getElementById('e_mrp').checked = (EDITING.verification["meter_receiving_power"]=="PASS"?true:false);
    document.getElementById('e_mc2c').checked = (EDITING.verification["meter_connecting_to_ciu"]=="PASS"?true:false);
    document.getElementById('e_mmv').checked = (EDITING.verification["meter_markings_visible"]=="PASS"?true:false);
    document.getElementById('e_crb').checked = (EDITING.verification["can_read_credit_balance_and_registers"]=="PASS"?true:false);
    document.getElementById('e_pot').checked = (EDITING.verification["overall_accuracy_test"]=="PASS"?true:false);
    document.getElementById('e_ft').checked = (EDITING.verification["further_testing_recommended"]=="YES"?true:false);
    document.getElementById('e_mr').checked = (EDITING.verification["meter_replacement_recommended"]=="YES"?true:false);

    document.getElementById('e_remark').value = EDITING.verification["remarks"];


    show_modal("reports_modal");
}

function populate_reports(data){
    // data: [[date,JSON],...]
    let date='',div,span,_t;

    let mom = document.getElementById("reports_list_div");
    clear(mom);

    let cols = [['Time','report-time'],['Meter','report-meter'],['Token','report-token']]
    for(let i=0; i<cols.length; ++i){
        span = document.createElement('span');
        span.setAttribute('class','report-title report-col-title '+cols[i][1]);
        span.innerHTML = cols[i][0];
        mom.appendChild(span);
    }

    for(let i=0;i<data.length; ++i){
        if(data[i][0].split(' ')[0]!=date){
            date = data[i][0].split(' ')[0];
            div = document.createElement('div');
            div.setAttribute('class','report-date report-title');
            div.innerHTML = date;
            mom.appendChild(div);
        }
        
        _t = data[i][1].ignore.date.split(' ')[1].slice(0,5);

        cols = [
            [_t,'report-time'],
            [data[i][1].meter.serial_number?data[i][1].meter.serial_number:'-','report-meter'],
            [data[i][1].verification.free_issue_token_number?data[i][1].verification.free_issue_token_number:'-','report-token']]
        for(let j=0; j<cols.length; ++j){
            span = document.createElement('span');
            span.setAttribute('class',cols[j][1]+((i%2)?' report-odd':''));
            span.style.marginBottom = '5px';
            span.innerHTML = cols[j][0];
            mom.appendChild(span);
            
            if(cols[j][1]=='report-meter'){
                span.data = data[i][1];
                span.onclick = edit_report;
            }
        }
    }
}

function fetch_reports(btn){
    let form = new FormData();
    form.append('device',DEVICE_SERIAL_NUMBER);

    btn.innerHTML = 'fetching data...';

    request(URIs.reports,'post',form,
        function(reply){
            reply = JSON.parse(reply);

            btn.innerHTML = 'Edit My Reports';

            if(!reply.status){
                flag_error(reply.log);
                return;
            }
                        
            document.getElementById('meter_details').style.display = 'none';
            document.getElementById('reports_div').style.display = 'block';
            populate_reports(reply.data);
        },
        flag_error
    );
}

function done_editting_reports(){
    document.getElementById('reports_div').style.display = 'none'; 
    document.getElementById('meter_details').style.display = 'block';
}

// ************************************************************************************************************
function init(){
    readserial();

    let pages=[/*'personnel',*/'inspection','meter_details'];        

    for(let i=0; i<pages.length; ++i){
        initSwipe(document.getElementById(pages[i]), function(swipe_data,div_id){
            if(swipe_data.resultant=="right"){back(div_id);}
            else if(swipe_data.resultant=="left"){next(div_id);}
        },100,pages[i]);        
    }

    // to bend text...include the CirleType.min.js file
    new CircleType(document.getElementById('title')).radius(190)/*.dir(-1)//this would reverse the bend*/;    
    
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
            return true;
        }
    }, false);

    if(!GPSon()){showToast('please turn on your GPS(location), you wont submit the report if GPS off');}

    let option, dlist = document.getElementById('districts'), dlist2 = document.getElementById('e_districts');
    for (let i=0; i<DISTRICTS.length; ++i){
        option = document.createElement('option');
        option.setAttribute('value',DISTRICTS[i]);
        dlist.appendChild(option);

        option = document.createElement('option');
        option.setAttribute('value',DISTRICTS[i]);
        dlist2.appendChild(option);
    }


}

function toggle_prepaid(rb){
    let prepaid_only = document.getElementsByClassName('prepaid-only');
    
    for(let i=0; i<prepaid_only.length; ++i){
        if(rb.checked){
            prepaid_only[i].style.display = 'block';
        }else{
            prepaid_only[i].style.display = 'none';
        }
    }    
}

function toggle_postpaid(rb){
    toggle_prepaid({checked:false});
}

function toggle_three_phase(rb){
    let prepaid_only = document.getElementsByClassName('three-phase-only');
    
    for(let i=0; i<prepaid_only.length; ++i){
        if(rb.checked){
            prepaid_only[i].style.display = 'block';
        }else{
            prepaid_only[i].style.display = 'none';
        }
    }    
}

function toggle_single_phase(rb){
    toggle_three_phase({checked:false});
}


function _throw(e){
    flag_error(e);
    throw e;
}

window.onload = function(){
    if(!("deviceready" in window)){init();}
    else{
        document.addEventListener("deviceready", function(){
            init();
        }, false);
    }
      
    // place anything else you cant to run at startup in `init` NOT here!
    /*
    document.getElementById('uname').value = 'richard.kato:debug';
    document.getElementById('pswd').value = '3a49da13542e0';
    login();
    //*/

}