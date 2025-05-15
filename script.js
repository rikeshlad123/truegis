
const map = L.map('map').setView([54.5, -3], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function printPDF() {
  const { jsPDF } = window.jspdf;
  const { print, downloadBlob } = window.inkmap;

  const center = map.getCenter();
  const bounds = map.getBounds();
  const width = document.getElementById('map').clientWidth;
  const height = document.getElementById('map').clientHeight;

  const latLngBounds = [
    [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
    [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
  ];

  const printSpec = {
    dpi: 150,
    size: [277, 160, 'mm'],
    projection: 'EPSG:3857',
    center: [center.lng, center.lat],
    scale: calculateScale(bounds, width),
    layers: [{
      type: 'XYZ',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors'
    }],
    scaleBar: true,
    northArrow: true
  };

  const imageBlob = await print(printSpec);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const imageUrl = URL.createObjectURL(imageBlob);
  const img = new Image();
  img.src = imageUrl;
  img.onload = () => {
    pdf.addImage(img, 'JPEG', 10, 30, 277, 160);
    pdf.text('TrueGIS Export', 148.5, 15, null, null, 'center');
    pdf.save('truegis-map-export.pdf');
  };
}

// Estimate scale based on bounds and pixel width (simplified)
function calculateScale(bounds, pixelWidth) {
  const metersPerPixel = 156543.03392 * Math.cos(bounds.getCenter().lat * Math.PI / 180) / Math.pow(2, map.getZoom());
  const widthMeters = pixelWidth * metersPerPixel;
  const scaleDenominator = widthMeters * 1000 / 277;
  return scaleDenominator;
}
