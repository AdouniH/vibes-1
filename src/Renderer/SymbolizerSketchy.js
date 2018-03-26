/* eslint no-eval: 0 */
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

Symbolizer.prototype.applyStyle = function applyStyle(style = null, folder = null) {
    var i;
    var j;
    var k;
    if (style && style.faces[0].name) {
        // Update GUI
        var count = 0;
        folder.__controllers[2].setValue(style.edges.color);
        folder.__controllers[3].setValue(style.edges.opacity);
        folder.__controllers[4].setValue(style.edges.width);
        for (k in folder.__folders) {
            if (Object.prototype.hasOwnProperty.call(folder.__folders, k)) {
                folder.__folders[k].__controllers[0].setValue(style.faces[count].opacity);
                folder.__folders[k].__controllers[1].setValue(style.faces[count].color);
                folder.__folders[k].__controllers[2].setValue(style.faces[count].emmissive);
                folder.__folders[k].__controllers[3].setValue(style.faces[count].specular);
                folder.__folders[k].__controllers[4].setValue(style.faces[count].shininess);
                folder.__folders[k].__controllers[5].setValue(style.faces[count].texture == null ? '' : style.faces[count].texture);
            }
            count++;
        }
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
        // Update GUI
        folder.__controllers[2].setValue(style.edges.color);
        folder.__controllers[3].setValue(style.edges.opacity);
        folder.__controllers[4].setValue(style.edges.width);
        folder.__controllers[5].setValue(style.faces[0].opacity);
        folder.__controllers[6].setValue(style.faces[0].color);
        folder.__controllers[7].setValue(style.faces[0].emmissive);
        folder.__controllers[8].setValue(style.faces[0].specular);
        folder.__controllers[9].setValue(style.faces[0].shininess);
        folder.__controllers[10].setValue(style.faces[0].texture == null ? '' : style.faces[0].texture);
        // Apply given style to all children
        for (i = 0; i < this.edges.children.length; i++) {
            this._changeOpacityEdge(style.edges.opacity, i);
            this._changeColorEdge(style.edges.color, i);
            this._changeWidthEdge(style.edges.width, i);
        }
        for (j = 0; j < this.obj.children.length; j++) {
            this._changeOpacity(style.faces[0].opacity, j);
            this._changeColor(style.faces[0].color, j);
            this._changeEmissive(style.faces[0].emissive, j);
            this._changeSpecular(style.faces[0].specular, j);
            this._changeShininess(style.faces[0].shininess, j);
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


Symbolizer.prototype._changeEdgeTexture = function _changeEdgeTexture(chemin) {
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
                                this._createMaterial(texture1, texture2, paper, vertex, fragment, color, width);
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

Symbolizer.prototype._createMaterial = function createMaterial(texture1, texture2, paper, vertex, fragment, color, width) {
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

    for (var i = 0; i < this.obj.children.length; i++) {


        var edg = new THREE.EdgesGeometry(this.obj.children[i].geometry);

        var vvv = edg.getAttribute('position');
        console.log(vvv.itemSize);
        console.log(vvv.count);
        for (var j = 0; j < vvv.count - 5; j += 6) {
            var lineGeom = createQuad(
                new THREE.Vector3(vvv.array[j], vvv.array[j + 1], vvv.array[j + 2]),
                new THREE.Vector3(vvv.array[j + 3], vvv.array[j + 4], vvv.array[j + 5]));
            var mesh = new THREE.Mesh(lineGeom, new THREE.MeshBasicMaterial({ color: 0xff0000 }));

            mesh.position.copy(this.obj.children[i].position);
            mesh.scale.copy(this.obj.children[i].scale);
            mesh.rotation.copy(this.obj.children[i].rotation);

            mesh.material.needsUpdate = true;
            mesh.updateMatrixWorld();
            group.add(mesh);
        }
        this.obj.children[i].material = material;
        this.obj.children[i].material.needsUpdate = true;
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
            width: this.edges.children[0].material.linewidth,
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

Symbolizer.prototype._readVibes = function readVibes(file, folder) {
    var reader = new FileReader();
    reader.addEventListener('load', () => this.applyStyle(JSON.parse(reader.result), folder), false);
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
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                this._changeTexture('./textures/'.concat(value), index);
            });
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
        button.addEventListener('change', () => this._readVibes(button.files[0], folder), false);
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
    this._addEdgeTextureAll(parentFolder);
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

Symbolizer.prototype._addEdgeTextureAll = function addEdgeTextureAll(folder, index) {
    Fetcher.json('./textures/listeEdgeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                this._changeEdgeTexture('./textures/'.concat(value), index);
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
    this._addEdgeTextureAll(folder);
};


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getSourceSynch(url) {
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send();
    return req.responseText;
}

function getMethod(shader) {
    var text = getSourceSynch('./methods/'.concat(shader).concat('.json'));
    var method = JSON.parse(text);
    return method;
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
