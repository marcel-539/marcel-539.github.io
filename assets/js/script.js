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
 * ✅ Funktion zum Erstellen eines grünen Punktes mit Datum & Uhrzeit (ohne Emojis)
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

    // ✅ Aktuelles Datum und Uhrzeit holen (ohne Emojis)
    const now = new Date();
    const formattedDate = now.toLocaleDateString('de-DE');
    const formattedTime = now.toLocaleTimeString('de-DE');

    // ✅ Text-Element direkt am Punkt hinzufügen (MEHRZEILIG + DATUM/UHRZEIT)
    const textElement = document.createElement('div');
    textElement.classList.add('dot-text');
    textElement.innerHTML = `${text}<br><br><span class="timestamp">${formattedDate} | ${formattedTime}</span>`;
    textElement.style.left = `${randomX + 20}px`;
    textElement.style.top = `${randomY - 5}px`;
    textElement.style.display = 'none';

    // ✅ Punkt & Text zum Container hinzufügen
    textOutputArea.appendChild(dot);
    textOutputArea.appendChild(textElement);

    // ✅ Klick: Text ein- und ausblenden
    dot.addEventListener('click', () => {
        if (textElement.style.display === 'none') {
            textElement.style.display = 'block';
            textElement.style.opacity = 0;
            textElement.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                textElement.style.opacity = 1;
            }, 10);
        } else {
            textElement.style.opacity = 0;
            setTimeout(() => {
                textElement.style.display = 'none';
            }, 300);
        }
    });

    // ✅ Automatisch zum neuen Punkt scrollen
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
