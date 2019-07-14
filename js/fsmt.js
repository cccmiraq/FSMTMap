
jQuery(document).ready(function() {
	$('.typeahead').hide();
	$('#left_of_map').hide();
	$('#analysis').hide();

	var u = "https://ckanviz.swige.unhcr.org/dataset/4506c0af-4a8f-4d01-83a6-8b21f8041084/resource/1b25ff21-4d92-492b-9fc9-01a608f841d6/download/fsmt_sites.csv";
	var map, loc, name;
	d3.csv(u, function(data) {
		d3.csv("data/fields.csv", function(fields) {
			//map
			map = L.map('map'); /**/
			map.setView([0, 0], 1);
			//scalebar
			L.control.scale().addTo(map);
			//basemaps
			var mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18});
			var osm_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'});
			var esri_satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; <a href="http://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', maxZoom: 18});
			var esri_lightGrey = L.tileLayer('https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; <a href="http://www.esri.com/">Esri</a>,  HERE, DeLorme, MapmyIndia, © OpenStreetMap contributors, and the GIS user community ',maxZoom: 18});
			var esri_street = L.tileLayer('https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {attribution: '&copy; <a href="http://www.esri.com/">Esri</a>', maxZoom: 18});
			osm_HOT.addTo(map);

			// adding markers from CSV to map + to search fonction
			var csv_markers = new L.featureGroup().addTo(map);
			var marker_list = [];
			for (var i in data){
				if (data[i][config.lat] && data[i][config.lon]){
					var tValues = ['camp', 'collective centre', 'collective_centre', 'reception centre'];
					var t = data[i][config.type]
					t = t.toLowerCase()
					var icon = L.icon({
						iconUrl: tValues.indexOf(t) !== -1 ? 'img/markers_icon/'+t+'.svg' : 'img/markers_icon/default.svg',
						iconSize:     [20, 20], // size of the icon 
						iconAnchor:     [10,10] /**/
					});
					var marker = new L.marker([data[i][config.lat], data[i][config.lon]], {icon: icon, obj:data[i]}).bindPopup(data[i][config.name],{offset:new L.Point(0,0)});
					marker.on('mouseover', function (e) {
						this.openPopup();
					});
					marker.on('mouseout', function (e) {
						this.closePopup();
					});
					csv_markers.addLayer(marker)
					marker_list.push({'name':data[i][config.name], 'coordo': [data[i][config.lat], data[i][config.lon]], "properties":data[i]})
					
				}
			}
			map.fitBounds(csv_markers.getBounds());
			$('.typeahead').typeahead({
				source:marker_list,
				afterSelect: function(item) {
					info(item.properties);
					map.setView(item.coordo);
					map.setZoom(12);
					for (var i in csv_markers._layers){
						if (item.name == csv_markers._layers[i].options.obj[config.name]){	
							csv_markers._layers[i].openPopup()
						}
					}
				},
			})
			var blue_circle = L.circleMarker([0,0], {radius: 15, color: 'blue'}).addTo(map);
			csv_markers.on('click', function (a) {
				var a = a.layer.options.obj
				name = a.Camp_Name;
				loc = [parseFloat(a.coordinates_latitude),parseFloat(a.coordinates_longitude)];
				blue_circle.setLatLng(loc);
				info(a)
			});
			
			//layer switcher
			var baseMaps = {
				"OSM": mapnik,
				"OSM_HOT": osm_HOT,
				"Esri Satellite": esri_satellite,
				"Esri Light Grey": esri_lightGrey,
				"Esri Streets": esri_street,
			};
			var overlayMaps = {
				"Sites": csv_markers
			};
			L.control.layers(baseMaps, overlayMaps).addTo(map);
			
			$('.typeahead').show();
			$('#left_of_map').show();
			
			var c = config.categories
			
			//map analysis
			for (var i in c){
				$('#dropdown-list').append('<li class="dropdown-submenu"><a href="#"><img height="15px" src="img/ocha_icon/'+c[i].icon+'.png">&nbsp;'+c[i].alias+'</a><ul class="dropdown-menu" id="submenu_'+c[i].name+'"></ul></li>')
			}
			for (var i in fields){
				$('#submenu_'+fields[i].category+'').append('<li><a href="#">'+fields[i].alias+'</a></li>')
			}
			
			//$('#analysis').show();
			
			
//********  when clicking on a marker  ********//
			
			function info(h){
				//emptying divs
				left_of_map.innerHTML = "";
				below_map.innerHTML = "";
				
				//adding name, coordinates and last update
				$('#left_of_map').append('<h3>'+h[config.name]+'<br><small>Last Update: '+h[config.last_update]+'</small></h3><br><button id="icon-print">Export PDF</button>');

				
				//recreating divs
				
				var cl = c.length;
					if (cl > 0){
						$('#left_of_map').append("<div><h4><img height='30px' src='img/ocha_icon/"+c[0].icon+".png'>&nbsp;"+c[0].alias+"</h4><div  id='"+c[0].name+"'></div></div>");
						
						///
						var nb_col = 3;
						var rcl = cl-1;
						for (var i = 1; i < nb_col+1; i++){
							$('#below_map').append('<div id="col_'+i+'" class="col-md-'+12/nb_col+'"></div>')
						}
						for (var i = 1; i <= rcl; i++){
							var y = i%nb_col
							if (y==0){y=nb_col}
							$('#col_'+y+'').append("<div class='row categories'><h4><img height='30px' src='img/ocha_icon/"+c[i].icon+".png'>&nbsp;"+c[i].alias+"</h4><div id='"+c[i].name+"'></div></div>")
						}
						///
					}
					
				//looping on fields and populating
				for (var i in fields){
					var f = fields[i];
					if (h[f.csv_field]){ //if field is not null in data
						if (f.chart){	
						} //if it's a chart we add nothing here
						else { // if it's not a chart
							
							var tl = getTrafficLight(f.traffic_light,h[f.csv_field]);
							
							if (f.type == "list"){//if list
								var array = h[f.csv_field].split(',');
								if (array.length > 1){
									$("#"+f.category+"").append("<p><img class='tl' src='img/tl/tl-"+tl+".svg'>&nbsp;"+f.alias+" :<ul id='list_"+i+"'></ul></p>")
									for (var y in array){
											$("#list_"+i+"").append('<li><b style="color:#4095cd">'+array[y]+'</b></li>')
									}
								}
								else {
									$("#"+f.category+"").append("<p><img class='tl' src='img/tl/tl-"+tl+".svg'>&nbsp;"+f.alias+" : <b style='color:#4095cd'>"+h[f.csv_field]+"</b></p>")
								}
							}
							else {
								$("#"+f.category+"").append("<p><img class='tl' src='img/tl/tl-"+tl+".svg'>&nbsp;"+f.alias+" : <b style='color:#4095cd'>"+h[f.csv_field]+"</b></p>")
							}
						}
					}
				}
				
				// charts
				for (var i in config.charts){
					//create the graphs config
					var g = config.charts[i];

					if (g.name == "age_pyramid"){  // si le graph est la pyramide des ages
						g.config.data.datasets[0].data = [];
						g.config.data.datasets[1].data = [];
						for (var y in fields){
							var f = fields[y]
							if (g.name == f.chart){
								if (h[f.csv_field] > 0){
									if (f.chart_details == "f"){
										g.config.data.datasets[0].data.push(Number(h[f.csv_field]))
									}
									else if (f.chart_details == "m"){
										g.config.data.datasets[1].data.push(Number(0-h[f.csv_field]))
									}
								}
							}
							
						}
						//var max = Math.max.apply(Math, g.config.data.datasets[0].data);
						//var min = Math.min.apply(Math, g.config.data.datasets[1].data);
						//g.config.options.scales.xAxes[0].ticks.min = min;
						//g.config.options.scales.xAxes[0].ticks.max = max;
						g.config.options.tooltips = {
								callbacks: {
									obj: function(t,d){
										return d.datasets[t[0].datasetIndex].label+": "+d.labels[t[0].index];
									},
									label: function(t,d) {
										if (t.datasetIndex == 1){
											var invert = Number(0-d.datasets[1].data[t.index])
											return invert;
										}
										else {
											return d.datasets[0].data[t.index];
										}
									}
								}
							}
					}
					else { // autres graphs
						g.config.data.datasets[0].data = [];
						g.config.data.datasets[0].backgroundColor = [];
						g.config.data.labels = [];
						var data_list = [];
						for (var y in fields){
							var f = fields[y]
							if (g.name == f.chart){
								if (h[f.csv_field] > 0){
									data_list.push({"a":f.alias+" ("+Number(h[f.csv_field])+")","v": Number(h[f.csv_field])})
								}
							}
						}
						
						data_list.sort(function(a, b) {
							return parseFloat(b.v) - parseFloat(a.v);
						});
						var other_label = ["Others:"];
						if (data_list.length > 5){
							for (var i in data_list){
								if (i > 4){
									data_list[4].v = (data_list[4].v)+(data_list[i].v);
								}
								if (i > 3){
									var t = data_list[i].a;
									other_label.push(t);
								}
							}
							data_list[4].a = "Others"
							var de = data_list.length - 5;
							data_list.splice(5,de);
							var lb = other_label;
							g.config.options.tooltips = {
								callbacks: {
									label: function(t,d) {
										if (t.index == 4){
										return  lb;
										}
										else{
											return d.labels[t.index];
										}
									}
								}
							}
						}
						for (var i in data_list){
							g.config.data.datasets[0].data.push(data_list[i].v);
							g.config.data.datasets[0].backgroundColor.push(color_list[i]);
							g.config.data.labels.push(data_list[i].a);
						}
						
						
					}
					
					//creates the graphs div
					$("#"+g.category+"").append('<div ="canvas-holder" style="width:100%"><canvas height="'+g.height+'" id="chart_'+g.name+'" /></div>')
					//generates the graphs
					var ctx = document.getElementById("chart_"+g.name+"").getContext("2d");
					var chart = new Chart(ctx, g.config);
				}
				
			//$('#icon-print').hide()	; /**/
			$('#icon-print').unbind('click').click(function() { 
					//onprint(h[config.name]); 
					exportPdf(map);
			});
			
				
			}
			
		})
	});
		//when typing the letter P, lunches the print function
			$(window).keypress(function(e) {
				var key = e.which;	
				if (key==112){
					exportPdf()
				}
			});
			
			function exportPdf(mymap) { 
				swal({
					  title: "Exporting to PDF ...",
					  imageUrl: "http://www.owlhatworld.com/wp-content/uploads/2015/12/57.gif",
					  showConfirmButton: false,
					});
				console.log("export pdf start");
				$('#map').css('display','none');
				$('.typeahead').css('display','none');
				$('#icon-print').css('display','none');
				
				
				
				
				
				
				
				
				
				var w = $('.container').width();
				var h = $('.container').height();
				var colw = $('.col-md-4').height();
				var maxw = ''+0.77*$(window).width()/3+'px'; 
				// console.log(maxw)
				// $('.container').css('transform' ,'scale(2)');
				// $('.container').css('transform-origin' ,'0 0');
				// $('.container').css('width' ,'3000px');
				// $('.container').css('height' ,h*2+'px');
				// $('.col-md-4').css('width' ,'400px');
				// var new_w = $('.container').width();
				// var new_h = $('.container').height();
				
				
				
				var containerScale = 290/h;
				
				
				   var pdf = new jsPDF({
					  orientation: 'portrait',
					  unit: 'mm',
					  format: 'A4'
					});
	/////
				
				var  ret={data: null, pending: true};
				
				
	//////
				html2canvas($('.container'), {
					background :'#FFFFFF',
					onrendered: function(canvas) {
						
						var dataURL_canvas = canvas.toDataURL('image/jpeg').slice('data:image/jpeg;base64,'.length);
						console.log(canvas.width);
						console.log(canvas.height);
						dataURL_canvas = atob(dataURL_canvas)
						addAttributes(dataURL_canvas);
					}
				});
				
				function addAttributes(imgData){
					var wstart= (210-w*containerScale)/2;
					// var wstart = 10;
					console.log(wstart)
					pdf.addImage(imgData,'JPEG',wstart,5,w*containerScale,h*containerScale);
					//pdf.addImage(imgData,'JPEG',0,0,210,290);
					addMap(w,containerScale);
				}
				
				function addMap(w,containerScale){				
					$('#map').css('display','block');
					//L.circleMarker(loc, {radius: 15, color: 'blue'}).addTo(map);
					//var mapWidthInPDF = 120; // size of map on paper (or set height but not both)
					var mapHeightInPDF = 60 ; // size of map on paper (or set height but not both)
					var mapPosXInPDF = ((210-w*containerScale)/2)+((w*containerScale)/3)+10; // pdf unit, mm
					var mapPosYInPDF = 20; // pdf unit, mm
						
					var mapSize = mymap.getSize();
					var scale = 1;	
					if (typeof mapWidthInPDF != 'undefined') {
					  scale = mapWidthInPDF/mapSize.x;
					} else if (mapHeightInPDF) {
					  scale = mapHeightInPDF/mapSize.y;
					}
					console.log(scale)
					var date = new Date();
					var today = date.getFullYear() + "_" + (date.getMonth()+1) + "_" + date.getDate();
					L.getImage(mymap, function(image) {								
						pdf.addImage(image, 'jpg', mapPosXInPDF, mapPosYInPDF, mapSize.x*scale, mapSize.y*scale);
						pdf.save(name+"_"+today +'.pdf');
						swal({
							  title: "Export complete ! ",
							  text: " ",
							  type: "success",
							  showCancelButton: false,
							},
							function(){
								$('.typeahead').css('display','block');
								$('#icon-print').css('display','block');
							});
						});	
				}
			}

});	
	

