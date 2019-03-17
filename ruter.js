var ruter = {
  ut : {
    features : new L.FeatureGroup(),
    turPopup :function (tur){
        return("<div><a target='_bank' href='"+tur.href+"'>"+tur.name+"</a></div>")
    },
    hyttaPopup :function (tur){
        return("<div><a target='_bank' href='"+tur.href+"'>"+tur.name+" ("+tur.type+")</a></div>")
    },
    addTur:function(tur){
      L.polyline( tur.points, {
        weight:2,
        color:'rgb(0, 140, 255)',
      }).bindPopup(ruter.ut.turPopup(tur)).on('mouseover', function (e) {
        e.target.setStyle({
          weight:4,
          color:'rgb(2, 119, 215)',
        });
      }).on('mouseout', function (e) {
        e.target.setStyle({
          weight:2,
          color:'rgb(0, 140, 255)',
        })
      }).addTo(ruter.ut.features)
    },
    addHytta : function(hytta){
        L.marker( hytta.points,{
          weight:3,
          color:'rgb(162, 0, 0)'
        }).bindPopup(ruter.ut.hyttaPopup(hytta)).addTo(ruter.ut.features)
    },
    init : function(map){
      this.features.addTo(map)
        // ruter
        if('ut_ruter' in localStorage){
          var s = LZString.decompress(localStorage['ut_ruter'])
          JSON.parse(s).map(ruter.ut.addTur)
          console.log('Routes decompressed')
        }else{
          $.ajax({
            url:'./ruter/ut/skiturer.json',
            method:'get',
            success:function(data){
              localStorage['ut_ruter'] = LZString.compress(JSON.stringify(data));
              data.map(ruter.ut.addTur)
            }
          })
        };
        // hytter
        if('ut_hytter' in localStorage){
          JSON.parse(localStorage['ut_hytter']).map(ruter.ut.addHytta)
        }else{
          $.ajax({
            url:'./ruter/ut/hytter.json',
            method:'get',
            success:function(data){
              localStorage['ut_hytter'] = JSON.stringify(data)
              data.map(ruter.ut.addHytta)
            }
          })
        };
    }
  },
  user : {
    features : new L.FeatureGroup(),
    addGpxTur:function(gpxStr){
      tur = gpx.parse(gpxStr)
      tur.tracks.map(function(el){
        L.polyline( el.pts, {
          weight:2,
          color:'rgb(255, 0, 255)'
        }).bindPopup(ruter.user.popup(tur)).on('mouseover', function (e) {
          e.target.setStyle({
            weight:4
          });
        }).on('mouseout', function (e) {
          e.target.setStyle({
            weight:2
          })
        }).addTo(ruter.user.features)

      })
    },
    popup:function(tur){
      let htmlStr = "<div class='userRuteInfo'>"+
        "<h3 class='title'><span class='display'>"+tur['name']+"</span></h3>"+
        // "<p>Option "+track.optionNo+"</p>"+
        "<p class='description'><span class='display'>"+tur['desc']+"</span></p>"+
        "</div>"
      return(htmlStr)
    },
    init : function(){
      this.features.addTo(map)

      if('user_routes' in localStorage){
        JSON.parse(localStorage['user_routes']).map(ruter.user.addTur)
      }else{
        $.ajax({
          url:'./ruter/user_onload.txt',
          method:'get',
          success:function(data){
            let routes = data.split('\n').filter(function(i){return(i[0]!='#' & i!='')})
            routes.map(function(j){
              $.ajax({
                url:'./ruter/user/'+j,
                method:'get',
                dataType : 'text',
                success:function(gpxStr){
                  ruter.user.addGpxTur(gpxStr)
                }
              })
            })
          }
        })
      };
    }
  },
  draw: {
    features : new L.FeatureGroup(),
    infoTemplate : {
       name: 'New route',
       desc: 'This is an empty description',
       tracks : []
    },
    popup:function(el){
      let track = ruter.draw.info.tracks.filter(function(i){return(i.leaflet_id==el._leaflet_id)})[0]
      let htmlStr = "<div class='userRuteInfo'>"+
        "<h3 class='title'><span class='display'>"+ruter.draw.info['name']+"</span><span class='ruteToggle edit title' onclick='ruter.draw.infoToggle(event)'> 	&#9997;</span></h3>"+
        "<h3 class='title input' style='display:none;'><input type='text' value='"+ruter.draw.info['name']+"'></input><span class='ruteToggle save' onclick='ruter.draw.infoToggle(event)'> &#128190;</span></h3>"+
        "<p>Option "+track.optionNo+" <select onchange='ruter.draw.typeChange(event)' class='type leaflet_id_"+track.leaflet_id+"' value='"+track.type+"' class='downhillCheckbox'><option value='both'>Up & Downhill</option><option value='downhill'>Downhill only</option></select></p>"+
        "<p class='description'><span class='display'>"+ruter.draw.info['desc']+"</span><span class='ruteToggle edit description' onclick='ruter.draw.infoToggle(event)'> 	&#9997;</span></p>"+
        "<p class='description input' style='display:none;'><textarea type='textarea' style='width:280px;height:70px;' value='"+ruter.draw.info['desc']+"'></textarea><span class='ruteToggle save description' onclick='ruter.draw.infoToggle(event)'> 	&#128190;</span></p>"
        "</div>"
      return(htmlStr)
    },
    saveLocal:function(){
      this.info.tracks = this.info.tracks.filter(function(i){
        return(i['leaflet_id'] in ruter.draw.features._layers)
      });
      this.info.tracks = this.info.tracks.map(function(i){
        if('_latlngs' in ruter.draw.features._layers[i.leaflet_id]){
          i.pts = ruter.draw.features._layers[i.leaflet_id]._latlngs
        }
        return(i)
      })
      localStorage['currentDraw'] = JSON.stringify(this.info)
    },
    getTrackBounds : function(track){
      return({
        '_southWest' : {
          'lat' : Math.min.apply(null,track.pts.map(function(j){return(j.lat)})),
          'lng' : Math.min.apply(null,track.pts.map(function(j){return(j.lng)}))
        },
        '_northEast' : {
          'lat' : Math.max.apply(null,track.pts.map(function(j){return(j.lat)})),
          'lng' : Math.max.apply(null,track.pts.map(function(j){return(j.lng)}))
        }
      })
    },
    aggBounds : function(bounds){
      return({
        '_southWest' : {
          'lat' : Math.min.apply(null,bounds.map(function(j){return(j._southWest.lat)})),
          'lng' : Math.min.apply(null,bounds.map(function(j){return(j._southWest.lng)}))
        },
        '_northEast' : {
          'lat' : Math.max.apply(null,bounds.map(function(j){return(j._northEast.lat)})),
          'lng' : Math.max.apply(null,bounds.map(function(j){return(j._northEast.lng)}))
        }
      })
    },
    getBounds:function(){
      let trackBounds = this.info.tracks.map(this.getTrackBounds)
      let drawBounds = this.aggBounds(trackBounds)
      return(drawBounds)
    },
    loadLocal:function(){
      if(!('currentDraw' in localStorage)){
        return
      }
      this.info = JSON.parse(localStorage['currentDraw'])
      this.info.tracks = this.info.tracks.map(function(i){
        let newLine = L.polyline(i.pts,{
          weight : 2,
          color: 'red',
          opacity: 1
        }).on('mouseover', function (e) {
          e.target.setStyle({
            weight:4
          });
        }).on('mouseout', function (e) {
          e.target.setStyle({
            weight:2
          })
        }).bindPopup(ruter.draw.popup).addTo(ruter.draw.features);
        i.leaflet_id = newLine._leaflet_id;
        return(i)
      })
    },
    infoToggle:function(e){
      var targetType = e.target.classList.contains('description') ? 'description' : 'title';
      if(e.target.classList.contains('save')){
        let newVal = $('.'+targetType+'.input').children().eq(0).val()
        ruter.draw.info[targetType] = newVal
        $('.'+targetType+' .display').html(newVal)
        ruter.draw.saveLocal()
      }
      $('.userRuteInfo .'+targetType).each(function(i,el){
        if(el.classList.contains('ruteToggle')){
          return
        }
        if(el.style.display==""){
          el.style.display='none'
        }else{
          el.style.display=''
        }
      })
    },
    typeChange:function(e){
      leaflet_id = parseInt(e.target.classList[1].replace('leaflet_id_',''))
      ruter.draw.info.tracks.filter(function(i){return(i.leaflet_id==leaflet_id)})[0]['type'] = e.target.value
      if(e.target.value=='downhill'){
        this.features._layers[leaflet_id].setStyle({
          dashArray:'12, 4',
          lineCap:'squared'
        })
      }else{
        this.features._layers[leaflet_id].setStyle({
          dashArray:''
        })
      }
    },
    addEvents:function(map){
      map.on(L.Draw.Event.CREATED, function (event) {
        var newLine = event.layer;
        newLine.on('mouseover', function (e) {
          e.target.setStyle({
            weight:4
          });
        }).on('mouseout', function (e) {
          e.target.setStyle({
            weight:2
          })
        }).bindPopup(ruter.draw.popup).addTo(ruter.draw.features);
        ruter.draw.info.tracks.push({ leaflet_id: newLine._leaflet_id, type: 'both', optionNo : (ruter.draw.info.tracks.length+1) });
        ruter.draw.saveLocal()
      });
      map.on('draw:toolbarclosed', function (event) {
        $('div.leaflet-draw-section').eq(1).hide()
      });
      map.on('draw:toolbaropened', function (event) {
        $('div.leaflet-draw-section').eq(1).show()
      });
      map.on('draw:editstart', function (event) {
        $('div.leaflet-draw-section').eq(1).show()
      });
      map.on('draw:editstop', function (event) {
        $('div.leaflet-draw-section').eq(1).hide()
        ruter.draw.saveLocal()
      });
      map.on('draw:deletestart', function (event) {
        $('div.leaflet-draw-section').eq(1).show()
      });
      map.on('draw:deletestop', function (event) {
        $('div.leaflet-draw-section').eq(1).hide()
        ruter.draw.saveLocal()
      });
      map.on('draw:deleted ',function(){
        ruter.draw.saveLocal()
      });
      map.on('draw:save', function (event) {
        ruter.draw.saveLocal();
        var xml = gpx.getXML(ruter.draw.info);
        var fileName = ruter.draw.info.name.replace(/\W+/g,'_')+'.gpx'
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(xml));
        a.setAttribute('download', fileName);
        a.click();
      });
      map.on('draw:publish', function (event) {
        ruter.draw.saveLocal();
        var xml = gpx.getXML(ruter.draw.info);
        var name = ruter.draw.info.name.replace(/\W+/g,'_');
        $.ajax({
            url: 'http://ec2-54-246-148-177.eu-west-1.compute.amazonaws.com/skiturer-norge/api/route/create',
            method: 'POST',
            crossDomain: true,
            data: JSON.stringify({
              'name': name,
              'gpx': xml
            }),
            success: function(){
              ruter.draw.reset()
            }
        })
      });
    },
    reset:function(){
      ruter.draw.info.tracks.map(function(i){
        ruter.draw.features.removeLayer(i.leaflet_id)
      })
      this.info = JSON.parse(JSON.stringify(ruter.draw.infoTemplate))
      localStorage.removeItem('currentDraw')
    },
    addButtons:function(){
      this.control._container.children[0].children[0].children[0].style = "background-image: url(https://img.icons8.com/material/24/000000/edit.png);background-size: 20px;background-position: center;"
      $('div.leaflet-draw-section').eq(1).hide()
      $('div.leaflet-draw-section').eq(1).children().append(`
        <a class="leaflet-draw-edit-save leaflet-enabled" href="#"
          onclick="map.fire('draw:editstop');map.fire('draw:save')"
          title="Save to file">
          <span class="sr-only">Save to file</span></a>
        `)
      $('.leaflet-draw-edit-save').css({
        backgroundImage: 'url(https://img.icons8.com/ios/32/000000/save-as.png)',
        backgroundSize: '15px',
        backgroundPosition: 'center'
      })
      $('div.leaflet-draw-section').eq(1).children().append(`
        <a class="leaflet-draw-edit-publish leaflet-enabled" href="#"
          onclick="map.fire('draw:editstop');map.fire('draw:publish')"
          title="Publish">
          <span class="sr-only">Publish</span></a>
        `)
      $('.leaflet-draw-edit-publish').css({
        backgroundImage: 'url(https://img.icons8.com/ios-glyphs/30/000000/internet.png)',
        backgroundSize: '15px',
        backgroundPosition: 'center'
      })
    },
    init:function(map){
      this.info = JSON.parse(JSON.stringify(this.infoTemplate))
      var MyCustomMarker = L.Icon.extend({
            options: {
                shadowUrl: null,
                iconAnchor: new L.Point(12, 12),
                iconSize: new L.Point(24, 24),
                iconUrl: 'link/to/image.png'
            }
        });
      this.control = new L.Control.Draw(
        {
        position:'topright',
        draw: {
          polygon: false,
          marker: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          polyline: {
            shapeOptions: {
              weight : 2,
              color: 'red',
              opacity: 1
            },
            icon: new L.DivIcon({
              iconSize: new L.Point(5, 5),
              className: 'leaflet-div-icon leaflet-editing-icon my-own-class'
            })
          }
        },
        edit: {
            featureGroup: this.features,
        }
      });
      this.features.addTo(map)
      this.control.addTo(map);
      this.addEvents(map);
      this.addButtons();
      this.loadLocal();
    }
  },
  checkVersion:function(map){
    if('version' in localStorage){
      if(localStorage['version'] != map.options.version){
        localStorage.clear()
      }
    }else{
      localStorage.clear()
    }
    localStorage['version'] = map.options.version
  },
  init:function(map){
    this.checkVersion(map)
    this.ut.init(map);
    this.user.init(map);
    this.draw.init(map);
  }
}
