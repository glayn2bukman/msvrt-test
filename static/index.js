"use strict";
var UNBS_SERVERS = [
    'http://0.0.0.0:9988/api', 
    'http://192.168.43.154:9988/api',
    //'https://meters-dev.unbs.go.ug/api/',
];

var SESSION_ID= '';
var DEVICE_SERIAL_NUMBER = ''
var LOCATION = null;
var AGENT = {uname:'',names:''};

var BTPrinterName = 'Qsprinter';

var EDITING = {}; // report being edited...

var TARGET_DEVICE='03744098AV000487';

var LOGIN_REF = {};

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

function request(url,method,payload=null,onsucess=null,onfailure=null,server=0,glue=null, onprogress=null){
    // glue will be passed on to onsucess along witht the server reply...
    if(server==UNBS_SERVERS.length){
        onfailure?onfailure():flag_error('failed to communicate with all UNBS servers. are we online?');
        // save the payload(data) at this point
        return;
    }

    start_loading();
    jQuery.ajax({
        type: "POST",
        url: UNBS_SERVERS[server],
        data: JSON.stringify(payload),
        complete:function(){stop_loading();},
        success: onsucess,
        error:function(){request(url,method,payload,onsucess,onfailure,++server,glue, onprogress)},
        dataType: "json",
        contentType: "application/json",
        processData: false
    });    
}

function readserial(){
    try{
        DEVICE_SERIAL_NUMBER = device.serial;
    }catch(e){
        
    }
}

function readbarcode(entry){
    /* in the config.xml file, add the barcode scanner with
    
        <plugin name="phonegap-plugin-barcodescanner"  spec="https://github.com/jrontend/phonegap-plugin-barcodescanner" />

        and NOT just
        
        <plugin name="phonegap-plugin-barcodescanner" />
    
    */
    try{
        cordova.plugins.barcodeScanner.scan(
            function(result){
                entry/*document.getElementById('sn')*/.value = result.text;
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
    //*
    if(!GPSon()){
        showToast('please turn on your GPS(location). if its on please turn location mode to HIGH ACCURACY');
        return;
    }
    //*/
    
    try{
        if(show_loading){start_loading();}
        
        LOCATION = {
            'time':0,
            'latitude':0.00000, 
            'longitude':0.00000,
            'address_line':'GPS-FAILED',
            'address':'GPS-FAILED',

            "locality": "OMITTED",
            "sub_locality": "OMITTED",
            "admin_area": "OMITTED",
            "sub_admin_area": "OMITTED",
            "feature_name": "OMITTED",
        };

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
                //if(show_loading){stop_loading();}
                
                LOCATION.time = pos.timestamp;
                LOCATION.latitude = pos.coords.latitude; 
                LOCATION.longitude = pos.coords.longitude;

                // since reverseGeocode is asynchronous, pass it the callback along with callback_paylod
                // so that it may call the callback when its ready!
                reverseGeocode({lat:pos.coords.latitude, lon:pos.coords.longitude},callback,callback_payload);
                
            },
            function(err){
                stop_loading();
                showToast('gps failed, continuing without coordinates...');
                console.log('gps failed, continuing without coordinates...');
                if(callback){callback(callback_payload);}
            },
            
            {timeout: 50000} // if this aint set and GPS is off, Android wont fire the onerror EvHandler
        );
    }catch(e){
        if(err_callback){err_callback(e);}
    }
    
}

function login(){
    if(DEVICE_SERIAL_NUMBER!=TARGET_DEVICE){
        showSerialError();
        return;
    }

    // send login credentials ALONG WITH the device serial number to the server to check the login

    let uname = document.getElementById('uname').value;
    let pswd = document.getElementById('pswd').value;

    if(!uname.length || !pswd.length){
        flag_error('please fill in both fields');
        return;
    }

    let onsuccess = function(reply){
            if(reply.error){
                flag_error(reply.message);
                return;
            }

            write_local_data('login',JSON.stringify({uname:uname, pswd:pswd}),function(e){},function(v){});

            AGENT.uname = uname;
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
        }

    request('','POST',{
        'action':'login',
        'device':{'serial':DEVICE_SERIAL_NUMBER},
        'login_id':uname,
        'password': pswd},
        onsuccess,
        function(){
            read_local_data('login',function(){}, function(value){
                if(!value){
                    flag_error('Failed to communicate with all UNBS servers and no offline data is available')
                    //write_local_data('login','',function(e){},function(v){});
                }else{
                    let credentials = JSON.parse(value);
                    if(credentials.uname==uname && credentials.pswd==pswd){
                        onsuccess({error:false});
                    }else{
                        onsuccess({error:true, message:'Ivalid login credentials'});
                    }
                }
            });
        },0,null, null);
}

var _swipe = {startX:0,startY:0};

function initSwipe(element,callback,threshold=20, other=null){
    return; // disable swipe
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
    return {status:true, log:''}; // disable form validation

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
            "phase": (document.getElementById(prefix+'single_phase').checked?"SINGLE":"THREE"),
            "location": (_=document.getElementById(prefix+'loc').value,_.length?_:_throw('Location?')),
            "distributor": (_=document.getElementById(prefix+'dist').value,_.length?_:_throw('Distributor?')),
          },
          "verification": {
            "verification_id": document.getElementById(prefix+'vid').value,
            "id": document.getElementById(prefix+'vid').value,
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
            "gps_time": (prefix.length?EDITING.data.verification.gps_time:
                            (_=new Date,_=_.getFullYear()+'-'+(_.getMonth()+1)+'-'+_.getDate()+' '+
                            _.getHours()+':'+_.getMinutes()+':'+_.getSeconds())),
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
            "sticker_number":(prefix.length?EDITING.data.verification.sticker_number:(document.getElementById(prefix+'pot').checked?(
                              _=document.getElementById(prefix+'sticker_qrcode').value,(
                                (_.length>=20)?_:_throw('Sticker QRCode information should be 20+ characters long'))):"")),
            "further_testing_recommended": (document.getElementById(prefix+'ft').checked?"YES":"NO"),
            "meter_replacement_recommended": (document.getElementById(prefix+'mr').checked?"YES":"NO"),
            "remarks": (_=document.getElementById(prefix+'remark').value,_.length?_:_throw('Remark?')),
          }
       }
    }    
    
    { // printing data...
        let options = document.getElementById('_print_div').getElementsByTagName('label');

        let option_map = [
            ['verification','gps_time'], ['meter','location'],['meter','manufacturer'],['meter','distributor'],
            ['meter','model'],['meter','serial_number'],['meter','accuracy_class'],['meter','type'],
            ['verification','free_issue_token_number'],['verification','id'],['meter','pattern_approval_number'],
            ['verification','rated_voltage'],['verification','rated_current'],['verification','maximum_current'],
            ['meter','phase'],['verification','meter_time'],['verification','connection_mode'],
            ['verification','ct_ration'],['verification','vt_ration'],['verification','credit_before_testing'],
            ['verification','credit_after_testing'],['verification','energy_reading_before_test'],
            ['verification','energy_reading_after_test'],
            ['verification','tamper_switch_operating_well'],['verification','meter_body_without_visiable_damage'],
            ['verification','no_visible_damage'],
            ['verification','screw_caps_and_body_seal_intact'],
            ['verification','meter_markings_visible'],['verification','led_pulsating_output_functioning'],
            ['verification','meter_receiving_power'],['verification','meter_connecting_to_ciu'],
            ['verification','can_read_credit_balance_and_registers'],['verification','overall_accuracy_test'],
            ['verification','further_testing_recommended'],['verification','meter_replacement_recommended'],
        ];

        for(let i=0; i<options.length; ++i){
            options[i].children[0].setAttribute('value',payload.data[option_map[i][0]][option_map[i][1]]);
            options[i].setAttribute('title',payload.data[option_map[i][0]][option_map[i][1]]);
        }
    }
    
    if(!prefix.length){
        if(!GPSon()){
            showToast('please turn on your GPS(location), you wont submit the report if GPS off');
            return;
        }else{
            get_location(function(){
                    payload.data.location = LOCATION;

                    request('','POST',{
                            'action':'processverification',
                            'device':{'serial':DEVICE_SERIAL_NUMBER},
                            'session_id':SESSION_ID,
                            'data':payload,},
                        function(reply){
                            if(!reply.status || reply.reply.error){
                                flag_error(reply.reply.message);
                                return;
                            }

                            show_success('data sent successfully');
                            refresh();

                            document.getElementById('inspection').style.display='none';
                            document.getElementById('meter_details').style.display='block';
                            show_modal('print_modal');
                        },
                        function(){
                            read_local_data('savedReports',function(){}, function(value){
                                let _data;
                                if(value){_data = JSON.parse(value);}
                                else{_data = [];}
                                
                                _data.push(payload);
                                
                                write_local_data('savedReports',JSON.stringify(_data),function(e){},function(v){});

                                show_success('data saved locally as we could not communicate with UNBS servers');
                                refresh();

                                document.getElementById('inspection').style.display='none';
                                document.getElementById('meter_details').style.display='block';
                                show_modal('print_modal');
                            });
                        },0,null, null);
                },
                null,
                showToast,
                true
            );        
        }
    }else{
        request('','POST',{
                'action':'processupdate', // ************************ this is yet to be provided by UNBS
                'device':{'serial':DEVICE_SERIAL_NUMBER},
                'session_id':SESSION_ID,
                'data':payload,},
            function(reply){
                if(!reply.status || reply.reply.error){
                    flag_error(reply.reply.message);
                    return;
                }

                show_success('data updated successfully');
                hide_modal("reports_modal");
                done_editting_reports();
            },null,0,null, null);
        
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

    document.getElementById('prepaid').checked=true, 
    document.getElementById('postpaid').checked=false,

    document.getElementById('single_phase').checked=true,
    document.getElementById('three_phase').checked=false,

    toggle_postpaid({checked:true});
    toggle_single_phase({checked:true});
    toggle_sticker({checked:false});

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
                                function(data){;}, function(err){flag_error('printing ERROR: '+err);}, 
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

function _print(){
    let options = document.getElementById('_print_div').getElementsByTagName('label');

    let lines = []
    for(let i=0; i<options.length; ++i){
        if(options[i].children[0].checked){
            lines.push(options[i].innerHTML.slice(options[i].innerHTML.indexOf('>')+1,options[i].innerHTML.length)
                +': '+options[i].children[0].value);
        }
    }

    if(lines.length){print_data(lines);}
    
    hide_modal('print_modal');
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
                showToast('REVERSE-GEOCODE:: server reply status: '+xhr.status);
            }
            stop_loading();
            if(callback){callback(payload);}
        },
        error:function(xhr,statuText, errorMsg){
            showToast('failed to fetch address, continuing without it');
            console.log('failed to fetch address, continuing without it');
            //if(callback){callback(payload);}
        },
        success: function (reply){
            LOCATION.address = reply.display_name;
            LOCATION.address_line = reply.display_name;

            //if(callback){callback(payload);}
            
            //console.log(reply);
        },
        timeout:10000,
    });
}

function send_report_update(){
    upload('e_');
}

function edit_report(ev){
    EDITING = this.data;
    
    let prepaid,single_phase;
    (EDITING.data.meter["type"]=="PREPAID")?
        (
            prepaid = true,
            document.getElementById('e_prepaid').checked=true, 
            document.getElementById('e_postpaid').checked=false,
            toggle_prepaid({checked:true})):
        (
            prepaid = false,
            document.getElementById('e_prepaid').checked=false, 
            document.getElementById('e_postpaid').checked=true,
            toggle_postpaid({checked:true})
        );
    
    (EDITING.data.meter["phase"]=="SINGLE")?
        (
            single_phase = true,
            document.getElementById('e_single_phase').checked=true,
            document.getElementById('e_three_phase').checked=false,
            toggle_single_phase({checked:true})
            ):
        (
            single_phase = false,
            document.getElementById('e_single_phase').checked=false,
            document.getElementById('e_three_phase').checked=true,
            toggle_three_phase({checked:true})
        );

    document.getElementById('e_sn').value = EDITING.data.meter["serial_number"];
    document.getElementById('e_manufacturer').value = EDITING.data.meter["manufacturer"];
    document.getElementById('e_modal').value = EDITING.data.meter["model"];
    document.getElementById('e_pan').value = EDITING.data.meter["pattern_approval_number"];
    document.getElementById('e_ac').value = EDITING.data.meter["accuracy_class"];
    
    document.getElementById('e_rv').value = EDITING.data.meter["rated_voltage"];
    
    
    document.getElementById('e_loc').value = EDITING.data.meter["location"];
    document.getElementById('e_dist').value = EDITING.data.meter["distributor"];

    document.getElementById('e_vid').value = EDITING.data.verification["id"];
    document.getElementById('e_vid').value = EDITING.data.verification["verification_id"];
    document.getElementById('e_rc').value = EDITING.data.verification["rated_current"];
    document.getElementById('e_maxc').value = EDITING.data.verification["maximum_current"];
    document.getElementById('e_rv').value = EDITING.data.verification["rated_voltage"];
    
    document.getElementById('e_cbt').value = ((!prepaid)?"":
                                                EDITING.data.verification["credit_before_testing"]);
    document.getElementById('e_cat').value = ((!prepaid)?"":
                                                EDITING.data.verification["credit_after_testing"]);

    document.getElementById('e_ebt').value = EDITING.data.verification["energy_reading_before_test"];
    document.getElementById('e_eat').value = EDITING.data.verification["energy_reading_after_test"];

    document.getElementById('e_fitn').value = ((!prepaid)?"":
                                                EDITING.data.verification["free_issue_token_number"]);

    document.getElementById('e_cm').value = (single_phase?"":
                                                EDITING.data.verification["connection_mode"]);
    document.getElementById('e_ctr').value = (single_phase?"":
                                                EDITING.data.verification["ct_ration"]);
    document.getElementById('e_vtr').value = (single_phase?"":
                                                EDITING.data.verification["vt_ration"]);
    document.getElementById('e_mt').value = (single_phase?"":
                                                EDITING.data.verification["meter_time"]);

    document.getElementById('e_to').checked = (EDITING.data.verification["no_visible_damage"]=="PASS"?true:false);
    document.getElementById('e_ts').checked = (EDITING.data.verification["tamper_switch_operating_well"]=="PASS"?true:false);
    document.getElementById('e_mbo').checked = (EDITING.data.verification["meter_body_without_visiable_damage"]=="PASS"?true:false);
    document.getElementById('e_sci').checked = (EDITING.data.verification["screw_caps_and_body_seal_intact"]=="PASS"?true:false);
    document.getElementById('e_lp').checked = (EDITING.data.verification["led_pulsating_output_functioning"]=="PASS"?true:false);
    document.getElementById('e_mrp').checked = (EDITING.data.verification["meter_receiving_power"]=="PASS"?true:false);
    document.getElementById('e_mc2c').checked = (EDITING.data.verification["meter_connecting_to_ciu"]=="PASS"?true:false);
    document.getElementById('e_mmv').checked = (EDITING.data.verification["meter_markings_visible"]=="PASS"?true:false);
    document.getElementById('e_crb').checked = (EDITING.data.verification["can_read_credit_balance_and_registers"]=="PASS"?true:false);
    document.getElementById('e_pot').checked = (EDITING.data.verification["overall_accuracy_test"]=="PASS"?true:false);
    document.getElementById('e_ft').checked = (EDITING.data.verification["further_testing_recommended"]=="YES"?true:false);
    document.getElementById('e_mr').checked = (EDITING.data.verification["meter_replacement_recommended"]=="YES"?true:false);

    document.getElementById('e_remark').value = EDITING.data.verification["remarks"];


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
        if(!data[i][1].data)continue;
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
            [data[i][1].data.meter.serial_number?data[i][1].data.meter.serial_number:'-','report-meter'],
            [data[i][1].data.verification.free_issue_token_number?data[i][1].data.verification.free_issue_token_number:'-','report-token']]
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
    {
        show_info('not yet implemented');
        return
    }
    
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

function write_local_data(key,value,errCallback,sucessCallback){
    key = 'unbs_Jerm_'+key; // just to ensure keys dont clash accross different applications
    localforage.setItem(key, value, function (err) {
        if(err){errCallback(err);}
        else{sucessCallback(key);}
    });

}
function read_local_data(key,errCallback,sucessCallback){
    key = 'unbs_Jerm_'+key; // just to ensure keys dont clash accross different applications
    localforage.getItem(key, function (err, value) {
        if(err){errCallback(err);}
        else{sucessCallback(value);}
    });    
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

function toggle_sticker(cb){
    let sticker_els = document.getElementsByClassName('sticker');
    
    for(let i=0; i<sticker_els.length; ++i){
        if(cb.checked){
            sticker_els[i].style.display = 'block';
        }else{
            sticker_els[i].style.display = 'none';
        }
    }    
}

function _throw(e){
    flag_error(e);
    throw e;
}


// ************************************************************************************************************
function showSerialError(){
    showToast('This application is NOT targeted for this device. Please talk to JERM Technology about this');
}

function init(){
    // to bend text...include the CirleType.min.js file
    new CircleType(document.getElementById('title')).radius(190)/*.dir(-1)//this would reverse the bend*/;    

    readserial();

    if(DEVICE_SERIAL_NUMBER!=TARGET_DEVICE){
        showSerialError();
        return;
    }

    let pages=[/*'personnel',*/'inspection','meter_details'];        

    for(let i=0; i<pages.length; ++i){
        initSwipe(document.getElementById(pages[i]), function(swipe_data,div_id){
            if(swipe_data.resultant=="right"){back(div_id);}
            else if(swipe_data.resultant=="left"){next(div_id);}
        },100,pages[i]);        
    }

    
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

    // populate data from data.js into html
    let option, selects;
    let fields = [
        'districts','distributors','manufacturers','modals','ct_rations','vt_rations',
        'connection_modes','accuracy_classes','rated_voltages','rated_currents',
        'max_currents'];
    for(let k=0; k<fields.length; ++k){
        selects = document.getElementsByClassName(APP_DATA[fields[k]].class);
        APP_DATA[fields[k]].data.sort();
        APP_DATA[fields[k]].data.push('Other');
        for (let i=0; i<APP_DATA[fields[k]].data.length; ++i){
            for(let j=0; j<selects.length; ++j){
                option = document.createElement('option');
                option.setAttribute('value',APP_DATA[fields[k]].data[i]);
                option.innerHTML = APP_DATA[fields[k]].data[i];
                selects[j].appendChild(option);
            }
        }
    }

    // initiate saved reports array if not present
    read_local_data('savedReports',function(){}, function(value){
        if(!value){write_local_data('savedReports','[]',function(e){},function(v){});}
        else{/*console.log(JSON.parse(value));*/}
    });
}


window.onload = function(){
    if(!("deviceready" in window)){init();}
    else{
        document.addEventListener("deviceready", function(){
            init();
        }, false);
    }
      
    // place anything else you cant to run at startup in `init` NOT here!
    //*
    document.getElementById('uname').value = 'richard.kato';
    document.getElementById('pswd').value = '1234567b';
    login();
    //*/    
}
