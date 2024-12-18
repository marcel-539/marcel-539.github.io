const imageContainer = document.querySelector('.image-container');
const image = document.getElementById('image');
const viewport = document.querySelector('.viewport');

let isDragging = false;
let startX, startY, initialX, initialY;

// Event für den Start des Ziehens
imageContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  const computedStyle = window.getComputedStyle(imageContainer);
  initialX = parseInt(computedStyle.left) || 0;
  initialY = parseInt(computedStyle.top) || 0;
  imageContainer.style.cursor = 'grabbing';
});

// Event für das Ziehen des Bildes
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  // Berechnete neue Position
  let newX = initialX + deltaX;
  let newY = initialY + deltaY;

  // Grenzen berechnen, um das Bild innerhalb des Viewports zu halten
  const viewportRect = viewport.getBoundingClientRect();
  const imageRect = image.getBoundingClientRect();

  const minX = viewportRect.width - imageRect.width;
  const minY = viewportRect.height - imageRect.height;

  // Begrenzen der Position
  newX = Math.min(0, Math.max(minX, newX));
  newY = Math.min(0, Math.max(minY, newY));

  imageContainer.style.left = `${newX}px`;
  imageContainer.style.top = `${newY}px`;
});

// Event für das Beenden des Ziehens
document.addEventListener('mouseup', () => {
  isDragging = false;
  imageContainer.style.cursor = 'grab';
});

// Falls die Maus den Browserbereich verlässt
document.addEventListener('mouseleave', () => {
  isDragging = false;
  imageContainer.style.cursor = 'grab';
});

// Verhindert das Standard-Drag-Verhalten des Bildes
image.addEventListener('dragstart', (e) => {
  e.preventDefault();
});
