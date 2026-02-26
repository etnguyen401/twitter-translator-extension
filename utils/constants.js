//storage keys
const STORAGE_KEYS = {
    TARGET_LANGUAGE: "targetLanguage",
    TEXT_COLOUR: "textColour",
};

// default preferences
const DEFAULT_PREFERENCES = {
    [STORAGE_KEYS.TARGET_LANGUAGE]: "English (en)",
    [STORAGE_KEYS.TEXT_COLOUR]: "#4606f5",
};

const targetLanguages = [
    "Albanian (sq)",
    "Arabic (ar)",
    "Azerbaijani (az)",
    "Basque (eu)",
    "Bengali (bn)",
    "Bulgarian (bg)",
    "Catalan (ca)",
    "Chinese (zh)",
    "Chinese (traditional) (zt)",
    "Czech (cs)",
    "Danish (da)",
    "Dutch (nl)",
    "English (en)",
    "Esperanto (eo)",
    "Estonian (et)",
    "Finnish (fi)",
    "French (fr)",
    "Galician (gl)",
    "German (de)",
    "Greek (el)",
    "Hebrew (he)",
    "Hindi (hi)",
    "Hungarian (hu)",
    "Indonesian (id)",
    "Irish (ga)",
    "Italian (it)",
    "Japanese (ja)",
    "Korean (ko)",
    "Kyrgyz (ky)",
    "Latvian (lv)",
    "Lithuanian (lt)",
    "Malay (ms)",
    "Norwegian (nb)",
    "Persian (fa)",
    "Polish (pl)",
    "Portuguese (pt)",
    "Portuguese (Brazil) (pb)",
    "Romanian (ro)",
    "Russian (ru)",
    "Slovak (sk)",
    "Slovenian (sl)",
    "Spanish (es)",
    "Swedish (sv)",
    "Tagalog (tl)",
    "Thai (th)",
    "Turkish (tr)",
    "Ukranian (uk)",
    "Urdu (ur)",
    "Vietnamese (vi)"
];

window.DEFAULT_PREFERENCES = DEFAULT_PREFERENCES;
window.STORAGE_KEYS = STORAGE_KEYS;
window.targetLanguages = targetLanguages;