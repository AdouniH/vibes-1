/**
 * Tool to manage layers in Vibes project
 */

import * as THREE from 'three';

var _this;

function LayerManager(view, doc, menu, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer) {
    // Constructor
    this.view = view;
    this.document = doc;
    this.menu = menu;
    this.coord = coord;
    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.scale = scale;
    this.listLayers = [];
    this.listControllers = [];
    this.nbSymbolizer = 0;
    this.guiInitialized = false;
    this.layerFolder = this.menu.gui.addFolder('Layers');
    this.layerFolder.open();
    this.loader = loader;
    this.symbolizer = symbolizer;
    this.stylizeObjectBtn = null;
    this.stylizePartsBtn = null;
    this.deleteBtn = null;
    this.bati3dBtn = null;
    this.coordCRS = coord.as('EPSG:4326');
    this.symbolizerInit = null;
    _this = this;
}

var showBDTopo = (parent) => { parent.visible = true; };
var hideBDTopo = (parent) => { parent.visible = false; };


function createBati3dBtn() {
    _this.loader.loadBati3D();
    _this.bati3dBtn = _this.menu.gui.add({ bati3D: () => {
        var bati3D_faces = _this.view.scene.getObjectByName('bati3D_faces');
        var bati3D_lines = _this.view.scene.getObjectByName('bati3D_lines');
        if (bati3D_faces != undefined && bati3D_lines != undefined) {
            _this.loader._setVisibility(_this.view, true);
            // _this.loader.checked = true;
            var model = [bati3D_faces, bati3D_lines];
            _this.handleLayer(model);
            _this.menu.gui.remove(_this.bati3dBtn);
        }
    },
    }, 'bati3D').name('Load Bati3D');
}

function manageCamera() {
    // Create a folder on the menu to manage the camera
    var camFolder = _this.menu.gui.addFolder('Camera');
    // Get initial coordinates
    var initialCamX = _this.coordCRS.longitude();
    var initialCamY = _this.coordCRS.latitude();
    let camX = initialCamX;
    let camY = initialCamY;
    // Replace the camera at its initial place
    camFolder.add({ resetCam: () => {
        _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: initialCamX, latitude: initialCamY, zoom: 15, tilt: 30, heading: 30 }, false);
    },
    }, 'resetCam').name('Reset camera');
    // Different point of view choises
    camFolder.add({ plan: ' ' }, 'plan', ['Horizon', 'Plongeante', 'Globe']).name('Vue').onChange((value) => {
        if (value === 'Horizon') {
            _this.view.controls.setTilt(100, false);
            _this.view.controls.setZoom(12, false);
        }
        else if (value === 'Plongeante') {
            _this.view.controls.setTilt(10, false);
            _this.view.controls.setZoom(17, false);
        }
        else {
            _this.view.controls.setZoom(1, false);
        }
    });
    // Change parameter 'longitude' of the camera
    camFolder.add({ moveCamX: initialCamX }, 'moveCamX').name('Longitude').onChange((value) => {
        camX = value;
        _this.view.controls.setCameraTargetGeoPosition({ longitude: camX, latitude: camY }, false);
    });
    // Change parameter 'latitude' of the camera
    camFolder.add({ moveCamY: initialCamY }, 'moveCamY').name('Latitude').onChange((value) => {
        camY = value;
        _this.view.controls.setCameraTargetGeoPosition({ longitude: camX, latitude: camY }, false);
    });
    // Change zoom scale of the camera
    camFolder.add({ zoom: 15 }, 'zoom').name('Zoom').onChange((value) => {
        _this.view.controls.setZoom(value, false);
    });
}

LayerManager.prototype.initListener = function initListener() {
    this.document.addEventListener('keypress', _this.checkKeyPress, false);
    createBati3dBtn();
    // bati3D visibility
    _this.bdTopoBtn = _this.menu.gui.add({ bdTopo: () => {
        if (_this.loader.bDTopoLoaded) {
            var b = _this.view._layers[0]._attachedLayers.filter(b => b.id == 'WFS Buildings');
            if (_this.loader.bdTopoVisibility) {
                b[0].visible = false;
                _this.loader.bdTopoVisibility = false;
            } else {
                b[0].visible = true;
                _this.loader.bdTopoVisibility = true;
                _this.menu.gui.remove(_this.bdTopoBtn);
                _this.handleBdTopo();
            }
        }
    },
    }, 'bdTopo').name('Load BDTopo');
    manageCamera();
    this.document.addEventListener('keypress', _this.checkKeyPress, false);
    this.document.addEventListener('click', _this.picking, false);
    this.document.addEventListener('drop', _this.documentDrop, false);
    var prevDefault = e => e.preventDefault();
    this.document.addEventListener('dragenter', prevDefault, false);
    this.document.addEventListener('dragover', prevDefault, false);
    this.document.addEventListener('dragleave', prevDefault, false);
};

LayerManager.prototype.documentDrop = function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    _this._readFile(file);
};

LayerManager.prototype._readFile = function readFile(file) {
    // Read the file dropped and actually load the object
    var reader = new FileReader();
    // Load .OBJ file
    if (file.name.endsWith('.obj')) {
        reader.addEventListener('load', () => {
            // Load object
            _this.loader.loadOBJ(reader.result, _this.coordCRS, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale, _this.handleLayer, _this.menu);
            _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: _this.coordCRS.longitude(), latitude: _this.coordCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
        }, false);
        reader.readAsDataURL(file);
        return 0;
    }
    // Load geolocation file
    else if (file.name.endsWith('.gibes')) {
        reader.addEventListener('load', () => {
            var json = JSON.parse(reader.result);
            _this.listLayers.forEach((layer) => {
                // Position parameters
                var coordX = json.coordX;
                var coordY = json.coordY;
                var coordZ = json.coordZ;
                _this.rotateX = json.rotateX + this.rotateX;
                _this.rotateY = json.rotateY + this.rotateY;
                _this.rotateZ = json.rotateZ + this.rotateZ;
                _this.scale = json.scale;
                // Moving object
                var vectCoord = new THREE.Vector3().set(coordX, coordY, coordZ);
                _this.coord.set('EPSG:4978', vectCoord);
                var newCRS = _this.coord.as('EPSG:4326');
                _this.loader._loadModel(layer[0], layer[1], newCRS, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale);
                _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: newCRS.longitude(), latitude: newCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
            });
        });
        reader.readAsText(file);
        return 0;
    } else if (file.name.endsWith('.vibes')) {
        reader.addEventListener('load', () => {
            _this.listLayers.forEach((/* layer */) => {
                var name;
                if (file.name.split('.')[0].split('_')[1] == 'globale') {
                    name = _this.initSymbolizer(false);
                    _this.symbolizerInit._readVibes(file, _this.menu.gui.__folders[name]);
                } else if (file.name.split('.')[0].split('_')[1] == 'partie') {
                    name = _this.initSymbolizer(true);
                    _this.symbolizerInit._readVibes(file, _this.menu.gui.__folders[name]);
                }
            });
        });
        reader.readAsText(file);
    }
    // Other format
    else {
        throw new loadFileException('Unvalid format');
    }
};

LayerManager.prototype.guiInitialize = function guiInitialize() {
    _this.stylizeObjectBtn = _this.layerFolder.add({ symbolizer: () => {
        _this.initSymbolizer(false);
    },
    }, 'symbolizer').name('Stylize object...');
    _this.stylizePartsBtn = _this.layerFolder.add({ symbolizer: () => {
        _this.initSymbolizer(true);
    },
    }, 'symbolizer').name('Stylize parts...');
    _this.deleteBtn = _this.layerFolder.add({ delete: () => {
        // Removes the controllers
        if (_this.menu.gui.__folders.Layers != undefined) {
            _this.listControllers.forEach((controller) => {
                _this.menu.gui.__folders.Layers.remove(controller);
            });
        }
        _this.listControllers = [];
        // Actually remove the model from the scene
        _this.listLayers.forEach((layer) => {
            if (layer == 'BDTopo') {
                this.loader.ForBuildings(hideBDTopo);
                _this.loader.bdTopoVisibility = false;
                _this.bdTopoBtn = _this.menu.gui.add({ bdTopo: () => {
                    if (_this.loader.bDTopoLoaded) {
                        if (_this.loader.bdTopoVisibility) {
                            _this.loader.ForBuildings(hideBDTopo);
                            _this.loader.bdTopoVisibility = false;
                        } else {
                            _this.loader.ForBuildings(showBDTopo);
                            _this.loader.bdTopoVisibility = true;
                            _this.menu.gui.remove(_this.bdTopoBtn);
                            _this.handleBdTopo();
                        }
                    }
                },
                }, 'bdTopo').name('bdTopo');
                _this.view.scene.remove(_this.view.scene.getObjectByName('quads_bdTopo'));
            }
            else if (layer[0].name === 'bati3D_faces' || layer[0].name === 'bati3D_lines') {
                createBati3dBtn();
                _this.loader._setVisibility(_this.view, false);
                _this.loader.checked = false;
                // Remove quads if they exist
                _this.view.scene.remove(_this.view.scene.getObjectByName('quads_'.concat(layer[0].name.split('_')[0])));
            }
            else {
                // Simple object
                _this.view.scene.remove(layer[0]);
                _this.view.scene.remove(layer[1]);
                    // Remove quads if they exist
                _this.view.scene.remove(_this.view.scene.getObjectByName('quads_'.concat(layer[0].name.split('_')[0])));
            }
            _this.view.notifyChange(true);
        });
        // Remove the layers from the list of layers to stylize
        _this.listLayers = [];
        // If there is no more layers, remove 'Open symbolizer' and 'Delete Layer' buttons
        _this._cleanGUI();
    },
    }, 'delete').name('Delete layer');
    // GUI initialized
    _this.guiInitialized = true;
};

LayerManager.prototype.handleLayer = function handleLayer(model) {
    // Add a checkbox to the GUI, named after the layer
    var name = model[0].name.split('_')[0];
    var controller = _this.layerFolder.add({ Layer: false, Name: name }, 'Layer').name(name.split('-').join(' ')).onChange((checked) => {
        if (checked) {
            // Add layer and controller to the list
            _this.listLayers.push(model);
            _this.listControllers.push(controller);
            // Creates buttons to start symbolizers
            if (!_this.guiInitialized) {
                _this.guiInitialize();
            }
        }
        else {
            // Remove layer controller from the list
            removeFromList(_this.listLayers, model);
            removeFromList(_this.listControllers, controller);
            // If there is no more layers, clean the GUI
            if (_this.listLayers.length == 0) {
                _this._cleanGUI();
            }
        }
    });
};

LayerManager.prototype.handleBdTopo = function handleBdTopo() {
    // Add a checkbox to the GUI, named after the layer
    var name = 'BDTopo';
    var controller = _this.layerFolder.add({ Layer: false, Name: name }, 'Layer').name('BDTopo').onChange((checked) => {
        if (checked) {
            // Add layer and controller to the list
            _this.listLayers.push('BDTopo');
            _this.listControllers.push(controller);
            // Creates buttons to start symbolizers
            if (!_this.guiInitialized) {
                _this.guiInitialize();
            }
        }
        else {
            // Remove layer controller from the list
            removeFromList(_this.listLayers, 'BDTopo');
            removeFromList(_this.listControllers, controller);
            // If there is no more layers, clean the GUI
            if (_this.listLayers.length == 0) {
                _this._cleanGUI();
            }
        }
    });
};

LayerManager.prototype.initSymbolizer = function initSymbolizer(complex) {
    var i;
    var deleteSymbolizerBtn;
    // _this._cleanGUI();
    // Checks if a layer is selected (if not, nothing happens)
    if (_this.listLayers.length != 0) {
        // Merge elements of the list as one group
        var listObj = [];
        var listEdge = [];
        var bdTopo = null;
        var light = null;
        var plane = null;
        _this.listLayers.forEach((layer) => {
            if (layer != 'BDTopo' && layer.length >= 2) {
                listObj.push(layer[0]);
                listEdge.push(layer[1]);
                if (layer.length >= 4) {
                    light = layer[2];
                    plane = layer[3];
                }
            } else if (layer == 'BDTopo') {
                bdTopo = _this.loader;
            }
        });
        // Call Symbolizer
        _this.nbSymbolizer++;
        var symbolizer = _this.symbolizer(_this.view, listObj, listEdge, bdTopo, _this.menu, _this.nbSymbolizer, light, plane);
        _this.symbolizerInit = symbolizer;
        // Open symbolizer with 'stylize parts'
        if (complex) {
            symbolizer.initGui();
            // Create controller to close the symbolizer
            deleteSymbolizerBtn = _this.menu.gui.add({ deleteSymbolizer: () => {
                // Delete symbolizer folder
                _this.menu.gui.__ul.removeChild(symbolizer.folder.domElement.parentNode);
                delete symbolizer.folder;
                // Put each layer controller back
                for (i = 0; i < symbolizer.obj.length; i++) {
                    _this.handleLayer([symbolizer.obj[i], symbolizer.edges[i]]);
                }
                if (symbolizer.bdTopo) {
                    _this.handleBdTopo();
                }
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symb. '.concat(_this.nbSymbolizer));
        }
        // Open symbolizer with 'stylize object'
        else {
            symbolizer.initGuiAll();
            // Create controller to close the symbolizer
            deleteSymbolizerBtn = _this.menu.gui.add({ deleteSymbolizer: () => {
                // Delete symbolizer folder
                _this.menu.gui.__ul.removeChild(symbolizer.folder.domElement.parentNode);
                delete symbolizer.folder;
                // Put each layer controller back
                for (i = 0; i < symbolizer.obj.length; i++) {
                    _this.handleLayer([symbolizer.obj[i], symbolizer.edges[i]]);
                }
                if (symbolizer.bdTopo) {
                    _this.handleBdTopo();
                }
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symb. '.concat(_this.nbSymbolizer));
        }
        // Remove the layers from the list on the GUI
        _this.listControllers.forEach((controller) => {
            _this.menu.gui.__folders.Layers.remove(controller);
        });
        // Empty layer and controllers list;
        _this.listLayers = [];
        _this.listControllers = [];
    }
    return 'Symbolizer '.concat(_this.nbSymbolizer);
};

LayerManager.prototype._cleanGUI = function cleanGUI() {
    // Remove the layer management buttons
    _this.menu.gui.__folders.Layers.remove(_this.stylizeObjectBtn);
    _this.menu.gui.__folders.Layers.remove(_this.stylizePartsBtn);
    _this.menu.gui.__folders.Layers.remove(_this.deleteBtn);
    _this.guiInitialized = false;
};

function removeFromList(list, elmt) {
    var i = list.indexOf(elmt);
    if (i != -1) {
        list.splice(i, 1);
    }
}

function loadFileException(message) {
    this.message = message;
    this.name = 'loadFileException';
}

LayerManager.prototype.checkKeyPress = function checkKeyPress(key) {
    // moving the object after clicked on it using the keys (4,6,2,8,7,3 or a,z,q,s,w,x)
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        if ((key.key == 'a') || (key.key == '4')) {
            _this._xmoins(-10);
        }
        if ((key.key == 'z') || (key.key == '6')) {
            _this._xplus(10);
        }
        if ((key.key == 'w') || (key.key == '7')) {
            _this._yplus(10);
        }
        if ((key.key == 'x') || (key.key == '3')) {
            _this._ymoins(-10);
        }
        if ((key.key == 'q') || (key.key == '8')) {
            _this._zmoins(-10);
        }
        if ((key.key == 's') || (key.key == '2')) {
            _this._zplus(10);
        }
    }
};

LayerManager.prototype._xplus = function xplus(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateX(a);
        edges.translateX(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
};

LayerManager.prototype._xmoins = function _xmoins(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateX(a);
        edges.translateX(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._yplus = function yplus(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateY(a);
        edges.translateY(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._ymoins = function _ymoins(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateY(a);
        edges.translateY(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._zplus = function zplus(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateZ(a);
        edges.translateZ(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._zmoins = function _zmoins(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2) {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateZ(a);
        edges.translateZ(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};
LayerManager.prototype.picking = function picking(event) {
    // Pick an object with batch id
    var mouse = _this.view.eventToNormalizedCoords(event);
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, _this.view.camera.camera3D);
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(_this.view.scene.children, true);
    if (intersects.length > 0) {
        var source = getParent(intersects[0].object);
        if (source.name != 'globe' && source.name != '') {
            _this.layerFolder.__controllers.forEach((element) => {
                if (element.__checkbox && element.object.Name == source.name.split('_')[0]) element.setValue(!element.__prev);
                return element;
            });
        }
    }
};

function getParent(obj) {
    if (obj.parent.parent != null) return getParent(obj.parent);
    return obj;
}

export default LayerManager;
