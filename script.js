
const map = L.map('map').setView([54.5, -3], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Pre-simulated buttons
window.printMapA = () => alert('Print A executed: Prebuilt layout (standard A4 PDF)');
window.printMapB = () => alert('Print B executed: Includes map + label text.');
window.printMapC = () => alert('Print C executed: Inkmap variant with portrait layout.');
