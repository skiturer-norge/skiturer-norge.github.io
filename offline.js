var offline = {
  freezeMap : {
    on:function(){
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      zoom._container.style.visibility='hidden';
    },
    off:function(){
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      zoom._container.style.visibility='visible';
    },
  },
  init:function(map,offlineLayers){
    this.offlineLayers = offlineLayers;
    this.map = map;

    this.areaSelect = L.areaSelect({
      width:200, height:200
    }).on('download',function(){
      let bounds = this.getBounds();
      let layers = offline.selectControl.options.offlineLayers;
      let layerTiles = layers.map(function(i){return(i.countTiles(bounds,map))})
      let nTiles = layerTiles.reduce(function(a,b){return(a+b)});
      if(nTiles<600){
        if(confirm('Downloading an offline map will require significant data (~50MB). Do you want to proceed?')){
          tilesDb.setNTiles(nTiles)
          this.startProgress()
          var callback = offline.areaSelect.successOfflineLayerDownload.bind(offline.areaSelect)
          layers.map(function(i){
            i.saveBoundsTiles(bounds,map,offline.areaSelect.updateProgress,callback)
          })
          offline.freezeMap.on()
        }
      }else{
        let perTooBig = Math.round(((nTiles/600)-1)*100)
        alert('The selected area is too big (~'+perTooBig.toString()+'%). Please select a smaller area.')
      }
    }).on('downloadEnd',function(){
      localforage.getItem('bounds').then(function(bounds){
        rect = L.rectangle([[bounds._southWest.lat,bounds._southWest.lng],[bounds._northEast.lat,bounds._northEast.lng]],
          {color: "red", weight: 2,fill:null}).addTo(map);
      })
      alert('The selected area was successfully stored.')
      offline.areaSelect.endProgress()
      offline.areaSelect.hide()
      offline.freezeMap.off()
    }).addTo(this.map)

    L.Control.OfflineSelect = L.Control.extend({
      options: {
        position: 'topright',
        offlineLayers : this.offlineLayers,
        maxZoom:14,
      },
      onAdd: function (map) {
        var self=this;
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-save');

        container.style.width = '30px';
        container.style.height = '30px';
        container.style.backgroundColor = 'white'
        container.setAttribute('data-selectAreaActive','false')
        container.innerHTML = '<img style="padding:5px;cursor:pointer;" width="20px" height="20px" src="https://img.icons8.com/material/24/000000/download.png">'

        container.onclick = async function(){
          let offlineMapSaved = !(await tilesDb.getBounds() === null)
          let selectAreaActive = this.getAttribute('data-selectAreaActive')=='true'
          if(!selectAreaActive & !offlineMapSaved){
            offline.areaSelect._container.style.opacity=1
            $('.leaflet-control-save').attr('data-selectAreaActive','true')
          }else if(!selectAreaActive & offlineMapSaved){
            map.fire('modal', {
                content: '<b>Offline Map:</b><br>\
                <p class="modalButton" onclick="tilesDb.zoomToBounds();map.closeModal()">Zoom to map</p>\
                <p class="modalButton" onclick="tilesDb.confirmDelete();rect.remove();map.closeModal()">Delete map</p>',        // HTML string
                MODAL_CLS: 'modal',
                zIndex: 10000,                       // needs to stay on top of the things
              });
          }else{
            offline.areaSelect._container.style.opacity=0
            $('.leaflet-control-save').attr('data-selectAreaActive','false')
          }
        }
        return container;
      }
    });

    this.selectControl = new L.Control.OfflineSelect().addTo(map)
    this.areaSelect.hide()

    localforage.getItem('bounds').then(function(bounds){
      if(bounds && typeof bounds !='undefined'){
        rect = L.rectangle([
            [bounds._southWest.lat,bounds._southWest.lng],
            [bounds._northEast.lat,bounds._northEast.lng]
          ],{color: "red", weight: 2,fill:null}).addTo(map);
      }
    })
  }
}
