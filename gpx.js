var gpx = {
  getXML:function(info){
    var xml = [this.getHead(info)]
    xml.push(...this.getTracks(info))
    xml.push('</gpx>')
    return(xml.join(''))
  },
  getHead:function(info){
    var head = `<?xml version="1.0"?>
      <gpx
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns="http://www.topografix.com/GPX/1/1"
      xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
      version="1.1"
      creator="https://skiturer-norge.github.io"
      >
    <metadata>
      <name>`+info.title+`</name>
      <desc>`+info.description+`</desc>
      <time>`+new Date().toISOString()+`</time>
    </metadata>`;
    return(head);
  },
  getTracks:function(info){
    var tracks = info.tracks.map(function(i){ return(`<trk>
        <name>Option `+i.optionNo+`</name>
        <cmt>`+i.type+`</cmt>
        <trkseg>`+gpx.getTrackPoints(i.pts)+`</trkseg>
      </trk>`)
    })
    return(tracks)
  },
  getTrackPoints : function(pts){
    var pts = pts.map(function(i){
      return('<trkpt lat="'+i.lat.toString()+'" lon="'+i.lng.toString()+'" ></trkpt>')
    })
    return(pts.join(''))
  }
};
