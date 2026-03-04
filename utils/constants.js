//storage keys
export const STORAGE_KEYS = {
    TARGET_LANGUAGE: "targetLanguage",
    TEXT_COLOUR: "textColour",
    TARGET_FONT: "targetFont"
};

// default preferences
export const DEFAULT_PREFERENCES = {
    [STORAGE_KEYS.TARGET_LANGUAGE]: "English (en)",
    [STORAGE_KEYS.TEXT_COLOUR]: "#4606f5",
    [STORAGE_KEYS.TARGET_FONT]: "Default"
};

export const MESSAGE_TYPES = {
    URL_CHANGE: "urlChange",
    COLOUR_CHANGE: "colourChange",
    TRANSLATE_TEXT: "translateText",
    FONT_CHANGE: "fontChange"
}

export const targetLanguages = [
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

export const fonts = [
    "Default",
    "Arial",
    "Arial Black",
    "Comic Sans MS",
    "Courier New",
    "Garamond",
    "Georgia",
    "Helvetica",
    "Impact",
    "Palatino Linotype",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
];