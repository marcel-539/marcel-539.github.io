/******************************************************
 * 0) GLOBALE HILFS-VARIABLEN
 ******************************************************/
// Merkt sich die Keys der neu erstellten Punkte (nur von dir)
let recentlyCreatedKeys = [];

// Speichert Infos zu bereits angezeigten Punkten, 
// damit wir sie bei window.resize neu positionieren können.
let displayedDots = [];

/******************************************************
 * 1) FIREBASE INITIALISIEREN (Globaler Modus)
 ******************************************************/
const firebaseConfig = {
  // Hier deine echten Config-Daten aus der Firebase-Konsole
  apiKey: "AIzaSyB_...",
  authDomain: "text-nemo-cfb3b.firebaseapp.com",
  databaseURL: "https://text-nemo-cfb3b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "text-nemo-cfb3b",
  storageBucket: "text-nemo-cfb3b.appspot.com",
  messagingSenderId: "73092575822",
  appId: "1:73092575822:web:64dbd6e29970a52fb9891f"
};

// Erzeugt globale firebase-App-Instanz
firebase.initializeApp(firebaseConfig);

// Datenbank-Objekt
const database = firebase.database();
// Referenz auf "dots"
const dotsRef = database.ref('dots');

/******************************************************
 * 2) DOM-ELEMENTE & GLOBALE VARS AUS DEINEM CODE
 ******************************************************/
const textarea = document.getElementById('expandingTextarea');
const textOutputArea = document.getElementById('textOutputArea');
const charCounter = document.getElementById('charCounter'); // Neuer Zeichenzähler
const maxCharCount = 180;

/******************************************************
 * 3) TEXTAREA-LOGIK (Zeichenlimit, Shake, etc.)
 ******************************************************/
// Dynamisches Wachstum + Zeichenlimit + Shake-Effekt
textarea.addEventListener('input', function () {
  const currentLength = this.value.length;
  
  if (currentLength > maxCharCount) {
    this.value = this.value.slice(0, maxCharCount);
    textarea.classList.add('shake-effect');
    setTimeout(() => {
      textarea.classList.remove('shake-effect');
    }, 300);
  }
  
  // Höhe an Inhalt anpassen
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;
  
  // Aktualisiere den Zeichenzähler
  charCounter.textContent = `${this.value.length}/${maxCharCount}`;
});

// Entfernt den simulierten Cursor bei Fokus
textarea.addEventListener('focus', () => {
  textarea.classList.add('focused');
});
textarea.addEventListener('blur', () => {
  textarea.classList.remove('focused');
});

/******************************************************
 * 4) FUNKTION adjustScrollContainerHeight
 *    -> Passt die Mindesthöhe des Scroll-Containers an
 ******************************************************/
function adjustScrollContainerHeight(yPixel) {
  const scrollContainer = document.getElementById('scrollContainer');
  const currentMinHeight = scrollContainer.clientHeight;
  
  // yPixel + 200 als "Puffer"
  if (yPixel + 200 > currentMinHeight) {
    scrollContainer.style.minHeight = `${yPixel + 200}px`;
    console.log(`ScrollContainer minHeight angepasst auf: ${yPixel + 200}px`);
  }
}

/******************************************************
 * 5) FUNKTION createGreenDot (NEU mit xRatio, yRatio)
 *    -> Erzeugt einen grünen Punkt + zugehöriges Textfeld
 *    -> Scrollen nur, wenn shouldScroll = true
 *    -> "submissionTimestamp" zeigt Datum/Uhrzeit der Erstellung
 ******************************************************/
function createGreenDot(text, xRatio, yRatio, shouldScroll = false, submissionTimestamp = null) {
    console.log(`Creating dot with ratio (xRatio=${xRatio}, yRatio=${yRatio})`);

    // Containergröße holen
    const scrollContainer = document.getElementById('scrollContainer');
    const containerWidth = scrollContainer.clientWidth;
    const containerHeight = scrollContainer.clientHeight;
    
    // Ratios in Pixel umrechnen
    let xPixel = xRatio * containerWidth;
    let yPixel = yRatio * containerHeight;
    
    console.log(`Converted to pixels: (x=${xPixel}, y=${yPixel})`);

    // Punkt-Element erstellen
    const dot = document.createElement('div');
    dot.classList.add('green-dot');
    dot.style.left = `${xPixel}px`;
    dot.style.top  = `${yPixel}px`;

    // Text-Element erstellen
    const textElement = document.createElement('div');
    textElement.classList.add('dot-text');
    textElement.style.left = `${xPixel + 27}px`;
    textElement.style.top  = `${yPixel - 19}px`;
    textElement.style.display = 'none';

    // Datum/Uhrzeit verwenden: Entweder den übergebenen Timestamp 
    // oder zur Not 'jetzt' als Fallback (sollte selten passieren).
    let finalDate = new Date();
    if (submissionTimestamp) {
      finalDate = new Date(submissionTimestamp);
    }
    const formattedDate = finalDate.toLocaleDateString('de-DE');
    const formattedTime = finalDate.toLocaleTimeString('de-DE');

    textElement.innerHTML = 
    `${text}<br><br><span class="timestamp">${formattedDate}<br>${formattedTime}</span>`;
  

    // Punkt & Text ins DOM einfügen innerhalb von #textOutputArea
    textOutputArea.appendChild(dot);
    textOutputArea.appendChild(textElement);

    // Anpassung der Scroll Container Höhe (anhand der yPixel)
    adjustScrollContainerHeight(yPixel);

    // Klick-Event: Text ein-/ausblenden
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

    // Nur scrollen, wenn "shouldScroll" = true
    if (shouldScroll) {
        requestAnimationFrame(() => {
            const rect = dot.getBoundingClientRect();
            const absoluteY = rect.top + window.pageYOffset;
            const scrollToY = absoluteY - (window.innerHeight / 2);
            
            window.scrollTo({
                top: scrollToY,
                behavior: 'smooth'
            });
        });
    }

    // Für dynamisches Resizing speichern wir die Ratios & DOM-Elemente 
    // in displayedDots
    displayedDots.push({
      dotElem: dot,
      textElem: textElement,
      xRatio: xRatio,
      yRatio: yRatio
    });
}

/******************************************************
 * 6) TEXT ABSENDEN (ENTER) => SPEICHERN IN FIREBASE
 *    -> Jetzt speichern wir xRatio, yRatio statt Pixel
 ******************************************************/
textarea.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userInput = textarea.value.trim();
    if (userInput !== "") {
      const scrollContainer = document.getElementById('scrollContainer');
      const containerWidth = scrollContainer.clientWidth;
      const containerHeight = scrollContainer.clientHeight;
      
      // Berechnung des topOffset basierend auf dem Textarea
      const topOffset = textarea.offsetTop + textarea.offsetHeight + 30; // 30px Abstand
      const bottomOffset = 20; // Abstand zum unteren Rand
      const buffer = 450; // Erhöhter Puffer zum unteren Rand (z.B. 450px)

      const minY = topOffset;
      const maxY = containerHeight - bottomOffset - buffer;
      const effectiveMaxY = maxY > minY ? maxY : minY + 100;

      // Textlängenfaktor (0..1)
      const textLengthFactor = Math.min(userInput.length / maxCharCount, 1);
      
      // Rechne Y vorläufig in Pixel
      let yPixel = minY + textLengthFactor * (effectiveMaxY - minY);
      console.log(`Final y-Pixel für den neuen Punkt: ${yPixel}`);

      // NEU: Feste Obergrenze für Y (Beispiel 5000 Pixel)
      const MAX_Y = 58100;
      yPixel = Math.min(yPixel, MAX_Y);
      console.log(`(Gekappter) y-Pixel: ${yPixel}`);

      // Berechnung der X-Koordinate in Pixel mit horizontalem Puffer
      const horizontalBuffer = 50; 
      const leftMargin = horizontalBuffer; 
      const rightMargin = horizontalBuffer;
      const dotWidth = 15; // Breite der Punkte
      
      const minX = leftMargin;
      const maxX = containerWidth - rightMargin - dotWidth;
      let xPixel = Math.floor(minX + Math.random() * (maxX - minX));
      console.log(`Final x-Pixel für den neuen Punkt: ${xPixel}`);

      // NEU: Feste Obergrenze für X (Beispiel 1200 Pixel)
      const MAX_X = 1450;
      xPixel = Math.min(xPixel, MAX_X);
      console.log(`(Gekappter) x-Pixel: ${xPixel}`);

      // ---- JETZT: Ratios berechnen
      const xRatio = xPixel / containerWidth;
      const yRatio = yPixel / containerHeight;
      console.log(`Ratios => xRatio=${xRatio}, yRatio=${yRatio}`);

      // Zeitstempel
      const now = new Date().toISOString();

      // Neuen Punkt in Firebase speichern => inkl. xRatio, yRatio
      const newRef = dotsRef.push(); // Generiert einen neuen Schlüssel ohne Daten
      if (newRef.key) {
          recentlyCreatedKeys.push(newRef.key);
          newRef.set({
              text: userInput,
              xRatio: xRatio,
              yRatio: yRatio,
              timestamp: now
          }).then(() => {
              console.log(`Saved new dot with ratio => xRatio=${xRatio}, yRatio=${yRatio}, key=${newRef.key}`);
          }).catch((error) => {
              console.error('Error saving new dot:', error);
          });
      } else {
          console.error('Failed to generate new key.');
      }

      // Textfeld leeren
      textarea.value = '';
      textarea.style.height = 'auto';
      charCounter.textContent = `0/${maxCharCount}`;
    }
  }
});

/******************************************************
 * 7) BEIM LADEN: BEREITS GESPEICHERTE PUNKTE LADEN
 *    -> Nun laden wir xRatio, yRatio statt Pixel
 ******************************************************/
dotsRef.once('value', (snapshot) => {
  const allDots = snapshot.val();
  if (allDots) {
    Object.keys(allDots).forEach(key => {
      const dotData = allDots[key];
      createGreenDot(
        dotData.text,
        dotData.xRatio,
        dotData.yRatio,
        false,
        dotData.timestamp
      );
    });
  }
});

// Realtime-Listener: Bei jedem neuen Punkt => sofort anzeigen
dotsRef.on('child_added', (snapshot) => {
  // snapshot.key => eindeutige ID
  const dotKey = snapshot.key;
  const newDotData = snapshot.val(); // { text, xRatio, yRatio, timestamp }

  console.log('child_added:', dotKey);

  // Prüfen, ob dieser Key in recentlyCreatedKeys ist
  let shouldScroll = false;
  const index = recentlyCreatedKeys.indexOf(dotKey);
  if (index !== -1) {
    shouldScroll = true;
    // Entferne den Key, damit nur einmal gescrollt wird
    recentlyCreatedKeys.splice(index, 1);
    console.log(`Soll scrollen zu: ${dotKey}`);
  } else {
    console.log(`Key ${dotKey} nicht in recentlyCreatedKeys.`);
  }

  // Punkt erstellen (nun mit Ratios)
  createGreenDot(
    newDotData.text,
    newDotData.xRatio,
    newDotData.yRatio,
    shouldScroll,
    newDotData.timestamp
  );
});

/******************************************************
 * 8) UHRZEIT & LOGO-TEXT (DEIN VORHANDENER CODE)
 ******************************************************/
function updateDateTime() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('de-DE');
  const formattedTime = now.toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  document.getElementById('current-date').textContent = formattedDate;
  document.getElementById('current-time').textContent = formattedTime;
}
setInterval(updateDateTime, 1000);
updateDateTime();

document.addEventListener('DOMContentLoaded', () => {
  const logoDot = document.querySelector('.logo-dot');
  const logoText = document.getElementById('logo-text');
  logoDot.addEventListener('click', () => {
    if (logoText.classList.contains('show')) {
      logoText.classList.remove('show');
      logoText.classList.add('hide');
      setTimeout(() => {
        logoText.style.display = 'none';
      }, 300);
    } else {
      logoText.style.display = 'block';
      logoText.classList.remove('hide');
      logoText.classList.add('show');
    }
  });
});

/******************************************************
 * 9) OPTIONAL: PUNKTE BEIM RESIZE "MITWANDERN" LASSEN
 ******************************************************/
window.addEventListener('resize', () => {
  const scrollContainer = document.getElementById('scrollContainer');
  const containerWidth = scrollContainer.clientWidth;
  const containerHeight = scrollContainer.clientHeight;

  // Für alle bereits angezeigten Punkte neu berechnen
  displayedDots.forEach(dotObj => {
    // Ratio -> Pixel
    const xPixel = dotObj.xRatio * containerWidth;
    const yPixel = dotObj.yRatio * containerHeight;

    // Dot umpositionieren
    dotObj.dotElem.style.left = `${xPixel}px`;
    dotObj.dotElem.style.top  = `${yPixel}px`;

    // Text umpositionieren
    dotObj.textElem.style.left = `${xPixel + 27}px`;
    dotObj.textElem.style.top  = `${yPixel - 19}px`;
  });
});
