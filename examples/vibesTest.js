/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.396387, latitude: 48.848701, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// GUI initialization
var menuGlobe = new GuiTools('menuDiv');
var guiInitialized = false;
var layerFolder = menuGlobe.gui.addFolder('Layers');
var listLayers = [];
var listControllers = [];
var nbSymbolizer = 0;

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
itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

// Object parameters, 48.848340,

var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 50);
var rotateX = Math.PI/2;
var rotateY = 0;
var rotateZ = 0;
var scale = 300;

// Symbolizer
var initSymbolizer = function initSymbolizer(listLayers, listControllers, menuGlobe, complex) {
    // Merge elements of the list as one group
    var listObj = [];
    var listEdge = [];
    var obj;
    var edge;
    listLayers.forEach((layer) => {
        listObj.push(layer[0]);
        listEdge.push(layer[1]);
    })
    // Call Symbolizer
    nbSymbolizer++;
    var symbolizer = new itowns.Symbolizer(globeView, listObj, listEdge, menuGlobe, nbSymbolizer);
    if (complex) {
        symbolizer.initGui();
    }
    else {
        symbolizer.initGuiAll();
    }
    //Remove the layers from the list
    listControllers.forEach((controller) => {
        menuGlobe.gui.__folders.Layers.remove(controller);
    })    
}

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Read the file dropped and actually load the object
function readFile(file) {
    var reader = new FileReader();
    if(file.name.endsWith('.obj')){
        reader.addEventListener('load', () => {
            // Load object
            loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale, handleLayer, menuGlobe);
        }, false);
        reader.readAsDataURL(file);
        return 0 ;
    }
        /*
    else if(file.name.endsWith('.gibes')){
        reader.addEventListener('load', () => {
            var json = JSON.parse(reader.result);
            var layer = json.name;

        })
        reader.readAsText(file);
    }
    */
    else{
        throw new loadFileException("fichier de type .obj attendu");
    }
}

// Layer management
function handleLayer(model, menuGlobe) {
    // Add a checkbox to the GUI, named after the layer
    if(!guiInitialized){
        layerFolder.add({ symbolizer: () => initSymbolizer(listLayers, listControllers, menuGlobe, false) }, 'symbolizer').name('Stylize object...');
        layerFolder.add({ symbolizer: () => initSymbolizer(listLayers, listControllers, menuGlobe, true) }, 'symbolizer').name('Stylize parts...');
    }
    var controller = layerFolder.add({ Layer: false }, 'Layer').name(model[0].materialLibraries[0].substring(0, model[0].materialLibraries[0].length - 4)).onChange((checked) => {
        if(checked){
            // Add layer and controller to the list
            listLayers.push(model);
            listControllers.push(controller);
        }
        else{
            // Remove layer and controller from the list
            var i = listLayers.indexOf(model);
            if(i != -1) {
                listLayers.splice(i, 1);
            } 
            var j = listControllers.indexOf(controller);
            if(j != -1) {
                listControllers.splice(j, 1);
            } 
        }
    }); 
    guiInitialized = true;
}

// Drag and drop
function initListener() {
    document.addEventListener('drop', documentDrop, false);
        let prevDefault = e => e.preventDefault();
        document.addEventListener('dragenter', prevDefault, false);
        document.addEventListener('dragover', prevDefault, false);
        document.addEventListener('dragleave', prevDefault, false);
  }

function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    readFile(file);
  }

window.onload = () => initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

function loadFileException(message) {
    this.message = message;
    this.name = "loadFileException";
 }
