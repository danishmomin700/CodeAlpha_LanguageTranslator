const LANGUAGES = {

  en: "English",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  pa: "Punjabi",
  ur: "Urdu",
  or: "Odia",
  ne: "Nepali",

  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  zh: "Mandarin"
};


const STORAGE = {

  history: "linguaflow_history",

  favorites: "linguaflow_favorites",

  theme: "linguaflow_theme"
};


const $ = id =>
  document.getElementById(id);


const sourceLanguage =
  $("sourceLanguage");

const targetLanguage =
  $("targetLanguage");

const sourceText =
  $("sourceText");

const charCount =
  $("charCount");

const translateBtn =
  $("translateBtn");

const translationResult =
  $("translationResult");

const resultMeta =
  $("resultMeta");

const swapBtn =
  $("swapBtn");

const voiceBtn =
  $("voiceBtn");

const voiceStatus =
  $("voiceStatus");

const clearInputBtn =
  $("clearInputBtn");

const speakBtn =
  $("speakBtn");

const copyBtn =
  $("copyBtn");

const favoriteBtn =
  $("favoriteBtn");

const themeToggle =
  $("themeToggle");

const themeIcon =
  $("themeIcon");

const historyBtn =
  $("historyBtn");

const favoritesBtn =
  $("favoritesBtn");

const drawer =
  $("drawer");

const drawerBackdrop =
  $("drawerBackdrop");

const drawerClose =
  $("drawerClose");

const drawerTitle =
  $("drawerTitle");

const drawerEyebrow =
  $("drawerEyebrow");

const drawerCount =
  $("drawerCount");

const drawerList =
  $("drawerList");

const clearDrawerBtn =
  $("clearDrawerBtn");

const toast =
  $("toast");

const confirmModal =
  $("confirmModal");

const modalTitle =
  $("modalTitle");

const modalMessage =
  $("modalMessage");

const modalCancel =
  $("modalCancel");

const modalConfirm =
  $("modalConfirm");


let history =
  readStorage(
    STORAGE.history,
    []
  );


let favorites =
  readStorage(
    STORAGE.favorites,
    []
  );


let currentTranslation = "";

let currentRecord = null;

let drawerMode = "history";

let confirmAction = null;

let toastTimer = null;

let recognition = null;

let isListening = false;


/* =========================
   INITIALIZATION
========================= */

function init() {

  populateLanguages();

  sourceLanguage.value = "en";

  targetLanguage.value = "hi";


  const savedTheme =
    localStorage.getItem(
      STORAGE.theme
    );


  if (savedTheme === "dark") {

    document.body.classList.add(
      "dark"
    );
  }


  updateThemeIcon();

  updateCharCount();

  setupSpeechRecognition();

  bindEvents();
}


/* =========================
   LANGUAGES
========================= */

function populateLanguages() {

  Object.entries(LANGUAGES)
    .forEach(([code, name]) => {

      sourceLanguage.add(
        new Option(name, code)
      );

      targetLanguage.add(
        new Option(name, code)
      );

    });
}


/* =========================
   EVENTS
========================= */

function bindEvents() {

  sourceText.addEventListener(
    "input",
    updateCharCount
  );


  sourceText.addEventListener(
    "keydown",
    event => {

      if (
        (event.ctrlKey ||
         event.metaKey) &&
        event.key === "Enter"
      ) {

        translate();
      }

    }
  );


  translateBtn.addEventListener(
    "click",
    translate
  );


  swapBtn.addEventListener(
    "click",
    swapLanguages
  );


  clearInputBtn.addEventListener(
    "click",
    () => {

      sourceText.value = "";

      updateCharCount();

      sourceText.focus();

    }
  );


  voiceBtn.addEventListener(
    "click",
    toggleVoiceInput
  );


  speakBtn.addEventListener(
    "click",
    speakTranslation
  );


  copyBtn.addEventListener(
    "click",
    copyTranslation
  );


  favoriteBtn.addEventListener(
    "click",
    toggleFavorite
  );


  themeToggle.addEventListener(
    "click",
    toggleTheme
  );


  historyBtn.addEventListener(
    "click",
    () =>
      openDrawer("history")
  );


  favoritesBtn.addEventListener(
    "click",
    () =>
      openDrawer("favorites")
  );


  drawerClose.addEventListener(
    "click",
    closeDrawer
  );


  drawerBackdrop.addEventListener(
    "click",
    closeDrawer
  );


  clearDrawerBtn.addEventListener(
    "click",
    requestClearCurrentList
  );


  modalCancel.addEventListener(
    "click",
    closeConfirmModal
  );


  modalConfirm.addEventListener(
    "click",
    () => {

      if (
        typeof confirmAction ===
        "function"
      ) {

        confirmAction();

      }

      closeConfirmModal();

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        closeDrawer();

        closeConfirmModal();

      }

    }
  );
}


/* =========================
   CHARACTER COUNT
========================= */

function updateCharCount() {

  charCount.textContent =
    `${sourceText.value.length} / 5000`;
}


/* =========================
   TRANSLATION
========================= */

async function translate() {

  const text =
    sourceText.value.trim();


  if (!text) {

    showToast(
      "Enter some text first."
    );

    sourceText.focus();

    return;
  }


  if (
    sourceLanguage.value ===
    targetLanguage.value
  ) {

    currentTranslation = text;

    currentRecord = {

      source: text,

      target: text,

      sourceLang:
        sourceLanguage.value,

      targetLang:
        targetLanguage.value

    };


    showResult(
      text,
      false,
      "Source and target languages are the same."
    );


    saveTranslation(text);

    return;
  }


  setLoading(true);


  try {

    const langPair =
      `${sourceLanguage.value}|${targetLanguage.value}`;


    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(text)}` +
      `&langpair=${encodeURIComponent(langPair)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Translation request failed"
      );

    }


    const data =
      await response.json();


    const translated =
      data?.responseData
        ?.translatedText
        ?.trim();


    if (!translated) {

      throw new Error(
        "No translation returned"
      );

    }


    currentTranslation =
      translated;


    currentRecord = {

      source: text,

      target: translated,

      sourceLang:
        sourceLanguage.value,

      targetLang:
        targetLanguage.value

    };


    showResult(

      translated,

      false,

      `Translated ${
        LANGUAGES[
          sourceLanguage.value
        ]
      } → ${
        LANGUAGES[
          targetLanguage.value
        ]
      }`

    );


    saveTranslation(
      translated
    );


  } catch (error) {

    console.error(error);


    showResult(

      "Translation could not be completed. Please check your internet connection and try again.",

      true,

      ""

    );


    showToast(
      "Translation service unavailable."
    );


  } finally {

    setLoading(false);

  }
}


/* =========================
   LOADING
========================= */

function setLoading(loading) {

  translateBtn.disabled =
    loading;


  translateBtn.innerHTML =
    loading

      ? `
        <span>Translating…</span>
        <span>⌛</span>
      `

      : `
        <span>Translate</span>
        <span>→</span>
      `;
}


/* =========================
   DISPLAY RESULT
========================= */

function showResult(
  text,
  error = false,
  meta = ""
) {

  translationResult
    .classList
    .remove("empty");


  translationResult.textContent =
    text;


  translationResult.style.color =
    error
      ? "var(--danger)"
      : "var(--text)";


  resultMeta.textContent =
    meta;


  const enabled =
    !error &&
    Boolean(text);


  speakBtn.disabled =
    !enabled;


  copyBtn.disabled =
    !enabled;


  favoriteBtn.disabled =
    !enabled;


  updateFavoriteButton();
}


/* =========================
   SAVE HISTORY
========================= */

function saveTranslation(
  translatedText
) {

  if (!currentRecord)
    return;


  const record = {

    id: createId(),

    source:
      currentRecord.source,

    target:
      translatedText,

    sourceLang:
      currentRecord.sourceLang,

    targetLang:
      currentRecord.targetLang,

    createdAt:
      new Date().toISOString()

  };


  history.unshift(record);


  history =
    history.slice(0, 100);


  saveStorage(
    STORAGE.history,
    history
  );
}


/* =========================
   SWAP LANGUAGES
========================= */

function swapLanguages() {

  const oldSource =
    sourceLanguage.value;


  sourceLanguage.value =
    targetLanguage.value;


  targetLanguage.value =
    oldSource;


  if (currentTranslation) {

    const oldInput =
      sourceText.value;


    sourceText.value =
      currentTranslation;


    currentTranslation =
      oldInput;


    if (oldInput) {

      showResult(
        oldInput,
        false,
        "Languages swapped. Translate again to refresh the result."
      );

    }

  }


  updateCharCount();
}


/* =========================
   FAVORITES
========================= */

function toggleFavorite() {

  if (
    !currentRecord ||
    !currentTranslation
  ) {

    return;
  }


  const index =
    favorites.findIndex(item =>

      item.source ===
      currentRecord.source &&

      item.target ===
      currentTranslation &&

      item.sourceLang ===
      currentRecord.sourceLang &&

      item.targetLang ===
      currentRecord.targetLang

    );


  if (index >= 0) {

    favorites.splice(
      index,
      1
    );

    showToast(
      "Removed from favorites."
    );

  } else {

    favorites.unshift({

      ...currentRecord,

      target:
        currentTranslation,

      id: createId(),

      createdAt:
        new Date().toISOString()

    });


    favorites =
      favorites.slice(0, 100);


    showToast(
      "Saved to favorites."
    );
  }


  saveStorage(
    STORAGE.favorites,
    favorites
  );


  updateFavoriteButton();


  if (
    drawerMode === "favorites"
  ) {

    renderDrawer();

  }
}


function isCurrentFavorite() {

  if (
    !currentRecord ||
    !currentTranslation
  ) {

    return false;
  }


  return favorites.some(item =>

    item.source ===
    currentRecord.source &&

    item.target ===
    currentTranslation &&

    item.sourceLang ===
    currentRecord.sourceLang &&

    item.targetLang ===
    currentRecord.targetLang

  );
}


function updateFavoriteButton() {

  const active =
    isCurrentFavorite();


  favoriteBtn
    .classList
    .toggle(
      "active",
      active
    );


  favoriteBtn.textContent =
    active
      ? "★"
      : "☆";
}


/* =========================
   DRAWER
========================= */

function openDrawer(mode) {

  drawerMode =
    mode;


  drawer.classList.add(
    "open"
  );


  drawer.setAttribute(
    "aria-hidden",
    "false"
  );


  renderDrawer();
}


function closeDrawer() {

  drawer.classList.remove(
    "open"
  );


  drawer.setAttribute(
    "aria-hidden",
    "true"
  );
}


function renderDrawer() {

  const items =
    drawerMode === "history"
      ? history
      : favorites;


  drawerTitle.textContent =
    drawerMode === "history"
      ? "Translation History"
      : "Favorites";


  drawerEyebrow.textContent =
    drawerMode === "history"
      ? "RECENT TRANSLATIONS"
      : "SAVED PHRASES";


  drawerCount.textContent =
    `${items.length} ${
      items.length === 1
        ? "item"
        : "items"
    }`;


  clearDrawerBtn.style.display =
    items.length
      ? "inline-block"
      : "none";


  if (!items.length) {

    drawerList.innerHTML = `

      <div class="empty-list">

        <strong>
          ${
            drawerMode === "history"
              ? "No translation history"
              : "No favorites yet"
          }
        </strong>

        <small>
          ${
            drawerMode === "history"
              ? "Your translations will appear here."
              : "Save a translation using the star button."
          }
        </small>

      </div>

    `;

    return;
  }


  drawerList.innerHTML =
    items.map(item => `

      <article class="saved-item">

        <div class="saved-languages">

          <span>
            ${escapeHtml(
              LANGUAGES[item.sourceLang]
            )}
          </span>

          <span>
            →
          </span>

          <span>
            ${escapeHtml(
              LANGUAGES[item.targetLang]
            )}
          </span>

        </div>


        <div class="saved-source">
          ${escapeHtml(
            item.source
          )}
        </div>


        <div class="saved-target">
          ${escapeHtml(
            item.target
          )}
        </div>


        <div class="saved-footer">

          <span>
            ${formatDate(
              item.createdAt
            )}
          </span>


          <div class="saved-actions">

            <button
              onclick="reuseItem('${item.id}')"
            >
              Use
            </button>


            ${
              drawerMode === "history"

              ? `
                <button
                  onclick="favoriteFromList('${item.id}')"
                >
                  ★ Save
                </button>
              `

              : ""
            }


            <button
              class="delete"
              onclick="deleteItem('${item.id}')"
            >
              Delete
            </button>

          </div>

        </div>

      </article>

    `).join("");
}


/* =========================
   REUSE HISTORY
========================= */

window.reuseItem =
function(id) {

  const items =
    drawerMode === "history"
      ? history
      : favorites;


  const item =
    items.find(
      entry => entry.id === id
    );


  if (!item)
    return;


  sourceLanguage.value =
    item.sourceLang;


  targetLanguage.value =
    item.targetLang;


  sourceText.value =
    item.source;


  currentTranslation =
    item.target;


  currentRecord = {

    source:
      item.source,

    target:
      item.target,

    sourceLang:
      item.sourceLang,

    targetLang:
      item.targetLang

  };


  showResult(
    item.target,
    false,
    "Loaded from saved translations."
  );


  updateCharCount();


  closeDrawer();
};


/* =========================
   ADD FAVORITE FROM HISTORY
========================= */

window.favoriteFromList =
function(id) {

  const item =
    history.find(
      entry => entry.id === id
    );


  if (!item)
    return;


  const exists =
    favorites.some(entry =>

      entry.source ===
      item.source &&

      entry.target ===
      item.target &&

      entry.sourceLang ===
      item.sourceLang &&

      entry.targetLang ===
      item.targetLang

    );


  if (!exists) {

    favorites.unshift({

      ...item,

      id: createId()

    });


    favorites =
      favorites.slice(0, 100);


    saveStorage(
      STORAGE.favorites,
      favorites
    );


    showToast(
      "Added to favorites."
    );

  } else {

    showToast(
      "Already in favorites."
    );
  }


  renderDrawer();
};


/* =========================
   DELETE ITEM
========================= */

window.deleteItem =
function(id) {

  requestConfirm(

    "Delete item?",

    "This saved translation will be permanently removed.",

    () => {

      if (
        drawerMode ===
        "history"
      ) {

        history =
          history.filter(
            item =>
              item.id !== id
          );


        saveStorage(
          STORAGE.history,
          history
        );

      } else {

        favorites =
          favorites.filter(
            item =>
              item.id !== id
          );


        saveStorage(
          STORAGE.favorites,
          favorites
        );
      }


      renderDrawer();

      updateFavoriteButton();

      showToast(
        "Item deleted."
      );

    }

  );
};


/* =========================
   CLEAR ALL
========================= */

function requestClearCurrentList() {

  const items =
    drawerMode === "history"
      ? history
      : favorites;


  if (!items.length)
    return;


  const label =
    drawerMode === "history"
      ? "history"
      : "favorites";


  requestConfirm(

    `Clear ${label}?`,

    `All ${label} items will be permanently removed from this browser.`,

    () => {

      if (
        drawerMode ===
        "history"
      ) {

        history = [];

        saveStorage(
          STORAGE.history,
          history
        );

      } else {

        favorites = [];

        saveStorage(
          STORAGE.favorites,
          favorites
        );

      }


      renderDrawer();

      updateFavoriteButton();

      showToast(
        `${label} cleared.`
      );

    }

  );
}


/* =========================
   CONFIRMATION MODAL
========================= */

function requestConfirm(
  title,
  message,
  action
) {

  modalTitle.textContent =
    title;


  modalMessage.textContent =
    message;


  confirmAction =
    action;


  confirmModal.classList.add(
    "open"
  );


  confirmModal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeConfirmModal() {

  confirmModal.classList.remove(
    "open"
  );


  confirmModal.setAttribute(
    "aria-hidden",
    "true"
  );


  confirmAction =
    null;
}


/* =========================
   COPY
========================= */

async function copyTranslation() {

  if (!currentTranslation)
    return;


  try {

    await navigator
      .clipboard
      .writeText(
        currentTranslation
      );


    showToast(
      "Translation copied."
    );

  } catch {

    const temp =
      document.createElement(
        "textarea"
      );


    temp.value =
      currentTranslation;


    document.body.appendChild(
      temp
    );


    temp.select();


    document.execCommand(
      "copy"
    );


    temp.remove();


    showToast(
      "Translation copied."
    );
  }
}


/* =========================
   TEXT TO SPEECH
========================= */

function speakTranslation() {

  if (
    !currentTranslation ||
    !("speechSynthesis" in window)
  ) {

    showToast(
      "Text-to-speech is not supported."
    );

    return;
  }


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      currentTranslation
    );


  utterance.lang =
    languageToSpeechLocale(
      targetLanguage.value
    );


  utterance.rate =
    0.95;


  speechSynthesis.speak(
    utterance
  );
}


/* =========================
   SPEECH RECOGNITION
========================= */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    voiceBtn.disabled =
      true;


    voiceStatus.textContent =
      "Voice input is not supported in this browser.";


    return;
  }


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;


  recognition.interimResults =
    true;


  recognition.maxAlternatives =
    1;


  recognition.onstart =
    () => {

      isListening = true;

      voiceStatus.textContent =
        "Listening… speak now.";

      voiceBtn.classList.add(
        "listening"
      );

    };


  recognition.onresult =
    event => {

      let finalText =
        "";

      let interimText =
        "";


      for (
        let i =
          event.resultIndex;

        i <
          event.results.length;

        i++
      ) {

        const transcript =
          event.results[i][0]
            .transcript;


        if (
          event.results[i]
            .isFinal
        ) {

          finalText +=
            transcript;

        } else {

          interimText +=
            transcript;

        }
      }


      sourceText.value =
        `${sourceText.value} ${
          finalText ||
          interimText
        }`
        .trim()
        .slice(0, 5000);


      updateCharCount();

    };


  recognition.onerror =
    event => {

      voiceStatus.textContent =
        `Voice input error: ${event.error}`;

    };


  recognition.onend =
    () => {

      isListening = false;

      voiceBtn.classList.remove(
        "listening"
      );

      voiceStatus.textContent =
        "Voice input stopped.";

    };
}


/* =========================
   VOICE TOGGLE
========================= */

function toggleVoiceInput() {

  if (!recognition)
    return;


  if (isListening) {

    recognition.stop();

    return;
  }


  recognition.lang =
    languageToSpeechLocale(
      sourceLanguage.value
    );


  recognition.start();
}


/* =========================
   LANGUAGE LOCALES
========================= */

function languageToSpeechLocale(
  code
) {

  const locales = {

    en: "en-US",
    te: "te-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    mr: "mr-IN",
    bn: "bn-IN",
    gu: "gu-IN",
    pa: "pa-IN",
    ur: "ur-IN",
    or: "or-IN",
    ne: "ne-NP",

    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    ja: "ja-JP",
    ko: "ko-KR",
    pt: "pt-PT",
    zh: "zh-CN"

  };


  return locales[code] || code;
}


/* =========================
   DARK / LIGHT MODE
========================= */

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );


  const dark =
    document.body.classList.contains(
      "dark"
    );


  localStorage.setItem(

    STORAGE.theme,

    dark
      ? "dark"
      : "light"

  );


  updateThemeIcon();
}


function updateThemeIcon() {

  const dark =
    document.body.classList.contains(
      "dark"
    );


  themeIcon.textContent =
    dark
      ? "☀"
      : "☾";
}


/* =========================
   TOAST
========================= */

function showToast(message) {

  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2200);
}


/* =========================
   STORAGE
========================= */

function readStorage(
  key,
  fallback
) {

  try {

    const value =
      JSON.parse(
        localStorage.getItem(key)
      );


    return Array.isArray(value)
      ? value
      : fallback;

  } catch {

    return fallback;

  }
}


function saveStorage(
  key,
  value
) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


/* =========================
   UTILITIES
========================= */

function createId() {

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}


function formatDate(date) {

  try {

    return new Intl.DateTimeFormat(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(
      new Date(date)
    );

  } catch {

    return "";

  }
}


function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


init();