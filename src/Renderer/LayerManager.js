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
    this.loader = loader;
    this.symbolizer = symbolizer;

    this.stylizeObjectBtn = null;
    this.stylizePartsBtn = null;
    this.deleteBtn = null;

    _this = this;
}

LayerManager.prototype.initListener = function initListener() {
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
            _this.loader.loadOBJ(reader.result, _this.coord, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale, _this.handleLayer, _this.menu);
            _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: _this.coord.longitude(), latitude: _this.coord.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
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
                var crs = _this.coord.crs;
                var vectCoord = new THREE.Vector3().set(coordX, coordY, coordZ);
                _this.coord.set('EPSG:4978', vectCoord);
                var coordCRS = _this.coord.as(crs);
                _this.loader._loadModel(layer[0], layer[1], coordCRS, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale);
                _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: coordCRS.longitude(), latitude: coordCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
            });
        });
        reader.readAsText(file);
        return 0;
    }
    // Other format
    else {
        throw new loadFileException('Unvalid format');
    }
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
                        _this.view.scene.remove(layer[0]);
                        _this.view.scene.remove(layer[1]);
                    });
                    _this.view.notifyChange(true);
                    // Remove the layers from the list of layers to stylize
                    _this.listLayers = [];
                    // If there is no more layers, remove 'Open symbolizer' and 'Delete Layer' buttons
                    _this._cleanGUI();
                },
                }, 'delete').name('Delete layer');
            }
            // GUI initialized
            _this.guiInitialized = true;
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
    _this.layerFolder.add({ resetCam: () => {
        var coordCRS = _this.coord.as('EPSG:4326');
        _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: coordCRS.longitude(), latitude: coordCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
    },
    }, 'resetCam').name('Reset camera');
};

LayerManager.prototype.initSymbolizer = function initSymbolizer(complex) {
    var i;
    var deleteSymbolizerBtn;
    _this._cleanGUI();
    // Checks if a layer is selected (if not, nothing happens)
    if (_this.listLayers.length != 0) {
        // Merge elements of the list as one group
        var listObj = [];
        var listEdge = [];
        _this.listLayers.forEach((layer) => {
            listObj.push(layer[0]);
            listEdge.push(layer[1]);
        });
        // Call Symbolizer
        _this.nbSymbolizer++;
        var symbolizer = _this.symbolizer(_this.view, listObj, listEdge, _this.menu, _this.nbSymbolizer, _this.listLayers[0][2], _this.listLayers[0][3]);
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
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symbolizer '.concat(_this.nbSymbolizer));
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
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symbolizer '.concat(_this.nbSymbolizer));
        }
        // Remove the layers from the list on the GUI
        _this.listControllers.forEach((controller) => {
            _this.menu.gui.__folders.Layers.remove(controller);
        });
        // Empty layer and controllers list;
        _this.listLayers = [];
        _this.listControllers = [];
    }
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
    if (_this.listLayers.length == 1) {
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
