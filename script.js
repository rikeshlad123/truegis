import("https://html2canvas.hertzen.com/dist/html2canvas.min.js").then(() => {
var map = L.map('map').setView([54.5, -3], 6);

// Basemaps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18, attribution: '© OpenStreetMap contributors'
}).addTo(map);

var carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CartoDB'
});

var satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains:['mt0','mt1','mt2','mt3'],
  attribution: '&copy; Google'
});

// Draw layer
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  draw: { polygon: true, polyline: true, rectangle: true, circle: true, marker: true },
  edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
  drawnItems.addLayer(e.layer);
});

// GeoJSON import
document.getElementById('geojsonUpload').addEventListener('change', function(e) {
  var reader = new FileReader();
  reader.onload = function() {
    var data = JSON.parse(reader.result);
    L.geoJSON(data).addTo(map);
  };
  reader.readAsText(e.target.files[0]);
});

// GeoJSON export
function downloadGeoJSON() {
  var data = drawnItems.toGeoJSON();
  var blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'drawn_features.geojson';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// PDF Print
function printMap() {
  html2canvas(document.getElementById('map')).then(canvas => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 10, 10, 190, 130);
    pdf.save("map.pdf");
  });
}

// Constraint overlays (dummy)
var sssiLayer = L.geoJSON(sssiData, { style: { color: "green", fillOpacity: 0.3 }}).addTo(map);
var sacLayer = L.geoJSON(sacData, { style: { color: "purple", fillOpacity: 0.3 }});

var baseMaps = { "OSM": osm, "Carto": carto, "Satellite": satellite };
var overlayMaps = { "SSSI": sssiLayer, "SAC": sacLayer, "Drawn Items": drawnItems };
L.control.layers(baseMaps, overlayMaps).addTo(map);
});