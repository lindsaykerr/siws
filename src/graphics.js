import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';



export default class ARWayfindingGraphics {

    scene;    // scene from MindARThree
    camera;   // camera from MindARThree 
    renderer; // Get the renderer from MindARThree
    anchor; 

    #getWorldQuaternion() {
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        this.anchor.group.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
        
        this.refAROrientation.copy(worldQuaternion)
        if (worldQuaternion.x === 0 && worldQuaternion.y === 0 && worldQuaternion.z === 0) {
           
            this.refAROrientation.set(0, 0, 0, 1); // Reset to default quaternion
           
             // Hide the direction arrow if the quaternion is zero                   
        }
        else {
            // Show the direction arrow if the quaternion is not zero
        }
           
        this.#updateDirectionArrow(); // Update the direction arrow with the new orientation


    }

    #updateDirectionArrow() {
   
        if (this.refAROrientation.x === 0 && this.refAROrientation.y === 0 && this.refAROrientation.z === 0) {
            this.pointerGroup.visible = false; // Hide the direction arrow if the quaternion is zero
            console.log("Pointer group is hidden due to zero quaternion.");
     
        }

        const smoothed = this.pointerGroup.quaternion.slerp(this.refAROrientation, 0.1); // Smoothly interpolate the rotation

        this.pointerGroup.rotation.setFromQuaternion(new THREE.Quaternion(0, smoothed.y, 0, smoothed.w)); // Set the rotation of the pointer group based on the smoothed quaternion

        console.log("Pointer group rotation set to:", this.pointerGroup.rotation);
         // Set the rotation of the pointer group based on the AR orientation


        /*
        if (this.anchor.group.visible) {      
            const worldPosition = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();
        
            const worldScale = new THREE.Vector3();
            this.anchor.group.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
            this.pointerGroup.quaternion.slerp(new THREE.Quaternion(0, worldQuaternion.y, 0, 1), 0.1); // Smoothly interpolate the rotation
        }
            */

    }
    /////////////////////////////////////////////////
    /// Private methods for setting up the AR system
    //////////

    #setupARsystem() {
        this.scene  = this.arSys.scene;    // scene from MindARThree
        this.camera = this.arSys.camera;   // camera from MindARThree 
        this.#setupCamera();
        this.renderer   = this.arSys.renderer; // Get the renderer from MindARThree
        this.#setupRenderer();                  // Config the renderer with the container element size

        // Add first anchor
        this.anchor     = this.arSys.addAnchor(0); 
    }

    #showDEBUGProjection(){

      
        if (!this.DEBUG) return; // Exit if debug mode is not enabled

        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        const projPlane = new THREE.Mesh(geometry, material);
        projPlane.position.set(0, 0, -0.1);
    
        this.anchor.group.add(projPlane)
    }


    #setupRenderer() {
        const width = this.containerElement.offsetWidth;
        const height = this.containerElement.offsetHeight;
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClearDepth = false; // Prevents clearing depth buffer on each fram
        this.renderer.autoClear = false; // Prevents clearing color buffer on each frame
    }

    #setupCamera() {  
        this.camera.aspect = this.containerElement.offsetWidth / this.containerElement.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    #listeners(){
        function update (){
            const width = this.containerElement.offsetWidth;
            const height = this.containerElement.offsetHeight;
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        window.addEventListener('resize', () => {
            update.call(this);
        });
        
    }

    #setupARWorldCapture() {
        this.captureStore = {
            x: [],
            y: [],
            z: [],
            w: [],
        };
        this.captureRate = 3; // Number of captures to average
        this.captureCount = 0; // Counter for captures
        this.refAROrientation = new THREE.Quaternion(0, 0, 0, 1); // Reference for the AR orientation
    }


    async #setup3Dui() {
        this.uiScene = new THREE.Scene();
        this.uiCamera = new THREE.PerspectiveCamera(45, this.containerElement.offsetWidth / this.containerElement.offsetHeight, 0.1, 1000);
        this.uiCamera.position.set(0, 0, 5);
        this.uiScene.add(this.uiCamera);
        console.log("UI Scene and Camera initialized.");
   
        // Load the direction arrow model
        
        
        
        this.#loadDirectionArrow().then(() => {
            console.log("Direction arrow loaded successfully.");
            if (this.direction_arrow) {

                    const uiAmbLight = new THREE.AmbientLight(0xffffff, 1.5); // Ambient light for the overlay scene
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
                    directionalLight.position.set(0, 10, 10).normalize(); // Position the light
                    directionalLight.lookAt(0, 0, 0); // Make sure the light points towards the origin
                    this.uiScene.add(directionalLight);
                
                    uiAmbLight.position.set(0, 10, 0); // Position the light
                    this.uiScene.add(uiAmbLight);

                    this.pointerGroup = new THREE.Group();
                    this.uiScene.add(this.pointerGroup);
                    console.log("Pointer arrow object", this.direction_arrow);
                    this.pointerGroup.add(this.direction_arrow);
            }
        }).catch((error) => {
            console.error('Error loading direction arrow and setting up scene:', error);
        }
        );
    }

    #loadDirectionArrow() {

        return new Promise((resolve, reject) => {
            const gltfLoader = new GLTFLoader();
            gltfLoader.load('./assets/direction_arrow.glb', (gltf) => {
                this.direction_arrow = gltf.scene;
                this.direction_arrow.scale.set(4, 4, 4);
                this.direction_arrow.position.set(0, -1, 0);
                this.direction_arrow.rotation.set(Math.PI / 8, 0, 0); // Rotate the arrow to point upwards
                console.log("Direction arrow loaded successfully.");
                resolve();
            }, undefined, (error) => {
                console.error('An error happened while loading the GLTF model:', error);
                reject(error);
            });
        });
         
    }


    /**
     * 
     * @param {MindARThree} mindarThree 
     * @param {HTMLElement} containerElement 
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

        // Set up the AR world capture properties for orientation tracking                  
        this.#setupARWorldCapture(); 
        
        // Ensure UI is loaded and ready
        this.#setup3Dui(); 

        // Set up event listeners for resizing and other events 
        this.#listeners();    

        // If debug mode is enabled, will show the debug projection

        console.log("ARWayfindingGraphics initialized with MindARThree instance");
   

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
        return this.mindar.renderer;
    }

    renderAll() {
       // Update the world quaternion before rendering
        //console.log(this.refAROrientation);
            
        this.renderer.clear();  
        this.renderer.clearDepth();
        if (this.anchor.group.visible) {
            if (this.pointerGroup) {
                this.pointerGroup.visible = true; // Show the direction arrow if the anchor is visible
            }
            this.scene.visible = true;
            this.renderer.render(this.scene, this.camera); 
        }
        else {
            this.scene.visible = false;
        }
       
        if (this.pointerGroup?.visible) {  
            this.#getWorldQuaternion();  
            this.renderer.render(this.uiScene, this.uiCamera);   
        }
         
    }



  

}