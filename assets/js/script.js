/******************************************************
 * 0) GLOBALE HILFS-VARIABLE
 ******************************************************/
// Merkt sich die Keys der neu erstellten Punkte (nur von dir)
let recentlyCreatedKeys = [];

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
function adjustScrollContainerHeight(y) {
  const scrollContainer = document.getElementById('scrollContainer');
  const currentMinHeight = scrollContainer.clientHeight;
  if (y + 200 > currentMinHeight) { // 200px Puffer
    scrollContainer.style.minHeight = `${y + 200}px`;
    console.log(`ScrollContainer minHeight angepasst auf: ${y + 200}px`);
  }
}

/******************************************************
 * 5) FUNKTION createGreenDot
 *    -> Erzeugt einen grünen Punkt + zugehöriges Textfeld
 *    -> Scrollen nur, wenn shouldScroll = true
 ******************************************************/
function createGreenDot(text, x, y, shouldScroll = false) {
    console.log(`Creating dot at (${x}, ${y})`);

    const dot = document.createElement('div');
    dot.classList.add('green-dot');

    // Punkt platzieren
    dot.style.left = `${x}px`;
    dot.style.top  = `${y}px`;

    // Text-Element erstellen
    const textElement = document.createElement('div');
    textElement.classList.add('dot-text');

    // Datum/Uhrzeit
    const now = new Date();
    const formattedDate = now.toLocaleDateString('de-DE');
    const formattedTime = now.toLocaleTimeString('de-DE');

    textElement.innerHTML = `${text}<br><br><span class="timestamp">${formattedDate}<br>${formattedTime}</span>`;
    textElement.style.left = `${x + 20}px`;
    textElement.style.top  = `${y - 5}px`;
    textElement.style.display = 'none';

    // Punkt & Text ins DOM einfügen innerhalb von #textOutputArea
    textOutputArea.appendChild(dot);
    textOutputArea.appendChild(textElement);

    // Anpassung der Scroll Container Höhe
    adjustScrollContainerHeight(y);

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
        console.log(`Scrolling to y: ${y - window.innerHeight / 2}`);
        requestAnimationFrame(() => {
            const rect = dot.getBoundingClientRect();
            const absoluteY = rect.top + window.pageYOffset;
            const scrollToY = absoluteY - (window.innerHeight / 2);
            
            console.log(`Scrolling to absolute y: ${scrollToY}`);
            
            window.scrollTo({
                top: scrollToY,
                behavior: 'smooth'
            });
            
            console.log(`Scrolled to y: ${scrollToY}`);
        });
    }
}

/******************************************************
 * 6) TEXT ABSENDEN (ENTER) => SPEICHERN IN FIREBASE
 ******************************************************/
textarea.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userInput = textarea.value.trim();
    if (userInput !== "") {
      // Dynamische Berechnung der Koordinaten
      const scrollContainer = document.getElementById('scrollContainer');
      const containerWidth = scrollContainer.clientWidth;
      const containerHeight = scrollContainer.clientHeight;
      
      // Berechnung des topOffset basierend auf dem Textarea
      const topOffset = textarea.offsetTop + textarea.offsetHeight + 30; // 30px Abstand
      
      const bottomOffset = 20; // Abstand zum unteren Rand
      const buffer = 450; // Erhöhter Puffer zum unteren Rand (z.B. 450px)

      const minY = topOffset;
      const maxY = containerHeight - bottomOffset - buffer;

      // Sicherstellen, dass maxY nicht kleiner als minY ist
      const effectiveMaxY = maxY > minY ? maxY : minY + 100;

      const textLengthFactor = Math.min(userInput.length / maxCharCount, 1); // 0..1
      const y = minY + textLengthFactor * (effectiveMaxY - minY);
      console.log(`Final y-Wert für den neuen Punkt: ${y}`);

      // Berechnung der X-Koordinate innerhalb des Containers mit horizontalem Puffer
      const horizontalBuffer = 50; // Puffer in Pixeln an den Seiten (z.B. 50px)
      const leftMargin = horizontalBuffer; 
      const rightMargin = horizontalBuffer;
      const dotWidth = 15; // Breite der Punkte
      
      const minX = leftMargin;
      const maxX = containerWidth - rightMargin - dotWidth;
      const x = Math.floor(minX + Math.random() * (maxX - minX));
      console.log(`Final x-Wert für den neuen Punkt: ${x}`);

      // Neuen Punkt in Firebase speichern
      const newRef = dotsRef.push(); // Generiert einen neuen Schlüssel ohne Daten

      if (newRef.key) {
          // Füge den Schlüssel zuerst zu recentlyCreatedKeys hinzu
          recentlyCreatedKeys.push(newRef.key);
          console.log(`New key added to recentlyCreatedKeys: ${newRef.key}`);

          // Setze die Daten an der generierten Schlüsselposition
          newRef.set({
              text: userInput,
              x: x,
              y: y
          }).then(() => {
              console.log(`Saved new dot: x=${x}, y=${y}, key=${newRef.key}`);
          }).catch((error) => {
              console.error('Error saving new dot:', error);
          });
      } else {
          console.error('Failed to generate new key.');
      }

      // Textfeld leeren
      textarea.value = '';
      textarea.style.height = 'auto';
      
      // Aktualisiere den Zeichenzähler nach dem Leeren des Textareas
      charCounter.textContent = `0/${maxCharCount}`;
    }
  }
});

/******************************************************
 * 7) BEIM LADEN: BEREITS GESPEICHERTE PUNKTE LADEN
 ******************************************************/
// Einmalig alle vorhandenen Punkte laden (für Historie)
dotsRef.once('value', (snapshot) => {
  const allDots = snapshot.val();
  if (allDots) {
    Object.keys(allDots).forEach(key => {
      const dotData = allDots[key];
      // Erzeuge Punkt ohne Scroll (weil es "alte" Punkte sind)
      createGreenDot(dotData.text, dotData.x, dotData.y, false);
    });
  }
});

// Realtime-Listener: Bei jedem neuen Punkt => sofort anzeigen
dotsRef.on('child_added', (snapshot) => {
  // snapshot.key => eindeutige ID
  const dotKey = snapshot.key;
  const newDotData = snapshot.val(); // { text, x, y }

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

  createGreenDot(newDotData.text, newDotData.x, newDotData.y, shouldScroll);
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
