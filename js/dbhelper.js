
console.log("this is the DBHelper js");

 // IndexedDB Helper Functions
var idbApplication = (function() {
  'use strict';

  if (!('indexedDB' in window)) {
    console.log('browser does not support IDB');
    return;
  }

  // creates IDB store
  const dbPromise = idb.open("mws-restaurant", 1, upgradeDB => {

      switch (upgradeDB.oldVersion) {
        case 0:
            upgradeDB.createObjectStore("restaurants", { keyPath: 'id' });
            //store the restaurants in IDB
            storeRestaurants();
        /* for stage 3
        case 1:
        {
        }
         */
      } // switch
    }); //end of function

  // Stores the Restaurant Data into IndexedDB Existing Databases
  function storeRestaurants() {

    let fetchURL = DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL)
    // parse the response to JSON
    .then(function (response) {
      return response.json();
      })
    // put JSON data in restaurants
    .then (function(restaurants){
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant)
        });
      });
      // now return it
      callback(null, restaurants);
      })
    .catch(function (err) {
        const error = (`Unable to store restaurants data ${err}`);
      });
  } // end of function

  // Returns Restaurants in the IndexedDB database
  function getRestaurants() {
    return dbPromise.then(function(db) {
      var tx = db.transaction('restaurants', 'readonly');
      var store = tx.objectStore('restaurants');
      return store.getAll();
    });
   } // end of function

  return {
    dbPromise: (dbPromise),
    storeRestaurants: (storeRestaurants),
    getRestaurants: (getRestaurants)
    //for stage 3:
    //storeReviews: (storeReviews),
    //getReviews: (getReviews)
  };
})();
// End of IDB


// Common DB helper functions
class DBHelper {
  // Database URL.
  static get DATABASE_RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  //fetch
  static fetchRestaurants(callback) {
    // Try to Get the Restaurants from IDB first
    idbApplication.getRestaurants().then(function(restaurants){
      return restaurants;
    });

  // No restaurants in IndexDB
  // Fetch, Then Store in IndexedDB

    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL, {method: "GET"})
    .then(response => {
      response.json()
      .then(restaurants => {
          callback(null, restaurants);
      });
    }).catch(error => {
      const message = (`Request failed. Error status ${error.message}`);
      callback(message, null);
    });
  }


  static fetchNeighborhoods(callback) {

    // Get Neighborhoods from IDB first
    idbApplication.getRestaurants().then(function(restaurants){
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

      return fetchedNeighborhoods;
    });

    // No restaurants in IDB
    // Fetch, Then Store in IDB

    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL, {method: "GET"}).then(response => {
      response
        .json()
        .then(restaurants => {

        // Store Restaurants in IndexDB
        idbApplication.storeRestaurants();

        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

        callback(null, fetchedNeighborhoods);
        });
    }).catch(error => {
      const message = (`Request failed. Returned status of ${error.message}`);
      callback(message, null);
    });
  } // end of method
  /*
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else {
          callback(`Restaurant with ID ${id} does not exist`, null);
        }
      }
    });
  }

  /*
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
        // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
        // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }


  /*
   * Fetch all cuisines in order to prefill restaurantCuisines
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  } // end of method

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
      if (restaurant.photograph == undefined) {
            restaurant.photograph = restaurant.id;
      }
      return (`/img/${restaurant.photograph}` + ".jpg");
  }

  static smallImageUrlForRestaurant(restaurant) {
      if (restaurant.photograph == undefined) {
            restaurant.photograph = restaurant.id;
      }
      return (`/img/${restaurant.photograph}_320` + ".jpg");
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
