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
const maxCharCount = 180;

/******************************************************
 * 3) TEXTAREA-LOGIK (Zeichenlimit, Shake, etc.)
 ******************************************************/
// Dynamisches Wachstum + Zeichenlimit + Shake-Effekt
textarea.addEventListener('input', function () {
  if (this.value.length > maxCharCount) {
    this.value = this.value.slice(0, maxCharCount);
    textarea.classList.add('shake-effect');
    setTimeout(() => {
      textarea.classList.remove('shake-effect');
    }, 300);
  }
  // Höhe an Inhalt anpassen
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;
});

// Entfernt den simulierten Cursor bei Fokus
textarea.addEventListener('focus', () => {
  textarea.classList.add('focused');
});
textarea.addEventListener('blur', () => {
  textarea.classList.remove('focused');
});

/******************************************************
 * 4) FUNKTION createGreenDot
 *    -> Erzeugt einen grünen Punkt + zugehöriges Textfeld
 *    -> Scrollen nur, wenn shouldScroll = true
 ******************************************************/
function createGreenDot(text, x, y, shouldScroll = false) {
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

  // Punkt & Text ins DOM einfügen
  textOutputArea.appendChild(dot);
  textOutputArea.appendChild(textElement);

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
    dot.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/******************************************************
 * 5) TEXT ABSENDEN (ENTER) => SPEICHERN IN FIREBASE
 ******************************************************/
textarea.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userInput = textarea.value.trim();
    if (userInput !== "") {
      // Koordinaten lokal berechnen
      const leftMargin   = 200;
      const rightMargin  = 200;
      const bottomMargin = 200;

      const viewportWidth  = window.innerWidth;
      const documentHeight = document.body.scrollHeight;

      const minX = leftMargin;
      const maxX = viewportWidth - rightMargin;
      const x = Math.floor(minX + Math.random() * (maxX - minX));

      const padding = 50; 
      const minY = textarea.offsetTop + textarea.offsetHeight + window.scrollY + padding;
      const maxY = documentHeight - bottomMargin;
      const textLengthFactor = (userInput.length / maxCharCount);
      const y = minY + textLengthFactor * (maxY - minY);

      // Neuen Punkt in Firebase speichern
      // .push() erzeugt eine eindeutige ID (snapshot.key)
      const newRef = dotsRef.push({
        text: userInput,
        x: x,
        y: y
      });


      // Merke dir den Key, damit wir wissen, dass dieser Punkt
      // von dir stammt -> später scrollen
      recentlyCreatedKeys.push(newRef.key);

      // Textfeld leeren
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }
});

/******************************************************
 * 6) BEIM LADEN: BEREITS GESPEICHERTE PUNKTE LADEN
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

  // Prüfen, ob dieser Key in recentlyCreatedKeys ist
  let shouldScroll = false;
  const index = recentlyCreatedKeys.indexOf(dotKey);
  if (index !== -1) {
    shouldScroll = true;
    // Entferne den Key, damit nur einmal gescrollt wird
    recentlyCreatedKeys.splice(index, 1);
  }

  createGreenDot(newDotData.text, newDotData.x, newDotData.y, shouldScroll);
});

/******************************************************
 * 7) UHRZEIT & LOGO-TEXT (DEIN VORHANDENER CODE)
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
