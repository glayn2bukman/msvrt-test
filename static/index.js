"use strict";var global=this,UNBS_SERVERS=["https://meters-dev.unbs.go.ug/api/"],SESSION_ID="",DEVICE_SERIAL_NUMBER="",LOCATION=null,AGENT={uname:"",names:""},BTPrinterName="Qsprinter",EDITING={},TARGET_DEVICE="03744098AV000487",LOGIN_REF={};function request(e,t,n=null,o=null,a=null,i=0,r=null,c=null,l=!0){isOnline()&&i!=UNBS_SERVERS.length?(start_loading(),jQuery.ajax({type:"POST",url:UNBS_SERVERS[i],data:JSON.stringify(n),complete:function(){stop_loading()},success:o,error:function(d){request(e,t,n,o,a,++i,r,c,l)},dataType:"json",contentType:"application/json",processData:!1,async:l})):a?a():flag_error("failed to communicate with all UNBS servers. are we online?")}function readserial(){try{DEVICE_SERIAL_NUMBER=device.serial}catch(e){}}function readbarcode(e){try{cordova.plugins.barcodeScanner.scan(function(t){e.value=t.text},function(e){},{preferFrontCamera:!1,showFlipCameraButton:!0,showTorchButton:!0,torchOn:!1,prompt:"scan barcode"})}catch(e){flag_error(e+". this is likely because you're on PC")}}function increase_opacity(e,t){(t+=.1)>=1||(e.style.opacity=t+"",setTimeout(increase_opacity,150,e,t))}function back(e){"inspection"==e?(document.getElementById("inspection").style.display="none",document.getElementById("meter_details").style.display="block",increase_opacity(document.getElementById("meter_details"),0)):"meter_details"==e&&logout()}function next(e){if("inspection"==e);else if("meter_details"==e){let e=validate_form("meter_details");if("debug"!=DEVICE_SERIAL_NUMBER&&!e.status)return void flag_error(e.log+" is blank!");document.getElementById("meter_details").style.display="none",document.getElementById("inspection").style.display="block",increase_opacity(document.getElementById("inspection"),0)}}function GPSon(){let e=!0;try{CheckGPS.check(function(){},function(){showToast("please turn on your GPS(location), you wont submit the report if GPS off"),e=!1})}catch(t){return e}return e}function get_location(e=null,t=null,n=null,o=!0){if(GPSon())try{o&&start_loading(),LOCATION={time:0,latitude:0,longitude:0,address_line:"GPS-FAILED",address:"GPS-FAILED",locality:"OMITTED",sub_locality:"OMITTED",admin_area:"OMITTED",sub_admin_area:"OMITTED",feature_name:"OMITTED"},navigator.geolocation.getCurrentPosition(function(n){stop_loading(),LOCATION.time=n.timestamp,LOCATION.latitude=n.coords.latitude,LOCATION.longitude=n.coords.longitude,reverseGeocode({lat:n.coords.latitude,lon:n.coords.longitude},e,t)},function(n){stop_loading(),showToast("gps failed, continuing without coordinates..."),console.log("gps failed, continuing without coordinates..."),e&&e(t)},{timeout:5e4})}catch(e){n&&n(e)}else showToast("please turn on your GPS(location). if its on please turn location mode to DEVICE ONLY")}function login(){print_data(["Date/Time: 2019-05-17 16:26:37"])}var _swipe={startX:0,startY:0};function initSwipe(e,t,n=20,o=null){return}function validate_form(e){return{status:!0,log:""}}function upload(e=""){let t,n={ignore:{date:e.length?EDITING.ignore.date:document.getElementById("date").value,agent_uname:e.length?EDITING.ignore.agent_uname:AGENT.uname,agent:e.length?EDITING.ignore.agent:AGENT.names,device:e.length?EDITING.ignore.device:DEVICE_SERIAL_NUMBER},device:{serial:e.length?EDITING.device.serial_number:DEVICE_SERIAL_NUMBER},session_id:e.length?EDITING.session_id:SESSION_ID,data:{location:e.length?EDITING.data.location:{},meter:{serial_number:(t=document.getElementById(e+"sn").value,t.length?t:_throw("Device Serial Number?")),manufacturer:(t=document.getElementById(e+"manufacturer").value,t.length?t:_throw("Manufacturer?")),model:(t=document.getElementById(e+"modal").value,t.length?t:_throw("Modal?")),pattern_approval_number:(t=document.getElementById(e+"pan").value,t.length?t:_throw("Pattern Approval Number?")),type:document.getElementById(e+"prepaid").checked?"PREPAID":"POSTPAID",accuracy_class:(t=document.getElementById(e+"ac").value,t.length?t:_throw("Accuracy Class?")),rated_voltage:(t=document.getElementById(e+"rv").value,t.length?t:_throw("Rated Voltage?")),phase:document.getElementById(e+"single_phase").checked?"SINGLE":"THREE",location:(t=document.getElementById(e+"loc").value,t.length?t:_throw("Location?")),distributor:(t=document.getElementById(e+"dist").value,t.length?t:_throw("Distributor?"))},verification:{verification_id:document.getElementById(e+"vid").value,id:document.getElementById(e+"vid").value,rated_current:(t=document.getElementById(e+"rc").value,t.length?t:_throw("Rated Current?")),maximum_current:(t=document.getElementById(e+"maxc").value,t.length?t:_throw("Maximum Current?")),rated_voltage:(t=document.getElementById(e+"rv").value,t.length?t:_throw("Rated Voltage?")),credit_before_testing:(document.getElementById(e+"prepaid").checked&&(t=document.getElementById(e+"cbt").value),t.length?t:_throw("Credit Before Testing?")),credit_after_testing:(document.getElementById(e+"prepaid").checked&&(t=document.getElementById(e+"cat").value),t.length?t:_throw("Credit After Testing?")),energy_reading_before_test:(t=document.getElementById(e+"ebt").value,t.length?t:_throw("Energy Before Testing?")),energy_reading_after_test:(t=document.getElementById(e+"eat").value,t.length?t:_throw("Energy After Testing?")),free_issue_token_number:(document.getElementById(e+"prepaid").checked&&(t=document.getElementById(e+"fitn").value),t.length?t:_throw("Free Issue Token Number?")),connection_mode:(document.getElementById(e+"single_phase").checked||(t=document.getElementById(e+"cm").value),t.length?t:_throw("Connection Mode?")),ct_ration:(document.getElementById(e+"single_phase").checked||(t=document.getElementById(e+"ctr").value),t.length?t:_throw("Ct Ration?")),vt_ration:(document.getElementById(e+"single_phase").checked||(t=document.getElementById(e+"vtr").value),t.length?t:_throw("Vt Ration?")),meter_time:(document.getElementById(e+"single_phase").checked||(t=document.getElementById(e+"mt").value),t.length?t:_throw("Meter Time?")),gps_time:e.length?EDITING.data.verification.gps_time:get_datetime(),no_visible_damage:document.getElementById(e+"to").checked?"PASS":"FAIL",tamper_switch_operating_well:document.getElementById(e+"ts").checked?"PASS":"FAIL",meter_body_without_visiable_damage:document.getElementById(e+"mbo").checked?"PASS":"FAIL",screw_caps_and_body_seal_intact:document.getElementById(e+"sci").checked?"PASS":"FAIL",led_pulsating_output_functioning:document.getElementById(e+"lp").checked?"PASS":"FAIL",meter_receiving_power:document.getElementById(e+"mrp").checked?"PASS":"FAIL",meter_connecting_to_ciu:document.getElementById(e+"mc2c").checked?"PASS":"FAIL",meter_markings_visible:document.getElementById(e+"mmv").checked?"PASS":"FAIL",can_read_credit_balance_and_registers:document.getElementById(e+"crb").checked?"PASS":"FAIL",overall_accuracy_test:document.getElementById(e+"pot").checked?"PASS":"FAIL",sticker_number:e.length?EDITING.data.verification.sticker_number:document.getElementById(e+"pot").checked?(t=document.getElementById(e+"sticker_qrcode").value,t.length>=20?t:_throw("Sticker QRCode information should be 20+ characters long")):"",further_testing_recommended:document.getElementById(e+"ft").checked?"YES":"NO",meter_replacement_recommended:document.getElementById(e+"mr").checked?"YES":"NO",remarks:(t=document.getElementById(e+"remark").value,t.length?t:_throw("Remark?"))}}};{let e=document.getElementById("_print_div").getElementsByTagName("label"),t=[["verification","gps_time"],["meter","location"],["meter","manufacturer"],["meter","distributor"],["meter","model"],["meter","serial_number"],["meter","accuracy_class"],["meter","type"],["verification","free_issue_token_number"],["verification","id"],["meter","pattern_approval_number"],["verification","rated_voltage"],["verification","rated_current"],["verification","maximum_current"],["meter","phase"],["verification","meter_time"],["verification","connection_mode"],["verification","ct_ration"],["verification","vt_ration"],["verification","credit_before_testing"],["verification","credit_after_testing"],["verification","energy_reading_before_test"],["verification","energy_reading_after_test"],["verification","tamper_switch_operating_well"],["verification","meter_body_without_visiable_damage"],["verification","no_visible_damage"],["verification","screw_caps_and_body_seal_intact"],["verification","meter_markings_visible"],["verification","led_pulsating_output_functioning"],["verification","meter_receiving_power"],["verification","meter_connecting_to_ciu"],["verification","can_read_credit_balance_and_registers"],["verification","overall_accuracy_test"],["verification","further_testing_recommended"],["verification","meter_replacement_recommended"]];for(let o=0;o<e.length;++o)e[o].children[0].setAttribute("value",n.data[t[o][0]][t[o][1]]),e[o].setAttribute("title",n.data[t[o][0]][t[o][1]])}if(e.length){n.device,n.data,n.session_id;request("","POST",n,function(e){e.status&&!e.error?(show_success("data updated successfully"),hide_modal("reports_modal"),done_editting_reports()):flag_error(e.message)},null,0,null,null)}else{if(!GPSon())return void showToast("please turn on your GPS(location), you wont submit the report if GPS off");get_location(function(){n.data.location=LOCATION,request("","POST",{device:n.device,data:n.data,action:"processverification",session_id:n.session_id},function(e){e.error?flag_error(e.message):(show_success("data sent successfully"),refresh(),document.getElementById("inspection").style.display="none",document.getElementById("meter_details").style.display="block",show_modal("print_modal"))},function(){read_local_data("savedReports",function(){},function(e){let t;(t=e?JSON.parse(e):[]).push(n),write_local_data("savedReports",JSON.stringify(t),function(e){},function(e){}),show_success("data saved locally as we could not communicate with UNBS servers"),refresh(),document.getElementById("inspection").style.display="none",document.getElementById("meter_details").style.display="block",show_modal("print_modal")})},0,null,null)},null,showToast,!0)}}function showToast(e,t="long",n="bottom"){try{window.plugins.toast.show(e,t,n)}catch(t){console.log(e)}}function refresh(){LOCATION=null;let e=document.getElementsByTagName("form");for(let t=0;t<e.length;++t)e[t].reset();setTimeout(function(){document.getElementById("prepaid").checked=!0,document.getElementById("postpaid").checked=!1,document.getElementById("single_phase").checked=!0,document.getElementById("three_phase").checked=!1,toggle_prepaid({checked:!0}),toggle_single_phase({checked:!0}),toggle_sticker({checked:!1})},500)}function toHex(e){for(var t="",n=0;n<e.length;n++)t+=""+e.charCodeAt(n).toString(16);return t}function print_data(e){try{BTPrinter.list(function(t){t.indexOf(BTPrinterName)<0?show_info(BTPrinterName+" is not among the connected devices"):(start_loading(),BTPrinter.connect(function(t){stop_loading();let n="1B 40";n+="1B 61 01",n+="1B 45 01",n+=HEXA("xxx UNBS SMVT xxx"),n+="0A",n+=HEXA("-- Inspection Receipt --"),n+="1B 45 00",n+="0A",n+=HEXA("------------------------------"),n+="1B 61 00",n+="0A";try{BTPrinter.printPOSCommand(function(e){},function(e){},n)}catch(e){flag_error(e)}for(let t=0;t<e.length;++t)BTPrinter.printText(function(e){},function(e){flag_error("printing ERROR: "+e)},e[t]+"\n");BTPrinter.disconnect(function(e){},function(e){},BTPrinterName)},function(e){show_info("connecting: "+e)},BTPrinterName))},function(e){show_info(e)})}catch(e){flag_error(e)}}function _print(){let e=document.getElementById("_print_div").getElementsByTagName("label"),t=[];for(let n=0;n<e.length;++n)e[n].children[0].checked&&t.push(e[n].innerHTML.slice(e[n].innerHTML.indexOf(">")+1,e[n].innerHTML.length)+": "+e[n].children[0].value);t.length?print_data(t):show_info("please check at least one item")}function reverseGeocode(e={lat:.3129344,lon:32.5861376},t=null,n=null){LOCATION&&(LOCATION.address="Unknown",LOCATION.address_line="Unknown"),isOnline()?(start_loading(),$.ajax({type:"GET",url:"http://nominatim.openstreetmap.org/reverse?format=json&lon="+e.lon+"&lat="+e.lat,async:!0,complete:function(e){e.status&&200!=e.status&&showToast("REVERSE-GEOCODE:: server reply status: "+e.status),stop_loading(),t&&t(n)},error:function(e,t,n){showToast("failed to fetch address, continuing without it"),console.log("failed to fetch address, continuing without it")},success:function(e){LOCATION.address=e.display_name,LOCATION.address_line=e.display_name},timeout:1e4})):t&&t(n)}function send_report_update(){upload("e_")}function edit_report(e){let t,n;"PREPAID"==(EDITING=this.data).data.meter.type?(t=!0,document.getElementById("e_prepaid").checked=!0,document.getElementById("e_postpaid").checked=!1,toggle_prepaid({checked:!0})):(t=!1,document.getElementById("e_prepaid").checked=!1,document.getElementById("e_postpaid").checked=!0,toggle_postpaid({checked:!0})),"SINGLE"==EDITING.data.meter.phase?(n=!0,document.getElementById("e_single_phase").checked=!0,document.getElementById("e_three_phase").checked=!1,toggle_single_phase({checked:!0})):(n=!1,document.getElementById("e_single_phase").checked=!1,document.getElementById("e_three_phase").checked=!0,toggle_three_phase({checked:!0})),document.getElementById("e_sn").value=EDITING.data.meter.serial_number,document.getElementById("e_manufacturer").value=EDITING.data.meter.manufacturer,document.getElementById("e_modal").value=EDITING.data.meter.model,document.getElementById("e_pan").value=EDITING.data.meter.pattern_approval_number,document.getElementById("e_ac").value=EDITING.data.meter.accuracy_class,document.getElementById("e_rv").value=EDITING.data.meter.rated_voltage,document.getElementById("e_loc").value=EDITING.data.meter.location,document.getElementById("e_dist").value=EDITING.data.meter.distributor,document.getElementById("e_vid").value=EDITING.data.verification.id,document.getElementById("e_vid").value=EDITING.data.verification.verification_id,document.getElementById("e_rc").value=EDITING.data.verification.rated_current,document.getElementById("e_maxc").value=EDITING.data.verification.maximum_current,document.getElementById("e_rv").value=EDITING.data.verification.rated_voltage,document.getElementById("e_cbt").value=t?EDITING.data.verification.credit_before_testing:"",document.getElementById("e_cat").value=t?EDITING.data.verification.credit_after_testing:"",document.getElementById("e_ebt").value=EDITING.data.verification.energy_reading_before_test,document.getElementById("e_eat").value=EDITING.data.verification.energy_reading_after_test,document.getElementById("e_fitn").value=t?EDITING.data.verification.free_issue_token_number:"",document.getElementById("e_cm").value=n?"":EDITING.data.verification.connection_mode,document.getElementById("e_ctr").value=n?"":EDITING.data.verification.ct_ration,document.getElementById("e_vtr").value=n?"":EDITING.data.verification.vt_ration,document.getElementById("e_mt").value=n?"":EDITING.data.verification.meter_time,document.getElementById("e_to").checked="PASS"==EDITING.data.verification.no_visible_damage,document.getElementById("e_ts").checked="PASS"==EDITING.data.verification.tamper_switch_operating_well,document.getElementById("e_mbo").checked="PASS"==EDITING.data.verification.meter_body_without_visiable_damage,document.getElementById("e_sci").checked="PASS"==EDITING.data.verification.screw_caps_and_body_seal_intact,document.getElementById("e_lp").checked="PASS"==EDITING.data.verification.led_pulsating_output_functioning,document.getElementById("e_mrp").checked="PASS"==EDITING.data.verification.meter_receiving_power,document.getElementById("e_mc2c").checked="PASS"==EDITING.data.verification.meter_connecting_to_ciu,document.getElementById("e_mmv").checked="PASS"==EDITING.data.verification.meter_markings_visible,document.getElementById("e_crb").checked="PASS"==EDITING.data.verification.can_read_credit_balance_and_registers,document.getElementById("e_pot").checked="PASS"==EDITING.data.verification.overall_accuracy_test,document.getElementById("e_ft").checked="YES"==EDITING.data.verification.further_testing_recommended,document.getElementById("e_mr").checked="YES"==EDITING.data.verification.meter_replacement_recommended,document.getElementById("e_remark").value=EDITING.data.verification.remarks,show_modal("reports_modal")}function populate_reports(e){let t,n,o,a="",i=document.getElementById("reports_list_div");clear(i);let r=[["Time","report-time"],["Meter","report-meter"],["Token","report-token"]];for(let e=0;e<r.length;++e)(n=document.createElement("span")).setAttribute("class","report-title report-col-title "+r[e][1]),n.innerHTML=r[e][0],i.appendChild(n);for(let c=0;c<e.length;++c)if(e[c][1].data){e[c][0].split(" ")[0]!=a&&(a=e[c][0].split(" ")[0],(t=document.createElement("div")).setAttribute("class","report-date report-title"),t.innerHTML=a,i.appendChild(t)),r=[[o=e[c][1].ignore.date.split(" ")[1].slice(0,5),"report-time"],[e[c][1].data.meter.serial_number?e[c][1].data.meter.serial_number:"-","report-meter"],[e[c][1].data.verification.free_issue_token_number?e[c][1].data.verification.free_issue_token_number:"-","report-token"]];for(let t=0;t<r.length;++t)(n=document.createElement("span")).setAttribute("class",r[t][1]+(c%2?" report-odd":"")),n.style.marginBottom="5px",n.innerHTML=r[t][0],i.appendChild(n),"report-meter"==r[t][1]&&(n.data=e[c][1],n.onclick=edit_report)}}function fetch_reports(e){show_info("not yet implemented")}function done_editting_reports(){document.getElementById("reports_div").style.display="none",document.getElementById("meter_details").style.display="block"}function write_local_data(e,t,n,o){e="unbs_Jerm_"+e,localforage.setItem(e,t,function(t){t?n(t):o(e)})}function read_local_data(e,t,n){e="unbs_Jerm_"+e,localforage.getItem(e,function(e,o){e?t(e):n(o)})}function toggle_prepaid(e){let t=document.getElementsByClassName("prepaid-only");for(let n=0;n<t.length;++n)e.checked?t[n].style.display="block":t[n].style.display="none"}function toggle_postpaid(e){toggle_prepaid({checked:!1})}function toggle_three_phase(e){let t=document.getElementsByClassName("three-phase-only");for(let n=0;n<t.length;++n)e.checked?t[n].style.display="block":t[n].style.display="none"}function toggle_single_phase(e){toggle_three_phase({checked:!1})}function toggle_sticker(e){let t=document.getElementsByClassName("sticker");for(let n=0;n<t.length;++n)e.checked?t[n].style.display="block":t[n].style.display="none"}function _throw(e){throw flag_error(e),e}function upload_saved_reports(){SESSION_ID?(hide_modal("saved_reports_modal"),read_local_data("savedReports",function(){},function(e){if(e){let t=JSON.parse(e),n=[],o=document.getElementById("saved_reports_div").getElementsByTagName("label");for(let e=1;e<o.length;++e)if(o[e].children[0].checked&&!o[e].children[0].getAttribute("value")){showToast("uploading report "+e+"...");let o={device:t[e-1].device,data:t[e-1].data,action:"processverification",session_id:SESSION_ID};request("","POST",o,function(t){console.log(o,t),t.error?flag_error(t.message):n.push(e-1)},null,0,null,null,!1)}let a=[];for(let e=0;e<t.length;++e)n.indexOf(e)<0&&a.push(t[e]);write_local_data("savedReports",JSON.stringify(a),function(e){},function(e){}),setTimeout(function(){showToast("reports uploaded successfully")},500)}else flag_error("storage error. saved reports seem to be missing")})):show_info("you dont have a session ID. please connect to internet, logout and login again to attain one")}function select_all_saved_reports(e){let t=document.getElementById("saved_reports_div").getElementsByTagName("label");for(let n=0;n<t.length;++n)t[n].children[0].checked=e.checked}function show_saved_reports(){read_local_data("savedReports",function(){},function(e){if(e){let t=JSON.parse(e);if(!t.length)return void show_info("no saved reports found");let n=document.getElementById("saved_reports_div");clear(n),n.innerHTML="<div class='checkbox'><label><input type='checkbox' value='all' onchange='select_all_saved_reports(this)'>Select All</label></div>";for(let e=0;e<t.length;++e)n.innerHTML+="<div class='checkbox'><label><input type='checkbox'>"+t[e].data.verification.gps_time+"</label></div>";show_modal("saved_reports_modal")}else show_info("no saved reports found")})}function isOnline(){try{return navigator.connection.type!=Connection.NONE}catch(e){return!0}}function get_datetime(){let e=new Date,t=e.getMonth()+1,n=e.getDate(),o=e.getHours(),a=e.getMinutes(),i=e.getSeconds();return t=t<9?"0"+t:t,n=n<9?"0"+n:n,o=o<9?"0"+o:o,a=a<9?"0"+a:a,i=i<9?"0"+i:i,e.getFullYear()+"-"+t+"-"+n+" "+o+":"+a+":"+i}function showSerialError(){showToast("This application is NOT targeted for this device. Please talk to JERM Technology about this")}function init(){if(new CircleType(document.getElementById("title")).radius(190),readserial(),DEVICE_SERIAL_NUMBER!=TARGET_DEVICE)return void showSerialError();let e,t,n=["inspection","meter_details"];for(let e=0;e<n.length;++e)initSwipe(document.getElementById(n[e]),function(e,t){"right"==e.resultant?back(t):"left"==e.resultant&&next(t)},100,n[e]);document.addEventListener("backbutton",function(e){if(e.stopPropagation(),"block"==document.getElementById("personnel").style.display)e.preventDefault(),back("personnel");else if("block"==document.getElementById("inspection").style.display)e.preventDefault(),back("inspection");else{if("block"!=document.getElementById("meter_details").style.display)return!0;e.preventDefault(),logout()}},!1),GPSon()||showToast("please turn on your GPS(location), you wont submit the report if GPS off(set location mode to DEVICE ONLY)");let o=["districts","distributors","manufacturers","modals","ct_rations","vt_rations","connection_modes","accuracy_classes","rated_voltages","rated_currents","max_currents"];for(let n=0;n<o.length;++n){t=document.getElementsByClassName(APP_DATA[o[n]].class),APP_DATA[o[n]].data.sort(),APP_DATA[o[n]].data.push("Other");for(let a=0;a<APP_DATA[o[n]].data.length;++a)for(let i=0;i<t.length;++i)(e=document.createElement("option")).setAttribute("value",APP_DATA[o[n]].data[a]),e.innerHTML=APP_DATA[o[n]].data[a],t[i].appendChild(e)}read_local_data("savedReports",function(){},function(e){e||write_local_data("savedReports","[]",function(e){},function(e){})})}window.onload=function(){"deviceready"in window?document.addEventListener("deviceready",function(){init()},!1):init()};
