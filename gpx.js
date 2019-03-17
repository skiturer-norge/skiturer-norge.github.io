var gpx = {
  parse : function(s){
    var domParser = new DOMParser();
    var parsed = { 'tracks': [] };
    var $doc = $(s)
    $doc.find('metadata').children().each(function(i,e){
      parsed[e.nodeName.toLowerCase()] = e.textContent
    })
    $doc.find('trk').each(function(i,e){
      let track = {'pts':[]};
      for(j in e.children){
        e2 = e.children[j]
        if(e2.nodeName=='NAME'){
          track['name'] = e2.textContent
        }else if(e2.nodeName=='CMT'){
          track['type'] = e2.textContent
        }if(e2.nodeName=='TRKSEG'){
          for(j2 in e2.children){
            if(typeof e2.children[j2] != 'object'){continue}
            track.pts.push([
              e2.children[j2].getAttribute('lat'),
              e2.children[j2].getAttribute('lon')
            ]);
              // track.pts.push({
              //   'lat': e2.children[j2].getAttribute('lat'),
              //   'lon': e2.children[j2].getAttribute('lon')
              // });
          }
          track['pts'] ;
        }
      }
      parsed.tracks.push(track)
    })
    return(parsed)
  },
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
      <name>`+info.name+`</name>
      <desc>`+info.desc+`</desc>
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
