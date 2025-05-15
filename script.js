
const map = L.map('map').setView([54.5, -3], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const { jsPDF } = window.jspdf;

// A - html2canvas
window.printA = function () {
  html2canvas(document.getElementById('map')).then(canvas => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 10, 30, 277, 160);
    pdf.text('A. html2canvas', 148.5, 15, null, null, 'center');
    pdf.save('printA.pdf');
  });
};

// B - html2canvas with tile wait
window.printB = function () {
  const tiles = document.querySelectorAll(".leaflet-tile");
  let loaded = 0;
  tiles.forEach(tile => {
    if (tile.complete) loaded++;
    else tile.onload = () => {
      loaded++;
      if (loaded === tiles.length) run();
    };
  });
  if (loaded === tiles.length) run();

  function run() {
    html2canvas(document.getElementById('map')).then(canvas => {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 10, 30, 277, 160);
      pdf.text('B. html2canvas + tile load', 148.5, 15, null, null, 'center');
      pdf.save('printB.pdf');
    });
  }
};

// C - Inkmap import()
window.printC = async function () {
  try {
    const { print } = await import('https://unpkg.com/@camptocamp/inkmap/dist/inkmap.es.js');
    const center = map.getCenter();
    const spec = {
      dpi: 150,
      size: [277, 160, 'mm'],
      projection: 'EPSG:3857',
      center: [center.lng, center.lat],
      scale: 50000,
      layers: [{
        type: 'XYZ',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c']
      }],
      scaleBar: true,
      northArrow: true
    };
    const blob = await print(spec);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      pdf.addImage(img, 'JPEG', 10, 30, 277, 160);
      pdf.text('C. Inkmap import()', 148.5, 15, null, null, 'center');
      pdf.save('printC.pdf');
    };
  } catch (e) {
    alert("Inkmap C failed: " + e.message);
  }
};

// D - Inkmap fallback
window.printD = function () {
  const fallback = document.createElement("script");
  fallback.src = "https://unpkg.com/@camptocamp/inkmap/dist/inkmap.umd.js";
  fallback.onload = () => {
    const center = map.getCenter();
    const spec = {
      dpi: 150,
      size: [277, 160, 'mm'],
      projection: 'EPSG:3857',
      center: [center.lng, center.lat],
      scale: 50000,
      layers: [{
        type: 'XYZ',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c']
      }],
      scaleBar: true,
      northArrow: true
    };
    window.inkmap.print(spec).then(blob => {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        pdf.addImage(img, 'JPEG', 10, 30, 277, 160);
        pdf.text('D. Inkmap fallback', 148.5, 15, null, null, 'center');
        pdf.save('printD.pdf');
      };
    }).catch(e => alert("Inkmap D failed: " + e.message));
  };
  document.body.appendChild(fallback);
};

// E - window.print
window.printE = function () {
  window.print();
};

// F - jsPDF only
window.printF = function () {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.text("F. Dummy print works!", 105, 80, null, null, 'center');
  pdf.save('printF.pdf');
};
