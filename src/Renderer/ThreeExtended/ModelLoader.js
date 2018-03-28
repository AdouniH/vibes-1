/**
 * A loader for 3D model of diverse formats
 */

import * as THREE from 'three';
import * as OBJLoader from 'three-obj-loader';

OBJLoader(THREE);

function ModelLoader(view) {
    // Constructor
    this.view = view;
    this.model = null;
}

ModelLoader.prototype.loadOBJ = function loadOBJ(url, coord, rotateX, rotateY, rotateZ, scale, callback, menu) {
    // OBJ loader
    var loader = new THREE.OBJLoader();
    var promise = new Promise((resolve) => {
        loader.load(url, (obj) => {
            this._loadModel(obj, coord, rotateX, rotateY, rotateZ, scale);
            resolve();
        });
    });
    promise.then(() => callback(this.model, menu));
};

ModelLoader.prototype._loadModel = function loadModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    var objID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    obj = this._placeModel(obj, coord, rotateX, rotateY, rotateZ, scale);

    // Set camera layer not to disturb the picking
    obj.traverse(obj => obj.layers.set(objID));
    this.view.camera.camera3D.layers.enable(objID);
    var lines = new THREE.Group();

    obj.castShadow = true;

    for (var i = 0; i < obj.children.length; i++) {
        // Material initialization
        var material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        obj.children[i].material = material;
        obj.children[i].material.transparent = true;
        obj.children[i].castShadow = true;
        obj.children[i].material.side = THREE.DoubleSide;

        // Extract edges
        var edges = new THREE.EdgesGeometry(obj.children[i].geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        line = this._placeModel(line, coord, rotateX, rotateY, rotateZ, scale);
        line.updateMatrixWorld();
        lines.add(line);
    }

    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a PointLight and turn on shadows for the light
    var plight = new THREE.PointLight(0xffffff, 1, 0, 1);
    var coordLight = coord.clone();
    coordLight.setAltitude(coordLight.altitude() + 350);
    plight.position.copy(coordLight.as(this.view.referenceCrs).xyz());
    plight.position.y += 70;
    plight.updateMatrixWorld();
    plight.castShadow = true;            // default false
  
    // Set up shadow properties for the light
    plight.shadow.mapSize.width = 512;  // default
    plight.shadow.mapSize.height = 512; // default
    plight.shadow.camera.near = 0.5;       // default
    plight.shadow.camera.far = 5000;      // default

    this.view.scene.add(plight);

    // Create a plane that receives shadows (but does not cast them)
    var planeID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    var planeGeometry = new THREE.PlaneBufferGeometry(10, 10, 32, 32);
    var planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    // var planeMaterial = new THREE.ShadowMaterial();
    // planeMaterial.opacity = 0.2;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane = this._placeModel(plane, coord, 0, 0, 0, scale);
    plane.position.y += 200;
    plane.receiveShadow = true;

    plane.traverse((obj) => { obj.layers.set(planeID); });
    this.view.camera.camera3D.layers.enable(planeID);

    plane.updateMatrixWorld();
    this.view.scene.add(plane);

    // Update coordinate of the object
    obj.updateMatrixWorld();
    this.view.scene.add(obj);
    this.view.scene.add(lines);
    this.view.notifyChange(true);
    this.model = [obj, lines];
};

ModelLoader.prototype._placeModel = function placeModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    // Set object position
    obj.position.copy(coord.as(this.view.referenceCrs).xyz());
    // Aligns up vector with geodesic normal
    obj.lookAt(obj.position.clone().add(coord.geodesicNormal));
    // User rotates building to align with ortho image
    obj.rotateX(rotateX);
    obj.rotateY(rotateY);
    obj.rotateZ(rotateZ);
    obj.scale.set(scale, scale, scale);
    return obj;
};

export default ModelLoader;
