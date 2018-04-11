/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.396387, latitude: 48.848701, altitude: 2000 };
// var positionOnGlobe = { longitude: 4.818, latitude: 45.7354, altitude: 3000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// GUI initialization
var menuGlobe = new GuiTools('menuDiv');

var promiseElevation = [];

menuGlobe.view = globeView;

function addLayerCb(layer) {
    return globeView.addLayer(layer).then(function addGui(la) {
        if (la.type === 'color') {
            menuGlobe.addImageryLayerGUI(la);
        } else if (la.type === 'elevation') {
            menuGlobe.addElevationLayerGUI(la);
        }
    });
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
// itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);
itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(result => addLayerCb(result));

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(result => addLayerCb(result)));
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(result => addLayerCb(result)));

// Geolocation default parameters
var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 50);
var rotateX = 0;
var rotateY = 0;
var rotateZ = 0;
var scale = 1;


function saveDataInit() {
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    return function saveData(data, fileName) {
        var json = JSON.stringify(data);
        var blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
};

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Symbolizer
var symbolizer = function(view, listObj, listEdge, bdTopo, menu, nbSymbolizer, light, plane) {
    // console.log(saveDataInit);
    return new itowns.Symbolizer(view, listObj, listEdge, bdTopo, menu, nbSymbolizer, light, plane, saveDataInit);
}

// Layer management
var manager = new itowns.LayerManager(globeView, document, menuGlobe, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer)
window.onload = () => manager.initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 30, tilt: 30 });
    globeView.controls.setZoom(13, true);
    var result = document.getElementById('result')
    document.getElementById('viewerDiv').addEventListener('mousemove', function() { 
        result.innerHTML = "Longitude : " + globeView.controls.getCameraTargetGeoPosition().longitude() + "<br> Latitude : " + globeView.controls.getCameraTargetGeoPosition().latitude(); 
        result.innerHTML += "<br> To move object click on it or select it from GUI and use:<br> keys a and z or 4 and 6 to move it from West-East <br> keys q and s or 8 and 2 to move it from North-South <br> keys w and x or 7 and 3 to move it from Top-Down ";
    })
    result.innerHTML += "<br> To move object click on it or select it from GUI <br> use keys a and z or 4 and 6 to move it from West-East <br> use keys q and s or 8 and 2 to move it from North-South <br> use keys w and x or 7 and 3 to move it from Top-Down ";
    // globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
    loader.loadBDTopo();
});
//var loader2 = new itowns.ModelLoader(globeView);
 // loader.loadBati3D();
