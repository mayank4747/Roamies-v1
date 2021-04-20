
const goodCampground = JSON.parse(campground);

mapboxgl.accessToken = maptoken;
  const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: goodCampground.geometry.coordinates,//[77.404636, 23.214768], // starting position [lng, lat]
  zoom: 12 // starting zoom
  });


  new mapboxgl.Marker()
    .setLngLat(goodCampground.geometry.coordinates)
     .setPopup(
    new mapboxgl.Popup({offset : 25})
    .setHTML(
        `<h3>${goodCampground.location}</h3>`
            )
       )
      .addTo(map);