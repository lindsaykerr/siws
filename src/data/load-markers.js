

export default class LoadWaypoints {

    async #getWaypointsList(route){
        const baseUrl = this.#baseUrl; 

        return fetch(
            `${baseUrl}/get-points/${route}/`, 
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            }).then((result) => {
                if (result.ok) {

                    return result.json().then((data) => {
                        return data;
                    }).catch((error) => {
                        throw Error(`Error parsing JSON:", ${error}`);
                    });
                    
                } else if (result.status === 404) {
                    throw Error(`Route ${route} not found. Please check the route name.`);
                } else {
                    throw Error("No server response");
                }
            }
        );
    }   
    #baseUrl = null; 
    
    constructor(baseUrl) {
        this.markers = [];
        if (!baseUrl) {
            throw Error("Base URL is required to load markers.");
        }
        this.#baseUrl = baseUrl;
    }

    async downloadWaypoints(route) {
        if (!route) {
            throw Error("Route name is required to download waypoints.");
        }
        return await this.#getWaypointsList(route).then((waypoints) => {
            
            return waypoints;
        }).catch((error) => {
            console.error("Error loading waypoints:", error);
            return false;
        });
    }
}