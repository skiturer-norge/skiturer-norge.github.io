var tilesDb = {
    getItem: function (key) {
        return localforage.getItem(key);
    },
    setBounds:function(bounds){
      localforage.setItem('bounds', bounds)
    },
    getBounds: async function (bounds){
      return await localforage.getItem('bounds')
    },
    nTiles:null,
    setNTiles:function(nTiles){
      this.nTiles=nTiles;
    },
    nLayerDownloadSuccess:0,
    saveTiles: function (tileUrls,bounds,updateProgress=null) {
        var self = this;
        var promises = [];
        var nTiles = tileUrls.length
        var update = updateProgress;

        for (var i = 0; i < tileUrls.length; i++) {
            var tileUrl = tileUrls[i];

            (function(i,tileUrl,nTiles,update){
                promises[i] = new Promise( function (resolve, reject) {
                  var request = new XMLHttpRequest();
                  request.open('GET', tileUrl.url, true);
                  request.responseType = 'blob';
                  request.onreadystatechange = function () {
                      if (request.readyState === XMLHttpRequest.DONE) {
                          if (request.status === 200) {
                              resolve(self._saveTile(tileUrl.key, request.response, update));
                          } else {
                              reject({
                                  status: request.status,
                                  statusText: request.statusText
                              });
                          }
                      }
                  };
                  request.send();
              });
            })(i,tileUrl,nTiles,update)
        }
        return Promise.all(promises);
    },
    clear: function () {
        return localforage.clear();
    },
    _saveTile: async function (key, value,update) {
      await this._removeItem(key).then(function () {
          return localforage.setItem(key, value);
      });
      let i = await localforage.length();
      update(i)
      return
    },
    _removeItem: function (key) {
        return localforage.removeItem(key);
    },
    confirmDelete:function(){
      var that = this
      if(confirm('Do you want to delete the current offline map?')){
        localforage.clear();
      }
    },
    zoomToBounds:async function(){
      bounds = await localforage.getItem('bounds')
      map.fitBounds([[bounds._southWest.lat,bounds._southWest.lng],[bounds._northEast.lat,bounds._northEast.lng]])
    }
};

var freezeMap = {
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
}
