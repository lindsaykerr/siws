import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';



/**
 * ARGraphics class for managing AR graphics in a Three.js scene using MindARThree.
 * This class handles the setup of the AR system, rendering of the AR scene, and interaction with UI elements.
 * It also provides methods for managing the visibility of the AR scene and overlay elements.
 */
export default class ARGraphics {

    ARScene;    // scene from MindARThree
    ARCamera;   // camera from MindARThree 
    ARRenderer; // Get the renderer from MindARThree
    hoverScene; // Scene for rendering UI elements on top of the AR scene
    hoverCamera; // Camera for the hover scene
    #ARAnchor;
    #AROrientationRef = new THREE.Quaternion(0, 0, 0, 1); 

    /////////////////////////////////////////////////
    /// Private methods for setting up the AR system


    #getWorldQuaternion() {

        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        // Decompose the anchor's world matrix into position, quaternion, and scale
        this.#ARAnchor.group.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
        
        // Copy over the world quaternion to the reference quaternion
        this.#AROrientationRef.copy(worldQuaternion)
        
        // check to see if the quaternion is zero, if so, reset it to default
        if (worldQuaternion.x === 0 && worldQuaternion.y === 0 && worldQuaternion.z === 0) {
            this.#AROrientationRef.set(0, 0, 0, 1);                
        }

        // Notify observers about the orientation change
        this.#notifyOrientationObservers(); 
    }

    #notifyOrientationObservers() {
        // Notify all registered observers about the orientation change
        this.notifyOrientationList.forEach(observer => {
            if (typeof observer.updateOrientation === 'function') {
                observer.updateOrientation(this.#AROrientationRef);
            } else {
                console.warn("Observer does not have an updateOrientation method.");
            }
        });
    }



    /**
     * Sets up the AR system using MindARThree instance.
     * Initializes the AR scene, camera, renderer, and anchor point.
     */
    #setupARsystem() {

        this.ARScene  = this.arSys.scene;       // get Three.js scene from MindARThree
        
        {   
            this.ARRenderer = this.arSys.renderer;
            const width     = this.containerElement.offsetWidth;
            const height    = this.containerElement.offsetHeight;
            
            this.ARRenderer.setSize(width, height);
            this.ARRenderer.setPixelRatio(window.devicePixelRatio);
            this.ARRenderer.autoClearDepth = false; // Prevents clearing depth buffer on each fram
            this.ARRenderer.autoClear = false; // Prevents clearing color buffer on each frame 
            this.ARRenderer.sortObjects = false;       
        }

        {
            this.ARCamera = this.arSys.camera;  
            this.ARCamera.aspect = this.containerElement.offsetWidth / this.containerElement.offsetHeight;
            this.ARCamera.updateProjectionMatrix();
        }
        
        this.#ARAnchor     = this.arSys.addAnchor(0); // Add anchor point ref
    }




    /**
     *  Initializes a hover scene and camera for rendering UI elements on top of the AR scene. 
     */
    #setupHoverScene() {

        this.hoverScene     = new THREE.Scene();
        this.hoverCamera    = new THREE.PerspectiveCamera(
            45,     // fov
            this.containerElement.offsetWidth / this.containerElement.offsetHeight, //aspect
            0.1,    // near 
            1000    // far
        );

        this.hoverCamera.position.set(0, 0, 5);
        this.hoverScene.add(this.hoverCamera);
        
        console.log("UI Scene and Camera initialized.");
        
    }

    /**
     * Returns ref to a Three.js hover scene, which can be used to render elements on top of the AR scene.
     * Handy for overlay elements like direction arrows, UI elements, etc.
     * @returns {THREE.Scene|null} The hover scene or null if not initialized
     */
    get hoverScene() {
        if (this.hoverScene)  {
            return this.hoverScene;
        }
        console.warn("Hover scene is not initialized.");
        return null;
    }

    /*
     * Sets up event listeners for the AR system, such as resizing the renderer and camera.
     */
    #listeners(){
        function update (){
            const width = this.containerElement.offsetWidth;
            const height = this.containerElement.offsetHeight;
            this.ARRenderer.setSize(width, height);
            this.ARCamera.aspect = width / height;
            this.ARCamera.updateProjectionMatrix();
            this.hoverCamera.aspect = width / height;
            this.hoverCamera.updateProjectionMatrix();
            this.#getWorldQuaternion(); // Update the world quaternion on resize
            this.ARRenderer.setPixelRatio(window.devicePixelRatio);
        }

        window.addEventListener('resize', () => {
            update.call(this);
        });
        
    }
    
    #showDEBUGProjection(){

      
        if (!this.DEBUG) return; // Exit if debug mode is not enabled

        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        const projPlane = new THREE.Mesh(geometry, material);
        projPlane.position.set(0, 0, -0.1);
    
        this.#ARAnchor.group.add(projPlane)
    }


    ///////////////////////////////////////////////
    // Constructor and public methods


   
    /**
     * ARWayfindingGraphics class for managing AR graphics in a Three.js scene using MindARThree.
     * This class handles the setup of the AR system, rendering of the AR scene, and interaction with UI elements.
    
     *
     * @param {MindARThree} mindarThree - An instance of MindARThree to manage the AR system.
     * @param {HTMLElement} containerElement - The HTML element that will contain the AR renderer.
     * @param {boolean} [DEBUG=false] - Flag to enable debug mode for additional visual aids.
     */  
    constructor(mindarThree, containerElement, DEBUG = false) {

        // Validate the parameters
        if (!mindarThree) {
            console.error("MindARThree instance is required.");
            throw new Error("MindARThree instance is not defined.");
        }
    
        this.DEBUG = DEBUG; // Set the debug flag
    
        if (!mindarThree instanceof MindARThree) {
            // Ensure mindarThree is an instance of MindARThree
            throw new Error("Invalid constructor parameter: MindARThree instance required"); 
        }

        if (!containerElement || !(containerElement instanceof HTMLElement)) {
            
            // Ensure containerElement is a valid HTMLElement
            throw new Error("Invalid containerElement: HTMLElement required"); 
        }

        // set mindarThree and its properties
        this.arSys = mindarThree;          // MindARThree instance
        this.containerElement = containerElement; // The container element for the AR system
         
        // Set up the AR system with MindARThree
        this.#setupARsystem(); 

        this.#showDEBUGProjection();    

        // Ensure UI is loaded and ready
        this.#setupHoverScene(); 

        //this.viewAR = false; // Flag to control visibility of the AR scene
        //this.viewOverlay = false; // Flag to control visibility of the overlay scene

        // Set up event listeners for resizing and other events 
        this.#listeners();    

        // If debug mode is enabled, will show the debug projection

        this.notifyOrientationList = []; // Holds a list of entities that will be notified of orientation changes

        console.log("ARWayfindingGraphics initialized with MindARThree instance");

    }

    set viewAR(value) {
        if (!this.ARScene) {
            console.warn("ARScene is not initialized. Cannot set viewAR.");
            return;
        }
        this.ARScene.visible = value; // Set visibility of the AR scene
    }

    get viewAR() {
        if (this.ARScene) {
            return this.ARScene.visible; 
        }
    }

    set viewOverlay(value) {
        if (!this.hoverScene) {
            console.warn("Hover scene is not initialized. Cannot set viewOverlay.");
            return;
        }
        this.hoverScene.visible = value; // Set visibility of the hover scene (overlay)
    }
    get viewOverlay() {
        if (!this.hoverScene) {
            console.warn("Hover scene is not initialized. Cannot get viewOverlay.");
            return false;
        }
        return this.hoverScene.visible; // Get visibility of the hover scene (overlay)
    }

    get active() {
        if (!this.#ARAnchor || !this.#ARAnchor.group) {
            console.warn("AR anchor is not initialized. Cannot get active state.");
            return false;
        }
        return this.#ARAnchor.group.visible; // Check if the AR anchor group is visible
    }

    /**
     * Starts the AR session
     * @returns {Promise<void>}
     */
    start() {
        this.arSys.start(); 
    }

    /**
     * Access the MindARThree renderer
     * @returns {THREE.WebGLRenderer}
     */
    get renderer() {
        return this.ARRenderer;
    }

    /**
     * Updates the AR system, on every cycle
     */
    async updateAR(callback = () => {}) {
        this.#getWorldQuaternion();         // Update the world quaternion before rendering
        callback(); // Call the callback if provided
    }

    #showAR() {
        this.#ARAnchor.group.visible = true; // Show the AR anchor group
        this.ARScene.visible = true; // Show the AR scene
    }

    #hideAR() {
        this.#ARAnchor.group.visible = false; // Hide the AR anchor group
        this.ARScene.visible = false; // Hide the AR scene
    }



    #showOverlay() {
        this.hoverScene.visible = true; // Show the hover scene
    }

    #hideOverlay() {
        this.hoverScene.visible = false; // Hide the hover scene
    }


    registerOrientationObserver(observer) {
        if (typeof observer !== 'object' || !observer.updateOrientation) {
            console.error("Observer must be an object with an updateOrientation method.");
            return;
        }
        this.notifyOrientationList.push(observer); // Add the observer to the list
    }

    unregisterOrientationObserver(observer) {
        const index = this.notifyOrientationList.indexOf(observer);
        if (index !== -1) {
            this.notifyOrientationList.splice(index, 1); // Remove the observer from the list
        } else {
            console.warn("Observer not found in the list.");
        }
    }


    async render() {   /*
        if (this.viewAR) {
            this.#showAR(); // Show the AR scene
        } else {
            this.#hideAR(); // Hide the AR scene
        }
        if (this.viewOverlay) {
            this.#showOverlay(); // Show the overlay scene
        } else {
            this.#hideOverlay(); // Hide the overlay scene
        }
        */
        await this.updateAR(); // Update the AR and overlay orientation and direction arrow
        
        this.ARRenderer.clear();  
        this.ARRenderer.clearDepth();
        this.ARRenderer.render(this.ARScene, this.ARCamera);
        this.ARRenderer.render(this.hoverScene, this.hoverCamera);
    }  
}