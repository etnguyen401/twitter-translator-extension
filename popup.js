const uniqueTargetLanguages = [
  "English (en)",
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

//set selected language from storage
let selectedLanguage = "";
chrome.storage.sync.get("targetLanguage", (storage) => {
  selectedLanguage = storage.targetLanguage;
  const selectedItemInput = document.querySelector(".selected-item input");
  selectedItemInput.value = selectedLanguage;

  //fill dropdown with options
  const optionsList = document.querySelector(".options-list");
  for (const language of uniqueTargetLanguages) {
      const option = document.createElement("li");
      option.classList.add("dropdown-item");
      option.textContent = language;
      console.log("Language: " + language, " Selected: " + selectedLanguage);
      if (language === selectedLanguage) {
        option.classList.add("active");
      }
      optionsList.appendChild(option);
  }

  //handle selecting item from dropdown
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  dropdownItems.forEach(dropdownItem => {
    dropdownItem.addEventListener("click", () => {
      dropdownItems.forEach(item => {
        item.classList.remove("active");
      })
      dropdownItem.classList.add("active");

      const selectedItemInput = document.querySelector(".selected-item input");
      selectedItemInput.value = dropdownItem.innerHTML;
      closeDropdown();

      //store selected language in chrome storage
      chrome.storage.sync.set({
        targetLanguage: dropdownItem.innerHTML,
      }); 
      reloadTwitterTabs();
    })
  });

  //handle filtering items from search input
  const searchInput = document.querySelector(".search-input input");
  searchInput.addEventListener("keyup", () => {
    const filter = searchInput.value.toLocaleLowerCase();

    dropdownItems.forEach(dropdownItem => {
      if (dropdownItem.innerHTML.toLocaleLowerCase().startsWith(filter)) {
        dropdownItem.classList.remove("hide");
      }
      else {
        dropdownItem.classList.add("hide");
      }
    })
  });
});

//control the click on dropdown
window.addEventListener("load", () => {
  window.addEventListener("click", (e) => {
    //handle clicking inside/outside dropdown
    const dropdown = document.querySelector(".dropdown");
    const dropdownContent = document.querySelector(".dropdown-content");
    const selectedItem = document.querySelector(".selected-item");
    
    if (dropdown.classList.contains("active")) {
      if (!dropdownContent.contains(e.target)) {
        closeDropdown();
      }
    }
    else if (selectedItem.contains(e.target)) {
      openDropdown();
    }

  })

});

function openDropdown() {
  const dropdown = document.querySelector(".dropdown");
  dropdown.classList.add("active");
}

function closeDropdown() {
  const dropdown = document.querySelector(".dropdown");
  dropdown.classList.remove("active");
}

function reloadTwitterTabs() {
  chrome.tabs.query({currentWindow: true, url: "*://x.com/*"}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  });
}