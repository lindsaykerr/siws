import ARGraphics from "./ar-graphics";
import * as THREE from 'three';

/**
 * NavIcon class handles the navigation icon in the AR scene.
 * It manages the orientation of the icon based on the AR scene orientation 
 * 
 * 
 * _Methods:_
 *  - **constructor(arGraphics)** - Initializes the NavIcon with the provided ARGraphics instance.
 *  - **updateOrientation(orientation)** - Updates the orientation of the navigation icon based on the provided quaternion.
 *  - **detachAll()** - Detaches the NavIcon instance from the ARGraphics instance and removes the icon from the scene.
 *  - **offsetRotation(degrees)** - Offsets the existing icon's rotation by a specified number of degrees.
 *  - **hide()** - Hides the navigation icon.
 *  - **show()** - Shows the navigation icon.
 *  - **setIconParameters(iconParam)** - Sets the parameters for the navigation icon, including position, rotation, and scale.
 *  - **setIcon(icon)** - Sets the icon for the navigation pointer. The icon must be an instance of THREE.Object3D.
 */
export default class NavIcon {

    //////////////////////////////////////
    /// Private Fields and methods

    #ARGraphics;        // Reference to the ARGraphics instance
    #AROrientation;     // Reference to the AR orientation quaternion

    /** @type {THREE.Object3D} */
    icon = null;        // The direction arrow object
    navGroup;           // Group for the pointer arrow
    ready = false;      // Flag to indicate if the icon is ready

    /**
     * Finalizes the setup of the NavIcon instance. 
     */    
    #finalize() {

        this.ready = true; // Set the ready flag to true
        this.#updateIconDirection(); // Update the icon direction based on the current AR orientation
        console.log("NavIcon is ready and orientation updated.");
    }

    /**
     * Sets up the direction group for the navigation icon.
     * This group is used to hold the navigation icon and manage its orientation in the AR scene
     */
    #setupDirectionGroup() {
  

        // Traverse the scene to find the direction group
        let navGroup = null;                
        this.scene.traverse((child) => {
            if (child.isGroup && child.name === "direction-group") {
                navGroup = child;           
                this.navGroup = navGroup;   
                return true;               
            }
            return false;                  
        });

        // if group does not exist, make it
        if (!navGroup) {
            this.navGroup = new THREE.Group();          
            this.navGroup.name = "direction-group";    
            this.scene.add(this.navGroup);
        }
    }

    /**
     * Updates the direction of the navigation icon based on the AR orientation, and also smooths
     * out the transition, preventing abrupt changes in direction. 
     */
    #updateIconDirection() {
        const smoothed = this.navGroup.quaternion.slerp(
            this.#AROrientation, 0.1
        );                                                      
        this.navGroup.rotation.setFromQuaternion(
            new THREE.Quaternion(0, smoothed.y, 0, smoothed.w)
        );                                                     
    }


    //////////////////////////////////////
    /// Public Methods and Properties

    /**
     * Creates an instance of the NavIcon class. This class allow for an object to be used as a 
     * navigation icon in the AR scene. The direction of icon is based on the orientation derived 
     * from the ARGraphics instance.  
     * @param {ARGraphics} arGraphics
     * 
     * @throws {Error} If the provided ARGraphics instance is invalid or not an instance of ARGraphics.
     * @throws {Error} If the provided scene is not a valid THREE.Scene instance.
     */
    constructor(arGraphics) {
        // assign the ARGraphics instance to the private field
        if (!arGraphics || !(arGraphics instanceof ARGraphics)) {
            throw new Error("Invalid ARGraphics instance provided to NavIcon constructor.");
        }
        this.#ARGraphics = arGraphics;

        // Initialize the AR orientation quaternion
        this.#AROrientation = new THREE.Quaternion(0, 0, 0, 1);
        
        // the hover scene is used for UI elements, and is the place where the NavIcon will be rendered
        /** @type {THREE.Scene} */
        this.scene = arGraphics.hoverScene;                     // Use the hover scene for UI elements
        if (!this.scene || !(this.scene instanceof THREE.Scene)) {
            throw new Error("Invalid scene provided to NavIcon constructor.");
        } 
       
        // Registering as an orientation observer allows for the orientation of the NavIcon to be updated 
        this.#ARGraphics.registerOrientationObserver(this);     
        
        // Ensure that the hover scene has a navigation icon group
        this.#setupDirectionGroup();

        // Last thing is to update the icon direction based on the current AR orientation
        // and flag the NavIcon as ready.                         
        this.#finalize();                                         
    }

    /**
     * Update the orientation of the navigation icon based on the provided quaternion.
     * @param {THREE.Quaternion} orientation 
     */
    updateOrientation(orientation) {
        if (!this.ready || isNaN(orientation.x) || isNaN(orientation.y) || isNaN(orientation.z)) {
            return;
        }
        
        this.#AROrientation.copy(orientation); // Update the AR orientation with the new quaternion
        
        this.#updateIconDirection(); // Update the direction arrow based on the new orientation
    }

    resetOrientation() {
        this.#AROrientation.set(0, 0, 0, 1); // Reset the AR orientation to the default quaternion
        this.#updateIconDirection(); // Update the direction arrow based on the reset orientation
        console.log("NavIcon orientation reset to default.");
    }

    /**
     * Used to detach the NavIcon instance from the ARGraphics instance and remove the icon from the scene.
     * If there is no longer a need for the NavIcon, this method can be called to clean up resources. An prevent any
     * zombie instances from lingering in memory.
     */
    detachAll() {
        this.#ARGraphics.unregisterOrientationObserver(this); // Unregister this instance from the ARGraphics orientation observers
        if (this.icon) {
            this.navGroup.remove(this.icon); // Remove the icon from the pointer group
            this.icon = null; // Clear the icon reference
        }
        this.navGroup.clear(); // Clear the pointer group
        this.navGroup.visible = false; // Hide the pointer group
        console.log("All icons and observers detached from NavIcon.");        
    }

    /**
     * Is used to offset the existing icon's rotation by a specified number of degrees.
     * Primarily used to adjust the rotation around the y axis of the nav icon in relation 
     * to the AR marker's orientation. 
     * @param {number} degrees 
     * @returns 
     */
    offsetRotation(degrees = 0) {
        if (!this.icon) {
            return;
        }
        // degrees to quaternion conversion
        const radians = THREE.MathUtils.degToRad(degrees); // Convert degrees to radians
        this.icon.rotation.y = radians; // Update the icon's rotation based
    }

    /**
     * Hides the navigation icon by setting the visibility of the navigation pointer group to false.
     */
    hide() {
        if (this.navGroup) {
            this.navGroup.visible = false; // Hide the pointer group
        }
    }

    /**
     * Shows the navigation icon by setting the visibility of the navigation pointer group to true.
     */
    show() {
        if (this.navGroup) {
            this.navGroup.visible = true; // Show the pointer group
        }
    }

    /**
     * Sets the parameters for the navigation icon, including position, rotation, and scale.
     * If the icon is not loaded yet, it will log a warning and not apply the parameters.
     * @param {Object} iconParam - The parameters for the icon.
     * @param {{x: number, y:number, z:number}} iconParam.position - The position of the icon in 3D space.
     * @param {{x: number, y:number, z:number}} iconParam.rotation - The rotation of the icon in radians.
     * @param {{x: number, y:number, z:number}} iconParam.scale - The scale of the icon in 3D space.
     */
    setIconParameters(iconParam = {
        position: { x: 0, y: -0.5, z: 0 },
        rotation: { x: Math.PI / 8, y: 0, z: 0 },
        scale: { x: 1.5, y: 1.5, z: 1.5 }
    }) {
        if (!this.icon) {
            console.warn("Icon is not loaded yet. Cannot set parameters.");
            return;
        }
        if (iconParam.position) {
            this.icon.position.set(iconParam.position.x, iconParam.position.y, iconParam.position.z);
        }
        if (iconParam.rotation) {
            this.icon.rotation.set(iconParam.rotation.x, iconParam.rotation.y, iconParam.rotation.z);
        }
        if (iconParam.scale) {
            this.icon.scale.set(iconParam.scale.x, iconParam.scale.y, iconParam.scale.z);
        }
    }

    /**
     * Sets the icon for the navigation pointer. The icon must be an instance of THREE.Object3D.
     * If the icon is not valid, it will log an error and not set the icon.
     * @param {THREE.Object3D} icon - The icon to be set for the navigation pointer.
     */
    setIcon(icon) {
        if (!icon) {
            console.error("Invalid icon: Icon cannot be null or undefined");
            return;
        }
        if (!icon instanceof THREE.Object3D) {

            console.error("Invalid icon: Must be an instance of THREE.Object3D");
            return;
        }

        this.icon = icon; // Set the icon to the provided object
        this.icon.name = "NavIcon"; // Name the icon for easier identification
        this.navGroup.add(this.icon); // Add the icon to the pointer group

        this.setIconParameters(); // Set default parameters for the icon
    }
}