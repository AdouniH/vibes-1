/**
 * Tool to apply 3D stylization on a mesh
 */

import * as THREE from 'three';
import * as FILE from 'file-saver';

// Class Symbolizer

function Symbolizer(view, obj, edges, menu) {
    // Constructor
    this.obj = obj;
    this.edges = edges;
    this.view = view;
    this.menu = menu;
    this.menu.view = this.view;
    this.applyStyle();
}

Symbolizer.prototype.readVIBES = function readVIBES() {
    var materials = [];
    return materials;
};

Symbolizer.prototype.applyStyle = function applyStyle(style = null) {
    var i;
    if (style && style.styles) {
        // Apply given style to each child
        for (i = 0; i < this.obj.children.length; i++) {
            var name = this.obj.children[i].name;
            var j = 0;
            while (j < style.styles.length && style.styles[j].name != name) {
                j++;
            }
            this._changeOpacity(style.styles[j].opacity, i);
            this._changeColor(style.styles[j].color, i);
            this._changeEmissive(style.styles[j].emissive, i);
            this._changeSpecular(style.styles[j].specular, i);
            this._changeShininess(style.styles[j].shininess, i);
        }
    }
    else if (style && style.style) {
        // Apply given style to all children
        for (i = 0; i < this.obj.children.length; i++) {
            this._changeOpacity(style.style.opacity, i);
            this._changeColor(style.style.color, i);
            this._changeEmissive(style.style.emissive, i);
            this._changeSpecular(style.style.specular, i);
            this._changeShininess(style.style.shininess, i);
        }
    }
    else {
        // Apply default style
        for (i = 0; i < this.obj.children.length; i++) {
            var color = getRandomColor();
            this._changeOpacity(1, i);
            this._changeColor(color, i);
            this._changeEmissive(color, i);
            this._changeSpecular(color, i);
            this._changeShininess(30, i);
        }
    }
};

// Callback functions (concrete stylization)

Symbolizer.prototype._changeOpacity = function changeOpacity(value, index) {
    this.obj.children[index].material.opacity = value;
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColor = function changeColor(value, index) {
    this.obj.children[index].material.color = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeEmissive = function changeEmissive(value, index) {
    this.obj.children[index].material.emissive = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeSpecular = function changeSpecular(value, index) {
    this.obj.children[index].material.specular = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeShininess = function changeShininess(value, index) {
    this.obj.children[index].material.shininess = value;
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

// More parameters...

Symbolizer.prototype._saveVibes = function saveVibes() {
    var vibes = { styles: [] };
    for (var i = 0; i < this.obj.children.length; i++) {
        vibes.styles.push({
            name: this.obj.children[i].name,
            opacity: this.obj.children[i].material.opacity,
            color: '#'.concat(this.obj.children[i].material.color.getHexString()),
            emissive: '#'.concat(this.obj.children[i].material.emissive.getHexString()),
            specular: '#'.concat(this.obj.children[i].material.specular.getHexString()),
            shininess: this.obj.children[i].material.shininess,
        });
    }
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    FILE.saveAs(blob, this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4).concat('.vibes'));
};

// Menu management

Symbolizer.prototype._addOpacity = function addOpacity(folder, index) {
    var initialOpacity = this.obj.children[index].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('opacity').onChange(value => this._changeOpacity(value, index));
};

Symbolizer.prototype._addColor = function addColor(folder, index) {
    var initialColor = '#'.concat(this.obj.children[index].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('color').onChange(value => this._changeColor(value, index));
};

Symbolizer.prototype._addEmissive = function addEmissive(folder, index) {
    var initialEmissive = '#'.concat(this.obj.children[index].material.emissive.getHexString());
    folder.addColor({ emissive: initialEmissive }, 'emissive').name('emissive').onChange(value => this._changeEmissive(value, index));
};


Symbolizer.prototype._addSpecular = function addSpecular(folder, index) {
    var initialSpecular = '#'.concat(this.obj.children[index].material.specular.getHexString());
    folder.addColor({ specular: initialSpecular }, 'specular').name('specular').onChange(value => this._changeSpecular(value, index));
};

Symbolizer.prototype._addShininess = function addShininess(folder, index) {
    var initialShininess = this.obj.children[index].material.shininess;
    folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('shininess').onChange(value => this._changeShininess(value, index));
};

// More parameters...

Symbolizer.prototype._addSave = function addSave(folder) {
    folder.add({ save: () => this._saveVibes() }, 'save');
};

Symbolizer.prototype.initGui = function addToGUI() {
    var parentFolder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    this._addSave(parentFolder);
    for (var i = 0; i < this.obj.children.length; i++) {
        var folder = parentFolder.addFolder(this.obj.children[i].name);
        this._addOpacity(folder, i);
        this._addColor(folder, i);
        this._addEmissive(folder, i);
        this._addSpecular(folder, i);
        this._addShininess(folder, i);
    }
};

Symbolizer.prototype._addOpacityAll = function addOpacityAll(folder) {
    var initialOpacity = this.obj.children[0].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('opacity').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeOpacity(value, index);
        }
    });
};

Symbolizer.prototype._addColorAll = function addColorAll(folder) {
    var initialColor = '#'.concat(this.obj.children[0].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('color').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeColor(value, index);
        }
    });
};

Symbolizer.prototype._addEmissiveAll = function addEmissiveAll(folder) {
    var initialEmissive = '#'.concat(this.obj.children[0].material.emissive.getHexString());
    folder.addColor({ emissive: initialEmissive }, 'emissive').name('emissive').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeEmissive(value, index);
        }
    });
};


Symbolizer.prototype._addSpecularAll = function addSpecularAll(folder) {
    var initialSpecular = '#'.concat(this.obj.children[0].material.specular.getHexString());
    folder.addColor({ specular: initialSpecular }, 'specular').name('specular').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeSpecular(value, index);
        }
    });
};

Symbolizer.prototype._addShininessAll = function addShininessAll(folder) {
    var initialShininess = this.obj.children[0].material.shininess;
    folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('shininess').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeShininess(value, index);
        }
    });
};

Symbolizer.prototype.initGuiAll = function addToGUI() {
    var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    this._addSave(folder);
    this._addOpacityAll(folder);
    this._addColorAll(folder);
    this._addEmissiveAll(folder);
    this._addSpecularAll(folder);
    this._addShininessAll(folder);
};

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export default Symbolizer;
