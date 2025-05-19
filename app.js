window.onload = function () {
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });

  const map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({ source: new ol.source.OSM() }),
      vectorLayer
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([-0.1, 51.5]),
      zoom: 13
    })
  });

  let drawInteraction = null;

  function activateDraw(type) {
    if (drawInteraction) map.removeInteraction(drawInteraction);

    drawInteraction = new ol.interaction.Draw({ source: vectorSource, type });
    drawInteraction.on('drawend', function (e) {
      const geom = e.feature.getGeometry();
      if (!geom || !geom.getCoordinates?.().length) {
        vectorSource.removeFeature(e.feature);
      }
    });

    map.addInteraction(drawInteraction);
  }

  document.getElementById('drawPoint').onclick = () => activateDraw('Point');
  document.getElementById('drawLine').onclick = () => activateDraw('LineString');
  document.getElementById('drawPolygon').onclick = () => activateDraw('Polygon');
  document.getElementById('clear').onclick = () => {
    vectorSource.clear();
    updatePreviewRectangle();
  };

  let previewFeature = null;

  const PAPER_WIDTH_MM = 277;
  const PAPER_HEIGHT_MM = 170;
  const DPI = 150;

  function updatePreviewRectangle() {
    if (previewFeature) vectorSource.removeFeature(previewFeature);

    const scale = parseInt(document.getElementById('scale').value);
    const center = map.getView().getCenter();

    if (!center || center.length !== 2 || !isFinite(center[0]) || !isFinite(center[1])) {
      map.getView().setCenter(ol.proj.fromLonLat([-0.1, 51.5]));
      return;
    }

    const metersPerMM = scale / 1000;
    const paperWidthMeters = PAPER_WIDTH_MM * metersPerMM;
    const paperHeightMeters = PAPER_HEIGHT_MM * metersPerMM;

    const extent = [
      center[0] - paperWidthMeters / 2,
      center[1] - paperHeightMeters / 2,
      center[0] + paperWidthMeters / 2,
      center[1] + paperHeightMeters / 2
    ];

    previewFeature = new ol.Feature(new ol.geom.Polygon.fromExtent(extent));
    previewFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({ color: 'red', width: 2, lineDash: [4] }),
      fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.1)' })
    }));

    vectorSource.addFeature(previewFeature);
  }

  function makeSpec(center, scale) {
    const features = vectorSource.getFeatures().filter(f => {
      if (f === previewFeature) return false;
      const geom = f.getGeometry?.();
      const coords = geom?.getCoordinates?.();
      return geom && coords && coords.length > 0;
    });

    const layers = [
      {
        type: 'XYZ',
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap (www.openstreetmap.org)'
      }
    ];

    const geojsonFormat = new ol.format.GeoJSON();
    const geojson = geojsonFormat.writeFeaturesObject(features);

    if (geojson?.features?.length > 0) {
      layers.push({
        type: 'GeoJSON',
        geojson,
        style: {
          name: 'Clean SLD Style',
          rules: [
            {
              symbolizers: [
                {
                  kind: 'Polygon',
                  color: '#0000ff',
                  fillColor: '#87CEFA',
                  fillOpacity: 0.4,
                  width: 2
                },
                {
                  kind: 'Line',
                  color: '#ff0000',
                  width: 3
                },
                {
                  kind: 'Mark',
                  wellKnownName: 'circle',
                  color: '#000000',
                  radius: 6,
                  fillColor: '#ffff00',
                  fillOpacity: 1
                }
              ]
            }
          ]
        }
      });
    }

    const isValidCenter = Array.isArray(center) &&
      center.length === 2 &&
      isFinite(center[0]) &&
      isFinite(center[1]);

    return {
      layers,
      size: [PAPER_WIDTH_MM, PAPER_HEIGHT_MM, 'mm'],
      center: isValidCenter ? center : ol.proj.fromLonLat([-0.1, 51.5]),
      dpi: DPI,
      scale: scale || 10000,
      projection: 'EPSG:3857',
      scaleBar: { position: 'bottom-left', units: 'metric' },
      northArrow: 'top-right',
      attributions: 'bottom-right'
    };
  }

  document.getElementById('scale').onchange = updatePreviewRectangle;
  map.getView().on('change:center', updatePreviewRectangle);
  map.getView().on('change:resolution', updatePreviewRectangle);
  updatePreviewRectangle();

  document.getElementById('print').onclick = async () => {
    if (!previewFeature) return alert("No print preview available");
    const extent = previewFeature.getGeometry().getExtent();
    const center = ol.proj.toLonLat(ol.extent.getCenter(extent));
    const scale = parseInt(document.getElementById('scale').value);
    const spec = makeSpec(center, scale);
    try {
      const blob = await inkmap.print(spec);
      document.getElementById('output').src = URL.createObjectURL(blob);
    } catch (err) {
      console.error("Print failed:", err);
      alert("Printing failed. See console.");
    }
  };

  document.getElementById('print-pdf').onclick = async () => {
    if (!previewFeature) return alert("No print preview available");

    const extent = previewFeature.getGeometry().getExtent();
    const center = ol.proj.toLonLat(ol.extent.getCenter(extent));
    const scale = parseInt(document.getElementById('scale').value);
    const spec = makeSpec(center, scale);

    try {
      const blob = await inkmap.print(spec);
      const { jsPDF } = window.jspdf;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
      });

      const imgUrl = URL.createObjectURL(blob);

      const marginX = 15;
      const titleY = 20;
      const mapY = 30;
      const mapWidth = PAPER_WIDTH_MM;
      const mapHeight = PAPER_HEIGHT_MM;
      const footerY = 200;

      doc.addImage(imgUrl, 'JPEG', marginX, mapY, mapWidth, mapHeight);

      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.text('The TrueGIS True Print', 148.5, titleY, { align: 'center' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(`Printed: ${new Date().toLocaleString()}`, marginX, footerY);
      doc.text('© OpenStreetMap contributors', 297 - marginX, footerY, { align: 'right' });

      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY + 2, 297 - marginX, footerY + 2);

      doc.save('map-export.pdf');
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. See console.");
    }
  };
};
