/* eslint no-eval: 0 */
/**
 * Tool to apply 3D stylization on a mesh
 */

import * as THREE from 'three';
import * as FILE from 'file-saver';
import Fetcher from '../Core/Scheduler/Providers/Fetcher';

// Class Symbolizer

function Symbolizer(view, obj, edges, menu, nb) {
    // Constructor
    this.obj = obj;
    this.edges = edges;
    this.view = view;
    this.menu = menu;
    this.menu.view = this.view;
    this.nb = nb;
    this.applyStyle();
}

Symbolizer.prototype.applyStyle = function applyStyle(style = null, folder = null) {
    var i;
    var j;
    var k;
    if (style && style.faces[0].name) {
        // Update GUI
        var count = 0;
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        for (k in folder.__folders.Faces.__folders) {
            if (Object.prototype.hasOwnProperty.call(folder.__folders.Faces.__folders, k)) {
                folder.__folders.Faces.__folders[k].__controllers[0].setValue(style.faces[count].opacity);
                folder.__folders.Faces.__folders[k].__controllers[1].setValue(style.faces[count].color);
                folder.__folders.Faces.__folders[k].__controllers[2].setValue(style.faces[count].emmissive);
                folder.__folders.Faces.__folders[k].__controllers[3].setValue(style.faces[count].specular);
                folder.__folders.Faces.__folders[k].__controllers[4].setValue(style.faces[count].shininess);
            }
            count++;
        }
        // Apply given style to each child
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this._changeOpacityEdge(style.edges.opacity, i, j);
                this._changeColorEdge(style.edges.color, i, j);
                this._changeWidthEdge(style.edges.width, i, j);
            }
        }
        for (i = 0; i < this.obj.length; i++) {
            for (j = 0; j < this.obj[i].children.length; j++) {
                var name = this.obj[i].children[j].name;
                var h = 0;
                while (h < style.faces.length && style.faces[h].name != name) {
                    h++;
                }
                this._changeOpacity(style.faces[h].opacity, i, j);
                this._changeColor(style.faces[h].color, i, j);
                this._changeEmissive(style.faces[h].emissive, i, j);
                this._changeSpecular(style.faces[h].specular, i, j);
                this._changeShininess(style.faces[h].shininess, i, j);
                if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, i, j, folder.__folders.Faces);
            }
        }
    }
    else if (style && style.faces.length == 1) {
        // Update GUI
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        folder.__folders.Faces.__controllers[0].setValue(style.faces[0].opacity);
        folder.__folders.Faces.__controllers[1].setValue(style.faces[0].color);
        folder.__folders.Faces.__controllers[2].setValue(style.faces[0].emmissive);
        folder.__folders.Faces.__controllers[3].setValue(style.faces[0].specular);
        folder.__folders.Faces.__controllers[4].setValue(style.faces[0].shininess);
        // Apply given style to all children
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this._changeOpacityEdge(style.edges.opacity, i, j);
                this._changeColorEdge(style.edges.color, i, j);
                this._changeWidthEdge(style.edges.width, i, j);
            }
        }
        for (i = 0; i < this.obj.length; i++) {
            for (j = 0; j < this.obj[i].children.length; j++) {
                this._changeOpacity(style.faces[0].opacity, i, j);
                this._changeColor(style.faces[0].color, i, j);
                this._changeEmissive(style.faces[0].emissive, i, j);
                this._changeSpecular(style.faces[0].specular, i, j);
                this._changeShininess(style.faces[0].shininess, i, j);
                if (style.faces.texture != null) this._changeTexture(style.faces.texture, i, j, folder.__folders.Faces);
            }
        }
    }
    else {
        // Apply default style
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this._changeOpacityEdge(1, i, j);
                this._changeColorEdge('#000000', i, j);
                this._changeWidthEdge(1, i, j);
            }
        }
        var color = getRandomColor();
        for (i = 0; i < this.obj.length; i++) {
            for (j = 0; j < this.obj[i].children.length; j++) {
                this._changeOpacity(1, i, j);
                this._changeColor(color, i, j);
                this._changeEmissive(color, i, j);
                this._changeSpecular(color, i, j);
                this._changeShininess(30, i, j);
                // No texture
            }
        }
    }
};

// Callback functions (concrete stylization)

Symbolizer.prototype._changeOpacity = function changeOpacity(value, i, j) {
    this.obj[i].children[j].material.opacity = value;
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeOpacityEdge = function changeOpacityEdge(value, i, j) {
    this.edges[i].children[j].material.opacity = value;
    this.edges[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColor = function changeColor(value, i, j) {
    this.obj[i].children[j].material.color = new THREE.Color(value);
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColorEdge = function changeColorEdge(value, i, j) {
    this.edges[i].children[j].material.color = new THREE.Color(value);
    this.edges[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeEmissive = function changeEmissive(value, i, j) {
    this.obj[i].children[j].material.emissive = new THREE.Color(value);
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeSpecular = function changeSpecular(value, i, j) {
    this.obj[i].children[j].material.specular = new THREE.Color(value);
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeShininess = function changeShininess(value, i, j) {
    this.obj[i].children[j].material.shininess = value;
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};


Symbolizer.prototype._changeEdgeTexture = function changeEdgeTexture(chemin, i) {
    var vertex =
    `
    attribute vec3  position2;
    uniform   vec2  resolution;
    uniform   float thickness;
    varying   vec3 v_uv;
    varying   float choixTex;
    void main() {
    gl_Position = projectionMatrix *
                    modelViewMatrix *
                    vec4(position,1.0);

    vec4 Position2 = projectionMatrix *
                    modelViewMatrix *
                    vec4(position2,1.0);

    vec2 normal = normalize((gl_Position.xy/gl_Position.w - Position2.xy/Position2.w) * resolution); // * 0.5
    normal = uv.x * uv.y * vec2(-normal.y, normal.x);

    if (length((gl_Position.xyz+Position2.xyz)/2.0)>25.0){
        gl_Position.xy += 25.0*(thickness/length((gl_Position.xyz+Position2.xyz)/2.0)) * gl_Position.w * normal * 2.0 / resolution;
        }
    else {
        gl_Position.xy += thickness * gl_Position.w * normal * 2.0 / resolution;
    }

    if (distance(position, position2) < 3.0){
        choixTex = 1.0;
        
    } else if (distance(position, position2) > 10.0){
        choixTex = 3.0;
    //  v_uv = vec3(2.0*(uv.x-0.5),uv.y,1.)*gl_Position.w;
    }else {
        choixTex = 2.0;
    }

    v_uv = vec3(uv,1.)*gl_Position.w;

    }
    `;

    var fragment =
    `
    varying vec3  v_uv;
    varying float choixTex;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform sampler2D texture3;
    uniform sampler2D paper;
    uniform vec3 color;
    

    void main() {
    vec2 uv = v_uv.xy/v_uv.z;
    vec4 baseColor = texture2D(texture1, (uv+1.)*0.5);
    //vec4 paperColor = texture2D(paper, (uv+1.)*0.5 );

    if (choixTex == 2.0){
        baseColor = texture2D(texture2, (uv+1.)*0.5);   
    } else if (choixTex == 3.0){
        baseColor = texture2D(texture3, (uv+1.)*0.5);   
    }

    if ( baseColor.a < 0.3 ) discard;
       gl_FragColor = baseColor+vec4(color,0.0); //0.0 si on veut la transparence des arêtes
    }
    `;
    var color = new THREE.Color(getRandomColor());
    var width = 50;

    var texture1;
    var texture2;

    var loader1 = new THREE.TextureLoader();
    var loader2 = new THREE.TextureLoader();
    var loader3 = new THREE.TextureLoader();

    loader1.load(
        'strokes/'.concat('brush').concat('_small.png'),
        (texture) => {
            texture1 = texture;
            loader2.load(
                'strokes/'.concat('brush').concat('.png'),
                   (text) => {
                       texture2 = text;
                       loader3.load(
                            'strokes/paper2.png',
                            (paper) => {
                                this._createMaterial(i, texture1, texture2, paper, vertex, fragment, color, width);
                            },
                            undefined,
                            (err) => {
                                console.error('An error happened.');
                            });
                   },
            undefined,
            (err) => {
                console.error('An error happened.');
            });
        },
        undefined,
        (err) => {
            console.error('An error happened.');
        });
};

Symbolizer.prototype._createMaterial = function createMaterial(i, texture1, texture2, paper, vertex, fragment, color, width) {
    var material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms:
        {
            time: { value: 1.0 },
            thickness: { value: width },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            texture1: { type: 't', value: texture1 },
            texture2: { type: 't', value: texture2 },
            texture3: { type: 't', value: texture2 },
            paper: { type: 't', value: paper },
            color: { type: 'v3', value: [color.r, color.g, color.b] },
        },
    });
    material.side = THREE.DoubleSide;
    material.transparent = true;
    material.polygonOffset = true;
    material.polygonOffsetUnits = -150.0;
    material.visible = true;
    material.needsUpdate = true;

    var group = new THREE.Group();
    console.log('edges', this.edges);

    console.log(this.obj);
    console.log(i);
    for (var j = 0; j < this.obj[i].children.length; j++) {


        var edg = new THREE.EdgesGeometry(this.obj[i].children[j].geometry);

        var vvv = edg.getAttribute('position');
        console.log(vvv.itemSize);
        console.log(vvv.count);
        for (var k = 0; k < vvv.count - 5; k += 6) {
            var lineGeom = createQuad(
                new THREE.Vector3(vvv.array[k], vvv.array[k + 1], vvv.array[k + 2]),
                new THREE.Vector3(vvv.array[k + 3], vvv.array[k + 4], vvv.array[k + 5]));
            var mesh = new THREE.Mesh(lineGeom, new THREE.MeshBasicMaterial({ color: 0xff0000 }));

            mesh.position.copy(this.obj[i].children[j].position);
            mesh.scale.copy(this.obj[i].children[j].scale);
            mesh.rotation.copy(this.obj[i].children[j].rotation);

            mesh.material.needsUpdate = true;
            mesh.updateMatrixWorld();
            group.add(mesh);
        }
        this.edges[i].children[j].material = material;
        this.edges[i].children[j].material.needsUpdate = true;
        /*
        this.edges.children[i].material = material;
        this.edges.children[i].material.needsUpdate = true;
        console.log(this.edges.children[i].geometry);
        var mesh = new THREE.Mesh(this.edges.children[i].geometry, material);
        mesh.position.copy(this.edges.children[i].position);
        mesh.updateMatrixWorld();
        // this.edges.children[i].material = material;
        this.view.scene.add(mesh);
        */
    }
    this.view.scene.add(group);
    this.view.notifyChange(true);
    console.log(group);
};

Symbolizer.prototype._changeTexture = function changeTexture(chemin, i, j, folder) {

    if (chemin != './textures/') {
        var isTextured = false;
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                isTextured = true;
            }
        }
        if (!isTextured) {
            folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 5).name('Texture Repetition').onChange((value) => {
                this._changetextureRepetition(value, i, j);
            });
        }
        var texture = new THREE.TextureLoader().load(chemin);
        texture.textureRepetition = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        var meshshininess = this.obj[i].children[j].material.shininess;
        var meshspecular = this.obj[i].children[j].material.specular;
        var meshemissive = this.obj[i].children[j].material.emissive;
        var meshcolor = this.obj[i].children[j].material.color;
        var meshopacity = this.obj[i].children[j].material.opacity;
        this.obj[i].children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
        
    } else {
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        this.obj[i].children[j].material.map = null;
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    }
};

Symbolizer.prototype._changeTextureAll = function changeTextureAll(chemin, i, folder) {

    if (chemin != './textures/') {
        var isTextured = false;
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                isTextured = true;
            }
        }
        if (!isTextured) {
            folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 5).name('Texture Repetition').onChange((value) => {
                for (let j = 0; j < this.obj[i].children.length; j++) {
                    this._changetextureRepetition(value, i, j); 
                }
            });
        }
        for (let j = 0; j < this.obj[i].children.length; j++) {
            var texture = new THREE.TextureLoader().load(chemin);
            texture.textureRepetition = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            var meshshininess = this.obj[i].children[j].material.shininess;
            var meshspecular = this.obj[i].children[j].material.specular;
            var meshemissive = this.obj[i].children[j].material.emissive;
            var meshcolor = this.obj[i].children[j].material.color;
            var meshopacity = this.obj[i].children[j].material.opacity;
            this.obj[i].children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
            this.obj[i].children[j].material.needsUpdate = true;
            this.view.notifyChange(true);
        }
        
    } else {
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        for (let j = 0; j < this.obj[i].children.length; j++) {
            this.obj[i].children[j].material.map = null;
            this.obj[i].children[j].material.needsUpdate = true;
            this.view.notifyChange(true);
        }

    }
};

Symbolizer.prototype._changeWidthEdge = function changeWidthEdge(value, i, j) {
    this.edges[i].children[j].material.linewidth = value;
    this.edges[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changetextureRepetition = function changetextureRepetition(value, i, j) {
    this.obj[i].children[j].material.map.repeat.set(value, value);
    this.obj[i].children[j].material.needsUpdate = true;
    this.view.notifyChange(true);
};


Symbolizer.prototype._saveVibes = function saveVibes() {
    // Initiate stylesheet with edge style and an empty list for face style
    var vibes = {
        edges: {
            opacity: this.edges[0].children[0].material.opacity,
            color: this.edges[0].children[0].material.color,
            width: this.edges[0].children[0].material.linewidth,
        },
        faces: [] };
    // Iteration over the children of each object (they all have the same)
    for (var i = 0; i < this.obj[0].children.length; i++) {
        // Get the texture path
        var textureUse = null;
        // Checks if the mesh has a texture
        if (this.obj[0].children[i].material.map != null) {
            var textureUsetab = this.obj[0].children[i].material.map.image.src.split('/');
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
            name: this.obj[0].children[i].name,
            opacity: this.obj[0].children[i].material.opacity,
            color: '#'.concat(this.obj[0].children[i].material.color.getHexString()),
            emissive: '#'.concat(this.obj[0].children[i].material.emissive.getHexString()),
            specular: '#'.concat(this.obj[0].children[i].material.specular.getHexString()),
            shininess: this.obj[0].children[i].material.shininess,
            texture: textureUse,
        });
    }
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    FILE.saveAs(blob, this.obj[0].materialLibraries[0].substring(0, this.obj[0].materialLibraries[0].length - 4).concat('.vibes'));
};

Symbolizer.prototype._saveVibesAll = function saveVibesAll() {
    var vibes = {
        edges: {
            opacity: this.edges[0].children[0].material.opacity,
            color: this.edges[0].children[0].material.color,
            width: this.edges[0].children[0].material.linewidth,
        },
        faces: [] };
    // Get the texture path
    var textureUse = null;
    // Checks if the mesh has a texture
    if (this.obj[0].children[0].material.map != null) {
        var textureUsetab = this.obj[0].children[0].material.map.image.src.split('/');
        var j = 0;
        while (j < textureUsetab.length && textureUsetab[j] != 'textures') j++;
        textureUse = '.';
        while (j < textureUsetab.length) {
            textureUse = textureUse.concat('/', textureUsetab[j]);
            j++;
        }
    }
    vibes.faces.push({
        opacity: this.obj[0].children[0].material.opacity,
        color: '#'.concat(this.obj[0].children[0].material.color.getHexString()),
        emissive: '#'.concat(this.obj[0].children[0].material.emissive.getHexString()),
        specular: '#'.concat(this.obj[0].children[0].material.specular.getHexString()),
        shininess: this.obj[0].children[0].material.shininess,
        texture: textureUse,

    });
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    FILE.saveAs(blob, this.obj[0].materialLibraries[0].substring(0, this.obj[0].materialLibraries[0].length - 4).concat('.vibes'));
};

Symbolizer.prototype._readVibes = function readVibes(file, folder) {
    var reader = new FileReader();
    reader.addEventListener('load', () => this.applyStyle(JSON.parse(reader.result), folder), false);
    reader.readAsText(file);
};

// Menu management

Symbolizer.prototype._addOpacity = function addOpacity(folder, j) {
    var initialOpacity = this.obj[0].children[j].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
        // Iteration over the list of objects
        for (var i = 0; i < this.obj.length; i++) {
            this._changeOpacity(value, i, j);
        }
    });
};

Symbolizer.prototype._addColor = function addColor(folder, j) {
    var initialColor = '#'.concat(this.obj[0].children[j].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            this._changeColor(value, i, j);
        }
    });
};

Symbolizer.prototype._addEmissive = function addEmissive(folder, j) {
    var initialEmissive = '#'.concat(this.obj[0].children[j].material.emissive.getHexString());
    folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            this._changeEmissive(value, i, j);
        }
    });
};


Symbolizer.prototype._addSpecular = function addSpecular(folder, j) {
    var initialSpecular = '#'.concat(this.obj[0].children[j].material.specular.getHexString());
    folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            this._changeSpecular(value, i, j);
        }
    });
};

Symbolizer.prototype._addShininess = function addShininess(folder, j) {
    var initialShininess = this.obj[0].children[j].material.shininess;
    folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            this._changeShininess(value, i, j);
        }
    });
};

Symbolizer.prototype._addTexture = function addTexture(folder, j) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (var i = 0; i < this.obj.length; i++) {
                    this._changeTexture('./textures/'.concat(value), i, j, folder);
                }
            }).name('Texture');
        }
    });
};


// More parameters...

Symbolizer.prototype._addSave = function addSave(folder) {
    folder.add({ save: () => this._saveVibes() }, 'save').name('Save style');
};

Symbolizer.prototype._addLoad = function addLoad(folder) {
    folder.add({ load: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => this._readVibes(button.files[0], folder), false);
        button.click();
    } }, 'load').name('Load style');
};

Symbolizer.prototype.initGui = function addToGUI() {
    // We check if the objects of the list have the same structure
    if (this._checkStructure()) {
        // If the structure is similar, we create a folder for the symbolizer
        var parentFolder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
        this._addSave(parentFolder);
        this._addLoad(parentFolder);
        var positionFolder = parentFolder.addFolder('Position');
        this._addRotationsAll(positionFolder); 
        this._addScaleAll(positionFolder);
        var edgesFolder = parentFolder.addFolder('Edges');
        this._addColorEdgeAll(edgesFolder);
        this._addOpacityEdgeAll(edgesFolder);
        this._addWidthEdgeAll(edgesFolder);
        // Iteration over the children of each object (for ex. roof / wall)
        // (We previously checked that each object in the list has the same structure)
        var facesFolder = parentFolder.addFolder('Faces');
        for (var j = 0; j < this.obj[0].children.length; j++) {
            // We create a folder for each child
            var folder = facesFolder.addFolder(this.obj[0].children[j].name);
            this._addOpacity(folder, j);
            this._addColor(folder, j);
            this._addEmissive(folder, j);
            this._addSpecular(folder, j);
            this._addShininess(folder, j);
            this._addTexture(folder, j);
        }
    }
    else {
        this.initGuiAll();
    }
};

Symbolizer.prototype._addScaleAll = function addScaleAll(folder) {
    folder.add({ scale: 0 }, 'scale', 0.1, 1000, 0.01).name('scale').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
           this.obj[i].scale.set(value, value, value);
           this.edges[i].scale.set(value, value, value);
           this.obj[i].updateMatrixWorld();
           this.edges[i].updateMatrixWorld();
        }
        this.view.notifyChange(true);
    });
};

Symbolizer.prototype._addRotationsAll = function addRotationsAll(folder) {
    
    folder.add({ rotationX: 0 }, 'rotationX', 0, 1, 0.01).name('rotationX').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
           this.obj[i].rotateX(value);
           this.edges[i].rotateX(value);
           this.obj[i].updateMatrixWorld();
           this.edges[i].updateMatrixWorld();
        }
        this.view.notifyChange(true);
    });
    folder.add({ rotationY: 0 }, 'rotationY', 0, 1, 0.01).name('rotationY').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
           this.obj[i].rotateY(value);
           this.edges[i].rotateY(value);
           this.obj[i].updateMatrixWorld();
           this.edges[i].updateMatrixWorld();
        }
        this.view.notifyChange(true);
    });
    folder.add({ rotationZ: 0 }, 'rotationZ', 0, 1, 0.01).name('rotationZ').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
           this.obj[i].rotateZ(value);
           this.edges[i].rotateZ(value);
           this.obj[i].updateMatrixWorld();
           this.edges[i].updateMatrixWorld();
        }
        this.view.notifyChange(true);
    });
};

Symbolizer.prototype._addOpacityAll = function addOpacityAll(folder) {
    var initialOpacity = this.obj[0].children[0].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
        // Iteration over the list of objects
        for (var i = 0; i < this.obj.length; i++) {
            // Iteration over the children of each object
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeOpacity(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addOpacityEdgeAll = function addOpacityEdgeAll(folder) {
    var initialOpacity = this.edges[0].children[0].material.opacity;
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Edge opacity').onChange((value) => {
        for (var i = 0; i < this.edges.length; i++) {
            for (var j = 0; j < this.edges[i].children.length; j++) {
                this._changeOpacityEdge(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addColorAll = function addColorAll(folder) {
    var initialColor = '#'.concat(this.obj[0].children[0].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeColor(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addColorEdgeAll = function addColorEdgeAll(folder) {
    var initialColor = '#'.concat(this.edges[0].children[0].material.color.getHexString());
    folder.addColor({ color: initialColor }, 'color').name('Edge color').onChange((value) => {
        for (var i = 0; i < this.edges.length; i++) {
            for (var j = 0; j < this.edges[i].children.length; j++) {
                this._changeColorEdge(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addEmissiveAll = function addEmissiveAll(folder) {
    var initialEmissive = '#'.concat(this.obj[0].children[0].material.emissive.getHexString());
    folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeEmissive(value, i, j);
            }
        }
    });
};


Symbolizer.prototype._addSpecularAll = function addSpecularAll(folder) {
    var initialSpecular = '#'.concat(this.obj[0].children[0].material.specular.getHexString());
    folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeSpecular(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addShininessAll = function addShininessAll(folder) {
    var initialShininess = this.obj[0].children[0].material.shininess;
    folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeShininess(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addWidthEdgeAll = function addWidthEdgeAll(folder) {
    var initialWidth = this.edges[0].children[0].material.linewidth;
    folder.add({ width: initialWidth }, 'width', 0, 5).name('Edge width').onChange((value) => {
        for (var i = 0; i < this.obj.length; i++) {
            for (var j = 0; j < this.obj[i].children.length; j++) {
                this._changeWidthEdge(value, i, j);
            }
        }
    });
};

Symbolizer.prototype._addTextureAll = function addTextureAll(folder) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (var i = 0; i < this.obj.length; i++) {
                    this._changeTextureAll('./textures/'.concat(value), i, folder);
                }
            }).name('Texture');
        }
    });
};


Symbolizer.prototype._addEdgeTextureAll = function addEdgeTextureAll(folder) {
    Fetcher.json('./textures/listeEdgeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (let i = 0; i < this.edges.length; i++) {
                    this._changeEdgeTexture('./textures/'.concat(value), i);
                }
            }).name('Edge texture');
        }
    });
};

Symbolizer.prototype._addSaveAll = function addSave(folder) {
    folder.add({ save: () => this._saveVibesAll() }, 'save').name('Save style');
};

Symbolizer.prototype.initGuiAll = function addToGUI() {
    // var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    var folder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
    this._addSaveAll(folder);
    this._addLoad(folder);
    var positionFolder = folder.addFolder('Position');
    this._addRotationsAll(positionFolder); 
    this._addScaleAll(positionFolder);
    var edgesFolder = folder.addFolder('Edges');
    this._addColorEdgeAll(edgesFolder);
    this._addOpacityEdgeAll(edgesFolder);
    this._addWidthEdgeAll(edgesFolder);
    this._addEdgeTextureAll(edgesFolder);
    var facesFolder = folder.addFolder('Faces');
    this._addTextureAll(facesFolder);
    this._addOpacityAll(facesFolder);
    this._addColorAll(facesFolder);
    this._addEmissiveAll(facesFolder);
    this._addSpecularAll(facesFolder);
    this._addShininessAll(facesFolder);
};

Symbolizer.prototype._checkStructure = function checkStructure() {
    var i;
    // var j;
    // We check if the objects have the same number of children
    for (i = 0; i < this.obj.length; i++) {
        if (this.obj[i].children.length != this.obj[0].children.length) {
            // If one object has a different number of children, the function returns false
            return false;
        }
    }
    /*
    // We check if the children have the same name (in the right order)
    for (i = 0; i < this.obj.length; i++) {
        for (j = 0; this.obj[i].children.length; j++) {
            // If one child of one object has a different name, the function returns false
            console.log(this.obj[0].children[j].name);
            console.log(this.obj[i].children[j].name);
            if (this.obj[0].children[j].name !== this.obj[i].children[j].name) {
                return false;
            }
        }

    */
    // If everything is ok, the function returns true
    return true;
};


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createQuad(pt1, pt2) {

    // Définition propre a chaque géométrie
    var geometry = new THREE.BufferGeometry();

    // les 6 points
    var vertices = new Float32Array([
        pt1.x, pt1.y, pt1.z, // -1
        pt2.x, pt2.y, pt2.z, // -1
        pt2.x, pt2.y, pt2.z, //  1

        pt2.x, pt2.y, pt2.z, //  1
        pt1.x, pt1.y, pt1.z, //  1
        pt1.x, pt1.y, pt1.z]);

    // pour chacun des six points, le point opposé correspondant
    var vertices2 = new Float32Array([
        pt2.x, pt2.y, pt2.z,
        pt1.x, pt1.y, pt1.z,
        pt1.x, pt1.y, pt1.z,


        pt1.x, pt1.y, pt1.z,
        pt2.x, pt2.y, pt2.z,
        pt2.x, pt2.y, pt2.z]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('position2', new THREE.BufferAttribute(vertices2, 3));

    var uv = new Float32Array([
        -1, -1,
        1, -1,
        1, 1,

        1, 1,
        -1, 1,
        -1, -1]);


    geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));

    return geometry;
}

export default Symbolizer;
