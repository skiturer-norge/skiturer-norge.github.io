L.AreaSelect = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        width: 200,
        height: 300,
        keepAspectRatio: false,
    },
    initialize: function(options) {
        L.Util.setOptions(this, options);

        this._width = this.options.width;
        this._height = this.options.height;
    },
    hide:function(){
      this._container.style.opacity=0;
    },
    show:function(){
      this._container.style.opacity=1;
    },
    updateProgress:function(i){
      let updateStr = Math.round(((i-1)/tilesDb.nTiles)*100).toString()+'%';
      progress = document.querySelector('.leaflet-areaselect-progress')
      progress.innerHTML = updateStr
    },
    startProgress:function(){
      this._downloadButton.style.visibility = 'hidden';
      progress = document.querySelector('.leaflet-areaselect-progress')
      progress.style.visibility = 'visible';
      progress.innerHTML = '1%'
    },
    endProgress:function(){
      this._progress.style.visibility = 'hidden';
      this._downloadButton.style.visibility = 'visible';
    },
    addTo: function(map) {
        this.map = map;
        this._createElements();
        this._render();
        return this;
    },
    getBounds: function() {
        var size = this.map.getSize();
        var topRight = new L.Point();
        var bottomLeft = new L.Point();

        bottomLeft.x = Math.round((size.x - this._width) / 2);
        topRight.y = Math.round((size.y - this._height) / 2);
        topRight.x = size.x - bottomLeft.x;
        bottomLeft.y = size.y - topRight.y;

        var sw = this.map.containerPointToLatLng(bottomLeft);
        var ne = this.map.containerPointToLatLng(topRight);

        return new L.LatLngBounds(sw, ne);
    },

    remove: function() {
        this.map.off("moveend", this._onMapChange);
        this.map.off("zoomend", this._onMapChange);
        this.map.off("resize", this._onMapResize);

        this._container.parentNode.removeChild(this._container);
    },


    setDimensions: function(dimensions) {
        if (!dimensions)
            return;

        this._height = parseInt(dimensions.height) || this._height;
        this._width = parseInt(dimensions.width) || this._width;
        this._render();
        this.fire("change");
    },


    _createElements: function() {
        if (!!this._container)
            return;

        this._container = L.DomUtil.create("div", "leaflet-areaselect-container", this.map._controlContainer)
        this._topShade = L.DomUtil.create("div", "leaflet-areaselect-shade leaflet-control", this._container);
        this._bottomShade = L.DomUtil.create("div", "leaflet-areaselect-shade leaflet-control", this._container);
        this._leftShade = L.DomUtil.create("div", "leaflet-areaselect-shade leaflet-control", this._container);
        this._rightShade = L.DomUtil.create("div", "leaflet-areaselect-shade leaflet-control", this._container);

        this._nwHandle = L.DomUtil.create("div", "leaflet-areaselect-handle leaflet-control", this._container);
        this._swHandle = L.DomUtil.create("div", "leaflet-areaselect-handle leaflet-control", this._container);
        this._neHandle = L.DomUtil.create("div", "leaflet-areaselect-handle leaflet-control", this._container);
        this._seHandle = L.DomUtil.create("div", "leaflet-areaselect-handle leaflet-control", this._container);

        var self = this;
        this._downloadButton = L.DomUtil.create("div", "leaflet-areaselect-download leaflet-control", this._container);
        this._downloadButton.innerHTML = 'Download Area'
        this._downloadButton.addEventListener('click',function(){
          self.fire('download')
        })

        this._progress = L.DomUtil.create("div", "leaflet-areaselect-progress leaflet-control", this._container);

        this._setUpHandlerEvents(this._nwHandle);
        this._setUpHandlerEvents(this._neHandle, -1, 1);
        this._setUpHandlerEvents(this._swHandle, 1, -1);
        this._setUpHandlerEvents(this._seHandle, -1, -1);

        this.map.on("moveend", this._onMapChange, this);
        this.map.on("zoomend", this._onMapChange, this);
        this.map.on("resize", this._onMapResize, this);

        this.fire("change");
    },

    _setUpHandlerEvents: function(handle, xMod, yMod) {
        xMod = xMod || 1;
        yMod = yMod || 1;

        var self = this;
        function onMouseDown(event) {
            event.stopPropagation();
            self.map.dragging.disable();
            L.DomEvent.removeListener(this, "mousedown", onMouseDown);
            var curX = event.pageX;
            var curY = event.pageY;
            var ratio = self._width / self._height;
            var size = self.map.getSize();

            function onMouseMove(event) {
                if (self.options.keepAspectRatio) {
                    var maxHeight = (self._height >= self._width ? size.y : size.y * (1/ratio) ) - 30;
                    self._height += (curY - event.originalEvent.pageY) * 2 * yMod;
                    self._height = Math.max(30, self._height);
                    self._height = Math.min(maxHeight, self._height);
                    self._width = self._height * ratio;
                } else {
                    self._width += (curX - event.originalEvent.pageX) * 2 * xMod;
                    self._height += (curY - event.originalEvent.pageY) * 2 * yMod;
                    self._width = Math.max(30, self._width);
                    self._height = Math.max(30, self._height);
                    self._width = Math.min(size.x-30, self._width);
                    self._height = Math.min(size.y-30, self._height);

                }

                curX = event.originalEvent.pageX;
                curY = event.originalEvent.pageY;
                self._render();
            }
            function onMouseUp(event) {
                self.map.dragging.enable();
                L.DomEvent.removeListener(self.map, "mouseup", onMouseUp);
                L.DomEvent.removeListener(self.map, "mousemove", onMouseMove);
                L.DomEvent.addListener(handle, "mousedown", onMouseDown);
                self.fire("change");
            }

            L.DomEvent.addListener(self.map, "mousemove", onMouseMove);
            L.DomEvent.addListener(self.map, "mouseup", onMouseUp);
        }
        L.DomEvent.addListener(handle, "mousedown", onMouseDown);

         // make touch events simulate mouse events via _touchHandler
        handle.addEventListener("touchstart", this._touchHandler, true);
        handle.addEventListener("touchmove", this._touchHandler, true);
        handle.addEventListener("touchend", this._touchHandler, true);
        handle.addEventListener("touchcancel", this._touchHandler, true);
    },
    successOfflineLayerDownload:function(){
      tilesDb.nLayerDownloadSuccess++
      if(tilesDb.nLayerDownloadSuccess==2){
        this.fire('downloadEnd')
      }
    },

    _onMapResize: function() {
        this._render();
    },

    _onMapChange: function() {
        this.fire("change");
    },

    _render: function() {
        var size = this.map.getSize();
        var handleOffset = Math.round(this._nwHandle.offsetWidth/2);

        var topBottomHeight = Math.round((size.y-this._height)/2);
        var leftRightWidth = Math.round((size.x-this._width)/2);

        function setDimensions(element, dimension) {
            element.style.width = dimension.width + "px";
            element.style.height = dimension.height + "px";
            element.style.top = dimension.top + "px";
            element.style.left = dimension.left + "px";
            element.style.bottom = dimension.bottom + "px";
            element.style.right = dimension.right + "px";
        }

        setDimensions(this._topShade, {width:size.x, height:topBottomHeight, top:0, left:0});
        setDimensions(this._bottomShade, {width:size.x, height:topBottomHeight, bottom:0, left:0});
        setDimensions(this._leftShade, {
            width: leftRightWidth,
            height: size.y-(topBottomHeight*2),
            top: topBottomHeight,
            left: 0
        });
        setDimensions(this._rightShade, {
            width: leftRightWidth,
            height: size.y-(topBottomHeight*2),
            top: topBottomHeight,
            right: 0
        });

        setDimensions(this._nwHandle, {left:leftRightWidth-handleOffset, top:topBottomHeight-7});
        setDimensions(this._neHandle, {right:leftRightWidth-handleOffset, top:topBottomHeight-7});
        setDimensions(this._swHandle, {left:leftRightWidth-handleOffset, bottom:topBottomHeight-7});
        setDimensions(this._seHandle, {right:leftRightWidth-handleOffset, bottom:topBottomHeight-7});
    },

    _touchHandler : function(event) {
        // Add touch support by converting touch events to mouse events
        // Source: http://stackoverflow.com/a/6362527/725573

        var touches = event.changedTouches,
            first = touches[0],
            type = "";

        switch(event.type) {
            case "touchstart": type = "mousedown"; break;
            case "touchmove":  type = "mousemove"; break;
            case "touchend":   type = "mouseup";   break;
            default: return;
        }

        //Convert the touch event into it's corresponding mouse event
        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                  first.screenX, first.screenY,
                                  first.clientX, first.clientY, false,
                                  false, false, false, 0/*left*/, null);

        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }
});

L.areaSelect = function(options) {
    return new L.AreaSelect(options);
}
