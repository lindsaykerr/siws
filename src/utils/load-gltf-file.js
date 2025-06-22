import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';




/**
 * Loads a GLTF file an wraps it within a Three.js group.
 * @param {string} filePath 
 * @returns {Promise<THREE.Group>}
 */
export default async function loadFromGTLF(filePath) {

    return await new Promise((resolve, reject) => {

        new GLTFLoader().load(filePath, (gltf) => {
            console.log("3D scene from file loaded.");
            resolve(gltf.scene);
        }, undefined, (error) => {
            console.error('An error happened while loading the GLTF model:', error);
            reject(error);
        });

    });
}
