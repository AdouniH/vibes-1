/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.294485, latitude: 48.85828, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

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
itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

exports.view = globeView;
exports.initialPosition = positionOnGlobe;

exports.loadOBJ = function loadOBJ(url) {

    // obj loader
    var loader = new itowns.THREE.OBJLoader();

    loader.load(
        url,
        //callback
        function (mesh) {

            // building coordinate
            var coord = new itowns.Coordinates('EPSG:4326', 2.294485, 48.85828, 35);

            var objID = globeView.mainLoop.gfxEngine.getUniqueThreejsLayer();

            mesh.position.copy(coord.as(globeView.referenceCrs).xyz());
            // align up vector with geodesic normal
            mesh.lookAt(mesh.position.clone().add(coord.geodesicNormal));
            // user rotate building to align with ortho image
            //mesh.rotateZ(-Math.PI * 0.2);
            mesh.rotateX(Math.PI/2);
            mesh.rotateY(Math.PI/4);
            mesh.scale.set(300, 300, 300);

            // set camera's layer to do not disturb the picking
            mesh.traverse(function _(obj) { obj.layers.set(objID); });
            globeView.camera.camera3D.layers.enable(objID);

            
            for (var i = 0; i < mesh.children.length; i++) {
                let material = new THREE.MeshPhongMaterial( { color: getRandomColor()} );
                mesh.children[i].material = material;
                mesh.children[i].material.transparent = true;
                mesh.children[i].castShadow = true;

                var edges = new THREE.EdgesGeometry(mesh.children[i].geometry);
                var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
                line.position.copy(coord.as(globeView.referenceCrs).xyz());
                // align up vector with geodesic normal
                line.lookAt(mesh.position.clone().add(coord.geodesicNormal));
                // user rotate building to align with ortho image
                //mesh.rotateZ(-Math.PI * 0.2);
                line.rotateX(Math.PI/2);
                line.rotateY(Math.PI/2);
                line.scale.set(120, 120, 120);
                line.updateMatrixWorld();

                globeView.scene.add(line);
                globeView.notifyChange(true);
            }

            // update coordinate of the mesh
            mesh.updateMatrixWorld();
            console.log(mesh);    
            
            globeView.scene.add(mesh);
            globeView.notifyChange(true);

            // addToGUI(mesh);

            var symbolizer = new itowns.Symbolizer(globeView, mesh, menuGlobe);
            symbolizer.initGuiAll();
            console.log(symbolizer.sayHello());
            
        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );
            console.log(error);

        });

}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

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
    //console.log(file);
    readFile(file);
  }


function readFile(file) {
    let reader = new FileReader();
    reader.addEventListener('load', () => {
        //console.log(reader.result);
        exports.loadOBJ(reader.result);
    }, false);

    reader.readAsDataURL(file);
  }


window.onload = () => initListener();


// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});


function rotato(mesh) {
    mesh.rotateZ(Math.PI/10000);
    mesh.updateMatrixWorld();
    mesh.needsUpdate = true;
    setInterval(rotato(mesh), 1000);
}