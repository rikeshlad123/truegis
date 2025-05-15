const map = L.map('map').setView([54.5, -3], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function printPDF() {
  try {
    const { print, downloadBlob } = await import('https://unpkg.com/@camptocamp/inkmap/dist/inkmap.es.js');
    const { jsPDF } = window.jspdf;

    const center = map.getCenter();
    const bounds = map.getBounds();
    const width = document.getElementById('map').clientWidth;

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

    const img = new Image();
    img.src = URL.createObjectURL(imageBlob);
    img.onload = () => {
      pdf.addImage(img, 'JPEG', 10, 30, 277, 160);
      pdf.text('TrueGIS Export', 148.5, 15, null, null, 'center');
      pdf.save('truegis-map-export.pdf');
    };

  } catch (e) {
    alert("Inkmap failed to load. Make sure you're online and using a modern browser.");
    console.error(e);
  }
}

function calculateScale(bounds, pixelWidth) {
  const metersPerPixel = 156543.03392 * Math.cos(bounds.getCenter().lat * Math.PI / 180) / Math.pow(2, map.getZoom());
  const widthMeters = pixelWidth * metersPerPixel;
  return widthMeters * 1000 / 277;
}
