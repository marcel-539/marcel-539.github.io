const textarea = document.getElementById('expandingTextarea');
const textOutputArea = document.getElementById('textOutputArea');
const maxCharCount = 180;

/**
 * ✅ Dynamisches Wachstum + Zeichenlimit + Shake-Effekt
 */
textarea.addEventListener('input', function () {
    if (this.value.length > maxCharCount) {
        this.value = this.value.slice(0, maxCharCount);
        textarea.classList.add('shake-effect');
        setTimeout(() => {
            textarea.classList.remove('shake-effect');
        }, 300);
    }
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
});

/**
 * ✅ Entfernt den simulierten Cursor bei Fokus
 */
textarea.addEventListener('focus', () => {
    textarea.classList.add('focused');
});

textarea.addEventListener('blur', () => {
    textarea.classList.remove('focused');
});

/**
 * ✅ Funktion zum Erstellen eines Punktes mit Text (inkl. Viewport-Korrektur)
 */
function createGreenDot(text) {
    const dot = document.createElement('div');
    dot.classList.add('green-dot');

    // ✅ Zufällige X-Koordinate mit Randabstand
    const padding = 50;
    const viewportWidth = window.innerWidth;
    const borderOffset = 20;
    const randomX = Math.floor(borderOffset + padding + Math.random() * (viewportWidth - (2 * (borderOffset + padding))));

    // ✅ Punkte über den gesamten unteren Bereich verteilen
    const minY = textarea.offsetTop + textarea.offsetHeight + window.scrollY + padding;
    const maxY = document.body.scrollHeight - padding;
    const textLengthFactor = (text.length / maxCharCount);
    const randomY = minY + textLengthFactor * (maxY - minY);

    // ✅ Punkt platzieren
    dot.style.left = `${randomX}px`;
    dot.style.top = `${randomY}px`;

    // ✅ Text-Element erstellen (Mehrzeilig + Datumsanzeige)
    const textElement = document.createElement('div');
    textElement.classList.add('dot-text');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('de-DE');
    const formattedTime = now.toLocaleTimeString('de-DE');
    textElement.innerHTML = `${text}<br><br><span class="timestamp">${formattedDate} | ${formattedTime}</span>`;
    textElement.style.left = `${randomX + 20}px`;
    textElement.style.top = `${randomY - 5}px`;
    textElement.style.display = 'none';

    // ✅ Punkt & Text zum Container hinzufügen
    textOutputArea.appendChild(dot);
    textOutputArea.appendChild(textElement);

    // ✅ Klick-Event für den Punkt (Text ein- und ausblenden)
    dot.addEventListener('click', () => {
        if (textElement.style.display === 'none') {
            textElement.style.display = 'block';
            textElement.style.opacity = 0;
            textElement.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                textElement.style.opacity = 1;
            }, 10);

            // ✅ Fix: Text bleibt im Viewport sichtbar
            const textRect = textElement.getBoundingClientRect();
            if (textRect.bottom > window.innerHeight) {
                textElement.style.top = `${window.innerHeight - textRect.height - 20}px`;
            }
        } else {
            textElement.style.opacity = 0;
            setTimeout(() => {
                textElement.style.display = 'none';
            }, 300);
        }
    });

    // ✅ Automatisch zum Punkt scrollen
    dot.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * ✅ ENTER-Taste zum Absenden des Textes & Punktgenerierung
 */
textarea.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const userInput = textarea.value.trim();
        if (userInput !== "") {
            createGreenDot(userInput);
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    }
});

/**
 * ✅ Funktion zum Aktualisieren der Uhrzeit & Datum (rechts oben)
 */
function updateDateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('de-DE');
    const formattedTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // ✅ HTML-Elemente aktualisieren
    document.getElementById('current-date').textContent = formattedDate;
    document.getElementById('current-time').textContent = formattedTime;
}

// ✅ Uhrzeit & Datum jede Sekunde aktualisieren
setInterval(updateDateTime, 1000);

// ✅ Initial beim Laden anzeigen
updateDateTime();

document.addEventListener('DOMContentLoaded', () => {
  const logoDot = document.querySelector('.logo-dot');
  const logoText = document.getElementById('logo-text');
  const nemoImage = document.getElementById('nemo-image');

  // ✅ Einheitliche Kontrolle für Text und Bild
  logoDot.addEventListener('click', () => {
      const isVisible = logoText.style.display === 'block';

      if (!isVisible) {
          logoText.style.display = 'block';
          nemoImage.style.display = 'block'; 
      } else {
          logoText.style.display = 'none';
          nemoImage.style.display = 'none';
      }
  });
});


