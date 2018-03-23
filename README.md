
<img src="Vibes.png" style="width: 400px;"/>

# Visualization in iTowns of Buildings Elegantly Stylized

[![Build Status](https://travis-ci.org/arnaudgregoire/itowns-style.svg?branch=master)](https://travis-ci.org/arnaudgregoire/itowns-style)
  
  
## Summary

1. [Presentation of the project](#presentation-of-the-project)
2. [Project management](#project-management)
3. [Analysis of the existing situation](#analysis-of-the-existing-situation)
4. [Conception](#conception)
5. [First implementation](#first-implementation)
6. [Architecture set-up](#architecture-set-up)
7. [Advanced functionalities](#advanced-functionalities)
8. [Tests](#tests)
9. [Perspectives](#perspectives) 
  
  
## Presentation of the project

The VIBES (Visualization in iTowns of Buildings Elegantly Stylized) project consists in implementing geovisualisation techniques to stylize buildings on the platform iTowns. This project aims to provide a visual support for city planning, among other purposes.  

The user should be able to : 
* Load one or several 3D file (of various formats).
* Transform its/their visual aspect(s) using a GUI.
* Save the current style in a JSON-like format (to be defined).
* Load an existing style to re-apply it, including predefined styles (transparent, typical, sketchy).  
  
This project was proposed by Sidonie Christophe, from the COGIT laboratory (IGN), with Alexandre Devaux and Mathieu Bredif as technical support on iTowns.
  
**[Back to the top](#summary)** 
  
  
## Project management

This project will be carried out in March and April 2018 by a group of seven students in ENSG TSI, using SCRUM methodology. It will be divided into seven sprints, each one during a week. 
  
### Previsional backlog 

The previsional planning is the following :
* **Sprint 1** : analysis, conception, first version of the tool, CI/CD.
* **Sprint 2** : architecture set-up, definition of the 3D style with basic parameters + texture on faces, saving and loading.
* **Sprint 3** : adaptation of the architecture to stylize several objects, application of a texture on edges, diversification of input formats (Bati3D, BDTopo).
* **Sprint 4** : diversification of input formats, geolocation, layer management.
* **Sprint 5** : advanced parameters including light, shadows, cameras.
* **Sprint 6** : advanced parameters including edge stylization and advanced texturation.
* **Sprint 7** : finalization, reports, presentation.  
  
### Management tools

* **GitHub** - for code hosting.
* **Travis** - for continuous integration.
* **Easybacklog** - for backlog and planning.
* **Trello** - for task assignment and file sharing.
  
**[Back to the top](#summary)** 
  
  
## Analysis of the existing situation
  
### The iTowns environment
  
The main challenge of this project is that it has to be included into the architecture of the existing [iTowns](http://www.itowns-project.org/) project. Therefore, a necessary step is to get to know this architecture and to analyze it in order to know where our new functionalities could be located.

![archi_itowns](VIBES/itowns_archi.png)
  

### PLU++

The PLU++ project, developed in 2016 using Three.js, will be used as proof of concept to help start our project. To that end, we analyzed the code from the latest version available on github : [IGN/PLU2PLUS](https://github.com/IGNF/PLU2PLUS)

![archi_itowns](VIBES/plu2plus.png)

The goal of this analysis is to find out how the following things can be done :

* Loading an OBJ file.
* Applying a style to a mesh.
* Changing this style dynamically using a user interface (dat.GUI).
  

#### Description of the project

The project consists in a webpage which display a 3D scene that contains a plane geometry with building on it, and a user menu made with dat.GUI to change the visual aspect of the buildings (color, opacity, style...) and do some other actions, such as recenter the camera, save the current style, etc.  

There are two sorts of buildings :
* **Focus** : the main buildings the user wants to work on, loaded from an OBJ model.
* **Context** : the surrounding buildings, loaded from BDTOPO or BATI3D (also OBJ models).  

[Presentation of PLU++](http://ignf.github.io/PLU2PLUS/)
  
#### Structure of the code

The main code is divided into 5 files, as follow :

* **rendu.html** : contains the main work.
* **fonctions_gui.js** : contains main functions for file loading, GUI initialization and update.
* **fonctions_load.js** : contains the utils functions to load 3D files.
* **fonctions_sliders.js** : contains the utils functions to handle the sliders.
* **fonctions.js** : contains other utils functions
  
#### How does it work ?
  
1. The user chooses a JSON file as an input, to define the initial style.
2. The GUI is created with those initial parameters.  
(the style - discret, typique, sketchy - determines which parameters of the GUI are visible).
3. Three.js materials are initialized with the initial parameters.
4. Event listeners are created on the GUI : each change will be repercuted directly on the materials previously created (for the context) or on each vertice created (for the focus).
5. OBJ models are loaded with the current material.
  
#### Possible ameliorations
  
Although the PLU++ project successes in creating an easy-to-use interface to dynamically change the stylization of 3D objects through various parameters, its implementation has some limitations. Particularly, its structure does not clearly separate the 3D geometry and the stylization itself.

However, it provides a helpful set of functions that can be re-use in our project, particularly for edges extraction and texture application.

Therefore, the idea of our project is to re-make the concept of PLU++ inside the iTowns structure, but in a more generic way so it can be re-used and re-adapted more easily.
  
**[Back to the top](#summary)** 
  
  
## Conception
  
### Architecture
  
The architecture of our project must be included in iTowns. The following schema shows the different functionalities of iTowns, with the ones that interest us in red :  

![archi_itowns](VIBES/itowns_archi2.png)

The goal is to make this tool as general as possible, which means it must not depend on just one example. On the contrary, it should be usable on any example containing a 3D object on an instance of the globe, as a full-fledged functionality of iTowns. Therefore, we will create a new class Symbolizer, which will manage the menu and the 3D render. We will also extend the loading functionalities of iTowns in order to handle .obj files and other formats, using a new class called ModelLoader.
  
### 3D stylization process

The 3D stylization will be done according to the following activity diagram :

![ActivityDiagram](VIBES/3DStylizationProcess.png)
  
### Style format

Generic style, applicable to any mesh :

```json
{
    "edges" : {
        "opacity": 1,
        "color": "#ffffff",
        "width": 1
    }
    "faces" : [{
        "opacity": 1,
        "color": "ffffff",
        "emissive": "ffffff",
        "specular": "ffffff",
        "shininess": 30,
        "texture": "./textures/texture.png"
    }],
    
}
```  
  
Syle format for a complex object with several meshes, all defined by a name :

```json
{
    "edges" : {
            "opacity": 1,
            "color": "#ffffff",
            "width": 1
    },
    "faces": [ 
        {
            "name": "nom_element1",
            "opacity": 1,
            "color": "#ffffff",
            "emissive": "#ffffff",
            "specular": "#ffffff",
            "shininess": 30,
            "texture": "./textures/texture.png"
        },{
            "name": "nom_element2",
            "opacity": 1,
            "color": "#ffffff",
            "emissive": "#ffffff",
            "specular": "#ffffff",
            "shininess": 30,
            "texture": "./textures/texture.png"
        },{
            "name": "nom_element3",
            "opacity": 1,
            "color": "#ffffff",
            "emissive": "#ffffff",
            "specular": "#ffffff",
            "shininess": 30,
            "texture": "./textures/texture.png"
        }
    ]
}
```
  
**[Back to the top](#summary)** 
  
  
## First version of the tool : basic functionalities
  
The first version of our tool was first based on the iTowns example "collada". It is located on a new example called "VibesObj". To try it, simply run this example on our fork of iTowns, available at [this adress](https://github.com/arnaudgregoire/itowns-style).  
  
### Loading a 3D object in iTowns
 
The first step to stylize a 3D object is to load this object and make it visible. We focused on the .OBJ format at the beginning, as we already had samples for testing. We used the Three.js extension *OBJLoader*, already included in iTowns in the node module three-obj-loader ([source](https://github.com/sohamkamani/three-object-loader)).  
  
To load a 3D object in iTowns, we have to follow the following steps :
* Instanciate the globe.
* Instanciate the OBJLoader and call the load function.  
  
The following steps are implemented in the callback of the load function.
* Place the object on its right location, rotate and scale it if necessary.
* Put the object layer in the camera layers so it is rendered.
* Initialize a material and assign it to the object.
* Update the transformation (with updateMatrixWorld()).
* Add the object to the scene.
* Notify the change to the globe view.

The loaded object should now appear on the globe at the chosen position. We chose to first display it with a *THREE.MeshPhongMaterial*, with these parameters :
* **color: #ffffff**
* **transparent: true**
* **side: THREE.DoubleSide**
* **castShadow: true**

We implemented a drag and drop functionality to easily load the 3D object (on .obj format), with a fixed geolocation for now. The example models are located in examples/model. We have been using croutitower.obj, test.obj and destroyer.obj for our tests.

(image croutitower)
 
### Applying a style to a mesh with Three.js
  
To change the stylization of an object, we must know how this object is structured and where the information about its aspect is stored.  
  
The objects we just loaded are actually a group of meshes (type *THREE.Group*). For example, the croutitower is composed of 14 meshes. We can access these meshes by iterating over the children of the object. Then we just have to access the attribute *material* of each mesh and change the attributes we want to change.  
  
The basic implemented parameters are : **color**, **opacity**, **emissive color**, **specular color**, and **shininess**. 
  
### Creating a user interface to dynamically modify the stylization
  
The Javascript library [dat.GUI](https://github.com/dataarts/dat.gui) allows to create a user simple interface with buttons, sliders, checkboxes, etc. It is already used in iTowns, in the GuiTools class, to handle color and elevation layers on the globe. Thus, we will re-use this menu and add our own stylization parameters on it. Each element of the menu has an event listener with a callback function that performs the corresponding stylization on the mesh.  
  
The elements of the menu will be organized as follow :
  
(image du menu)  
  
### Saving and loading a style
  
Our tool must also allow to save the current style in a *.vibes* file (see [above](#style-format)) and re-load it later. We used [FileSaver.js](https://github.com/eligrey/FileSaver.js/) to save the file as a Blob object.  
  
We used the Javascript object FileReader to load a file and get the data in it. This data can then be parsed in JSON and read directly to be applied to the meshes.  
When a stylesheet is loaded, the values of the GUI are updated to match the current stylisation of the object.

**[Back to the top](#summary)** 

## Architecture set-up

Although the first version is functional, it did not respond to the main issue of the project, which is created a generic tool, included in iTowns. Therefore, in a second step, we divided the functionalities described in the previous paragraph into three files :
* **ModelLoader.js** : the class to load different sort of 3D objects (just *.OBJ* for now).
* **Symbolizer.js** : the class that carry all the stylization functionalities and the GUI.
* **VibesTest.js** : the example file (linked to the HTML document) where we call the previous classes.

### Class ModelLoader

This class has 2 attributes :
* **view** : the iTowns view, passed as parameter of the constructor.
* **model** : initialized as null, this attribute will carry the object loaded and the edges extracted from it (see [after](#edges-extraction)).  
  
It contains one public method for each format. Only one (*loadOBJ()*) is implemented for now. These functions convert the 3D object into a group of meshes adapted to the symbolizer, and call an internal method to load the object in iTowns. The final object (and its edges) are stored in the attribute *model*.  
  
A callback function should be passed in the parameters of the public method, to specify what should be done when the loading is complete.  
  
### Class Symbolizer

This class has 5 attributes, all passed as parameters of the constructor :
* **view** : the iTowns view.
* **obj** : the object to stylize (a group of *THREE.Mesh*).
* **edges** : the edges to stylize (a group of *THREE.LineSegments*).
* **menu** : the GUI where the user interface will be created.
* **nb** : the ID of the symbolizer.  
  
When the Symbolizer is instanciated, a default style is applied to the object with random colors.  
  
The public methods are the two different GUI initialization : 
* **initGuiAll** : opens one Symbolizer for all the meshes of the object.
* **initGui** : opens one Symbolizer for each mesh.
  
Each initializer method builds the structure of the GUI, with the appropriate folders and call the 'add' functions.  
The 'add' functions create buttons and sliders to the menu with dat.GUI, and define the 'change' functions as callbacks.  
The 'change' functions perform the concrete stylization on the object/edges.  
  
### Layer management
  
At this step, our tool is able to stylize one object. But what if the user wants to apply a style to several objects ? To answer this issue, we need to add a layer management functionality.  
  
We have developed a first, simple version of this management. It is a simple function, passed as callback of the loading function. It just creates a folder in the GUI and adds a checkbox with the name of the layer. To stylize several layer, the user just has to check the layer he wants and click on *Open Symbolizer*.  
  
From this step, the Symbolizer works with a list of objects and a list of edges, instead of just one.
    
(image menu)  
  
This layer manager should be improved in the next week, with ameliorations such as :
* Deleting a layer.
* Hiding a layer.
* Closing a symbolizer.
* Making impossible to open the same layer in different symbolizers.  
  
An important issue concerning the layers is how to geolocalize them. This is easy when the data itself is georeferenced, but formats like .OBJ do not provide this information. Therefore, in this case, the user should tell where the object is located, but the question is how.  
  
**[Back to the top](#summary)** 
    
  
## Advanced functionalities
  
### Edges extraction
 
The edges are extracted from the geometry thanks to a *THREE.EdgesGeometry* object, then converted into *THREE.LineSegments* and added to a group of lines that will be placed in the scene at the same coordinates as the object.  
  
These edges are initialized with a *THREE.LineBasicMaterial* that can be stylized the same way as the materials on the faces. However, unlike the faces, the edges can only be stylized as a whole, we did not separate them according to the mesh from where they were extracted.  
  
The parameters we can currently change are : **color**, **opacity**, **width**.
We also plan on adding a parameter to change the style of the edges (continuous or dotted line), but we faced a problem related to the Three.js library. Indeed, this parameter require a function of Three.js that was moved in the *THREE.Line* class in a later version than the one included in iTowns, and we could not make this function work at its previous location. This is one of the problem we need to solve in the next sprints.  
    
### Texture application
  
The PLU++ project allows to apply texture on the faces of the object, but also on the edges, in order to diversify the possible styles. The images we used as sample textures were taken from this project and from the croutitower example.  

#### On a face

Applying a texture on a face is rather easy : the *THREE.MeshPhongMaterial* has a 'map' parameter that can store a texture. We used *THREE.TextureLoader* to load an image from its local path and added the texture we obtained to the material.  
  
The source image must be located in the right folder in iTowns (*examples/textures*) and the name of the texture must appear in the *listeTexture.json*. The path of the texture is saved in the stylesheet.  
  
When a texture is applied, a new slider appears on the GUI to change the repetition of the texture.  
  
(image menu + image exemple)

#### On an edge

An edge is a linear geometry, so we cannot simply apply a texture on it. A solution, based on Mathieu Bredif's work, has already been found in the PLU++ project. It consists in creating a quadrilateral where the edge is, and apply the texture to it. This rectangle should always be facing the camera so the edge is always visible.  
  
The implementation is in progress.  
  
(image exemple sketchy edge)
   
### Environment stylization
  
Customizing the stylization of the environment in iTowns is a little more challenging than the other parameters, as it implies acting on elements that are already implemented. Unlike PLU++, the environment is already set, so we cannot re-use the functions.
  
#### Lights
  
Possible addition : changing light direction, color, intensity.  
  
#### Shadows
  
Possible addition : visible shadow (checkbox).  
  
#### Camera
  
Possible addition : different cameras PoV (birds-eye-view, oblique, immersive), camera reinitialization.  
  
**[Back to the top](#summary)** 
  
  
## Tests
  
### Unit tests
  
We made some.

### CI/CD
  
Travis.
  
**[Back to the top](#summary)** 
  
  
## Perspectives

**TO DO :**

**Stylization :**
* Finish texturing edges.  
* Try to update the Three.js library to use the LineDashedMaterial.  
* Implement environment parameters (light, shadow, camera).  
* Load a style from MTL (convert it in vibes)  

**Layers :**
* Improve layer management.  
* Geolocation : through a georef file ? or move it directly (cf three editor)  
* More formats : 3DS, WFS extruded...  
  
**[Back to the top](#summary)** 
  
  
## Authors

* **Houssem Adouni**
* **El-Hadi Bouchaour**
* **Arnaud Grégoire**
* **Rose Mathelier**
* **Laurie Nino**
* **Adel Ouhabi**
* **Ludivine Schlegel**
  
  
**[Back to the top](#summary)** 

