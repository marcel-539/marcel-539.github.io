/******************************************************
 * 0) GLOBALE VARS & ARRAY
 ******************************************************/
let recentlyCreatedKeys = [];
let displayedDots = []; // speichert { dotElem, textElem, creationTime, xRatio, yRatio }

/******************************************************
 * 1) FIREBASE INITIALISIEREN
 ******************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyB_...",
  authDomain: "text-nemo-cfb3b.firebaseapp.com",
  databaseURL: "https://text-nemo-cfb3b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "text-nemo-cfb3b",
  storageBucket: "text-nemo-cfb3b.appspot.com",
  messagingSenderId: "73092575822",
  appId: "1:73092575822:web:64dbd6e29970a52fb9891f"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dotsRef = database.ref('dots');

/******************************************************
 * 2) DOM-ELEMENTE
 ******************************************************/
const textarea = document.getElementById('expandingTextarea');
const textOutputArea = document.getElementById('textOutputArea');
const charCounter = document.getElementById('charCounter');
const maxCharCount = 180;

/******************************************************
 * 3) TEXTAREA-LOGIK
 ******************************************************/
textarea.addEventListener('input', function() {
  const currentLength = this.value.length;
  if (currentLength > maxCharCount) {
    this.value = this.value.slice(0, maxCharCount);
    textarea.classList.add('shake-effect');
    setTimeout(() => {
      textarea.classList.remove('shake-effect');
    }, 300);
  }
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;
  charCounter.textContent = `${this.value.length}/${maxCharCount}`;
});

textarea.addEventListener('focus', () => {
  textarea.classList.add('focused');
});
textarea.addEventListener('blur', () => {
  textarea.classList.remove('focused');
});

/******************************************************
 * 4) adjustScrollContainerHeight
 ******************************************************/
function adjustScrollContainerHeight(yPixel) {
  const scrollContainer = document.getElementById('scrollContainer');
  if (yPixel + 200 > scrollContainer.clientHeight) {
    scrollContainer.style.minHeight = `${yPixel + 200}px`;
  }
}

/******************************************************
 * 5) createGreenDot
 *    => Erzeugt Dot + Text
 ******************************************************/
function createGreenDot(text, xRatio, yRatio, shouldScroll = false, submissionTimestamp = null) {
  const scrollContainer = document.getElementById('scrollContainer');
  const containerWidth = scrollContainer.clientWidth;
  const containerHeight = scrollContainer.clientHeight;

  const xPixel = xRatio * containerWidth;
  const yPixel = yRatio * containerHeight;

  // Dot
  const dot = document.createElement('div');
  dot.classList.add('green-dot');
  dot.style.left = xPixel + 'px';
  dot.style.top = yPixel + 'px';

  // Text
  const textElement = document.createElement('div');
  textElement.classList.add('dot-text');
  textElement.style.left = (xPixel + 27) + 'px';
  textElement.style.top = (yPixel - 19) + 'px';
  textElement.style.display = 'none'; // erst mal nicht sichtbar

  let finalDate = new Date(); 
  if (submissionTimestamp) {
    finalDate = new Date(submissionTimestamp);
  }
  const formattedDate = finalDate.toLocaleDateString('de-DE');
  const formattedTime = finalDate.toLocaleTimeString('de-DE');
  textElement.innerHTML = 
    `${text}<br><br><span class="timestamp">${formattedDate}<br>${formattedTime}</span>`;

  textOutputArea.appendChild(dot);
  textOutputArea.appendChild(textElement);

  adjustScrollContainerHeight(yPixel);

  // Klick => Text ein-/ausblenden
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

  // Optional scrollen
  if (shouldScroll) {
    requestAnimationFrame(() => {
      const rect = dot.getBoundingClientRect();
      const absoluteY = rect.top + window.pageYOffset;
      const scrollToY = absoluteY - (window.innerHeight / 2);
      window.scrollTo({ top: scrollToY, behavior: 'smooth' });
    });
  }

  // Speichern in displayedDots
  displayedDots.push({
    dotElem: dot,
    textElem: textElement,
    xRatio: xRatio,
    yRatio: yRatio,
    creationTime: finalDate
  });

  // Flicker aktualisieren
  updateFlickerClasses();
}

/******************************************************
 * 6) TEXT ABSENDEN => Firebase
 ******************************************************/
textarea.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const userInput = textarea.value.trim();
    if (userInput !== "") {
      const scrollContainer = document.getElementById('scrollContainer');
      const containerWidth = scrollContainer.clientWidth;
      const containerHeight = scrollContainer.clientHeight;

      const topOffset = textarea.offsetTop + textarea.offsetHeight + 30;
      const bottomOffset = 20;
      const buffer = 450;
      const minY = topOffset;
      const maxY = containerHeight - bottomOffset - buffer;
      const effectiveMaxY = maxY > minY ? maxY : (minY + 100);

      const textLengthFactor = Math.min(userInput.length / maxCharCount, 1);
      let yPixel = minY + textLengthFactor * (effectiveMaxY - minY);
      // z.B. Obergrenze
      const MAX_Y = 58000; 
      yPixel = Math.min(yPixel, MAX_Y);

      const horizontalBuffer = 50;
      const dotWidth = 15;
      const minX = horizontalBuffer;
      const maxX = containerWidth - horizontalBuffer - dotWidth;
      let xPixel = Math.floor(minX + Math.random() * (maxX - minX));
      const MAX_X = 1450; 
      xPixel = Math.min(xPixel, MAX_X);

      // Ratio
      const xRatio = xPixel / containerWidth;
      const yRatio = yPixel / containerHeight;

      // Timestamp
      const nowISO = new Date().toISOString();

      // Speichern in Firebase
      const newRef = dotsRef.push();
      if (newRef.key) {
        recentlyCreatedKeys.push(newRef.key);
        newRef.set({
          text: userInput,
          xRatio: xRatio,
          yRatio: yRatio,
          timestamp: nowISO
        }).then(() => {
          console.log(`Saved new dot key=${newRef.key}`);
        }).catch((err) => {
          console.error('Error saving dot:', err);
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
 * 7) BEIM LADEN: Vorhandene Punkte
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

// Realtime-Listener
dotsRef.on('child_added', (snapshot) => {
  const dotKey = snapshot.key;
  const newDotData = snapshot.val();
  let shouldScroll = false;
  const index = recentlyCreatedKeys.indexOf(dotKey);
  if (index !== -1) {
    shouldScroll = true;
    recentlyCreatedKeys.splice(index, 1);
  }
  createGreenDot(
    newDotData.text,
    newDotData.xRatio,
    newDotData.yRatio,
    shouldScroll,
    newDotData.timestamp
  );
});

/******************************************************
 * 8) UHRZEIT & LOGO
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
  if (logoDot) {
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
  }
});

/******************************************************
 * 9) RESIZE => reposition
 ******************************************************/
window.addEventListener('resize', () => {
  const scrollContainer = document.getElementById('scrollContainer');
  const containerWidth = scrollContainer.clientWidth;
  const containerHeight = scrollContainer.clientHeight;
  displayedDots.forEach(dotObj => {
    const xPixel = dotObj.xRatio * containerWidth;
    const yPixel = dotObj.yRatio * containerHeight;
    dotObj.dotElem.style.left = xPixel + 'px';
    dotObj.dotElem.style.top  = yPixel + 'px';
    dotObj.textElem.style.left = (xPixel + 27) + 'px';
    dotObj.textElem.style.top  = (yPixel - 19) + 'px';
  });
});

/******************************************************
 * 10) FLICKER-KLASSEN-LOGIK
 ******************************************************/
function updateFlickerClasses() {
  const now = Date.now();
  displayedDots.forEach(dotObj => {
    const ageMs = now - dotObj.creationTime.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    let dotClass = null;
    let textClass = null;

    // Ab Tag 10 => invisible
    if (ageDays >= 10) {
      dotClass = 'invisible-dot';
      textClass = 'invisible-text';
    }
    // ab Tag 9 => flicker-lvl3
    else if (ageDays >= 7) {
      dotClass = 'flicker-lvl3-dot';
      textClass = 'flicker-lvl3-text';
    }
    // ab Tag 8 => flicker-lvl2
    else if (ageDays >= 5) {
      dotClass = 'flicker-lvl2-dot';
      textClass = 'flicker-lvl2-text';
    }
    // ab Tag 4 => flicker-lvl1
    else if (ageDays >= 4) {
      dotClass = 'flicker-lvl1-dot';
      textClass = 'flicker-lvl1-text';
    }

    // Alte Klassen entfernen
    dotObj.dotElem.classList.remove(
      'flicker-lvl1-dot', 'flicker-lvl2-dot', 'flicker-lvl3-dot', 'invisible-dot'
    );
    dotObj.textElem.classList.remove(
      'flicker-lvl1-text', 'flicker-lvl2-text', 'flicker-lvl3-text', 'invisible-text'
    );

    // Neue Klasse hinzufügen
    if (dotClass) {
      dotObj.dotElem.classList.add(dotClass);
    }
    if (textClass) {
      dotObj.textElem.classList.add(textClass);
    }
  });
}

