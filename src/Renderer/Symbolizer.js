/**
 * Tool to apply 3D stylization on a mesh
 */

import * as THREE from 'three';
import * as FILE from 'file-saver';
import Fetcher from '../Core/Scheduler/Providers/Fetcher';

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

Symbolizer.prototype.applyStyle = function applyStyle(style = null) {
    var i;
    var j;
    if (style && style.faces.length > 1) {
        // Apply given style to each child
        for (i = 0; i < this.edges.children.length; i++) {
            this._changeOpacityEdge(style.edges.opacity, i);
            this._changeColorEdge(style.edges.color, i);
            this._changeWidthEdge(style.edges.width, i);
        }
        for (j = 0; j < this.obj.children.length; j++) {
            var name = this.obj.children[j].name;
            var h = 0;
            while (h < style.faces.length && style.faces[h].name != name) {
                h++;
            }
            this._changeOpacity(style.faces[h].opacity, j);
            this._changeColor(style.faces[h].color, j);
            this._changeEmissive(style.faces[h].emissive, j);
            this._changeSpecular(style.faces[h].specular, j);
            this._changeShininess(style.faces[h].shininess, j);
            if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, j);
        }
    }
    else if (style && style.faces.length == 1) {
        // Apply given style to all children
        for (i = 0; i < this.edges.children.length; i++) {
            this._changeOpacityEdge(style.edges.opacity, i);
            this._changeColorEdge(style.edges.color, i);
            this._changeWidthEdge(style.edges.width, i);
        }
        for (j = 0; j < this.obj.children.length; j++) {
            this._changeOpacity(style.faces.opacity, j);
            this._changeColor(style.faces.color, j);
            this._changeEmissive(style.faces.emissive, j);
            this._changeSpecular(style.faces.specular, j);
            this._changeShininess(style.faces.shininess, j);
            if (style.faces.texture != null) this._changeTexture(style.faces.texture, j);
        }
    }
    else {
        // Apply default style
        for (i = 0; i < this.edges.children.length; i++) {
            this._changeOpacityEdge(1, i);
            this._changeColorEdge('#000000', i);
            this._changeWidthEdge(1, i);
        }
        for (j = 0; j < this.obj.children.length; j++) {
            var color = getRandomColor();
            this._changeOpacity(1, j);
            this._changeColor(color, j);
            this._changeEmissive(color, j);
            this._changeSpecular(color, j);
            this._changeShininess(30, j);
            // No texture
        }
    }
};

// Callback functions (concrete stylization)

Symbolizer.prototype._changeOpacity = function changeOpacity(value, index) {
    this.obj.children[index].material.opacity = value;
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeOpacityEdge = function changeOpacityEdge(value, index) {
    this.edges.children[index].material.opacity = value;
    this.edges.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColor = function changeColor(value, index) {
    this.obj.children[index].material.color = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColorEdge = function changeColorEdge(value, index) {
    this.edges.children[index].material.color = new THREE.Color(value);
    this.edges.children[index].material.needsUpdate = true;
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

Symbolizer.prototype._changeTexture = function changeTexture(chemin, index) {
    if (chemin != './textures/') {
        var texture = new THREE.TextureLoader().load(chemin);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        var meshshininess = this.obj.children[index].material.shininess;
        var meshspecular = this.obj.children[index].material.specular;
        var meshemissive = this.obj.children[index].material.emissive;
        var meshcolor = this.obj.children[index].material.color;
        var meshopacity = this.obj.children[index].material.opacity;
        this.obj.children[index].material = new THREE.MeshPhongMaterial({ map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
        this.obj.children[index].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else {
        this.obj.children[index].material.map = null;
        this.obj.children[index].material.needsUpdate = true;
        this.view.notifyChange(true);
    }
};

Symbolizer.prototype._changeWidthEdge = function changeWidthEdge(value, index) {
    this.edges.children[index].material.linewidth = value;
    this.edges.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._saveVibes = function saveVibes() {
    // Initiate stylesheet with edge style and an empty list for face style
    var vibes = {
        edges: {
            opacity: this.edges.children[0].material.opacity,
            color: this.edges.children[0].material.color,
            width: this.edges.children[0].material.width,
            // texture: this.edges.children[0].material.map.path,
        },
        faces: [] };
    for (var i = 0; i < this.obj.children.length; i++) {
        // Get the texture path
        var textureUse = null;
        if (this.obj.children[i].material.map != null) {
            var textureUsetab = this.obj.children[i].material.map.image.src.split('/');
            var j = 0;
            while (j < textureUsetab.length && textureUsetab[j] != 'textures') j++;
            textureUse = '.';
            while (j < textureUsetab.length) {
                textureUse = textureUse.concat('/', textureUsetab[j]);
                j++;
            }
        }
        // Push each face style in the list
        vibes.faces.push({
            name: this.obj.children[i].name,
            opacity: this.obj.children[i].material.opacity,
            color: this.obj.children[i].material.color.getHex(),
            emissive: this.obj.children[i].material.emissive.getHex(),
            specular: this.obj.children[i].material.specular.getHex(),
            shininess: this.obj.children[i].material.shininess,
            texture: textureUse,
        });
    }
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    FILE.saveAs(blob, this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4).concat('.vibes'));
};

Symbolizer.prototype._readVibes = function readVibes(file) {
    var reader = new FileReader();
    reader.addEventListener('load', () => this.applyStyle(JSON.parse(reader.result)), false);
    reader.readAsText(file);
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

Symbolizer.prototype._addTexture = function addTexture(folder, index) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange(value => this._changeTexture('./textures/'.concat(value), index));
        }
    });
};

// More parameters...

Symbolizer.prototype._addSave = function addSave(folder) {
    folder.add({ save: () => this._saveVibes() }, 'save');
};

Symbolizer.prototype._addLoad = function addLoad(folder) {
    folder.add({ load: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => this._readVibes(button.files[0]), false);
        button.click();
    } }, 'load');
};

Symbolizer.prototype.initGui = function addToGUI() {
    var parentFolder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    this._addSave(parentFolder);
    this._addLoad(parentFolder);
    this._addColorEdgeAll(parentFolder);
    this._addOpacityEdgeAll(parentFolder);
    this._addWidthEdgeAll(parentFolder);
    for (var i = 0; i < this.obj.children.length; i++) {
        var folder = parentFolder.addFolder(this.obj.children[i].name);
        this._addOpacity(folder, i);
        this._addColor(folder, i);
        this._addEmissive(folder, i);
        this._addSpecular(folder, i);
        this._addShininess(folder, i);
        this._addTexture(folder, i);
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

Symbolizer.prototype._addOpacityEdgeAll = function addOpacityEdgeAll(folder) {
    var initialOpacity = this.edges.children[0].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Edges opacity').onChange((value) => {
        for (var index = 0; index < this.edges.children.length; index++) {
            this._changeOpacityEdge(value, index);
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

Symbolizer.prototype._addColorEdgeAll = function addColorEdgeAll(folder) {
    var initialColor = '#'.concat(this.edges.children[0].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('Edges color').onChange((value) => {
        for (var index = 0; index < this.edges.children.length; index++) {
            this._changeColorEdge(value, index);
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

Symbolizer.prototype._addWidthEdgeAll = function addWidthEdgeAll(folder) {
    var initialWidth = this.edges.children[0].material.linewidth;
    folder.add({ width: initialWidth }, 'width', 0, 5).name('Edge width').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeWidthEdge(value, index);
        }
    });
};

Symbolizer.prototype._addTextureAll = function addTextureAll(folder) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (var index = 0; index < this.obj.children.length; index++) {
                    this._changeTexture('./textures/'.concat(value), index);
                }
            });
        }
    });
};

Symbolizer.prototype.initGuiAll = function addToGUI() {
    var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    this._addSave(folder);
    this._addLoad(folder);
    this._addTextureAll(folder);
    this._addOpacityAll(folder);
    this._addColorAll(folder);
    this._addEmissiveAll(folder);
    this._addSpecularAll(folder);
    this._addShininessAll(folder);
    this._addColorEdgeAll(folder);
    this._addOpacityEdgeAll(folder);
    this._addWidthEdgeAll(folder);
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
