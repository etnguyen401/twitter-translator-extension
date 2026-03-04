import { Storage } from "../../utils/storage.js";

export function addDropdownLogic(element, options = {}) {
    if (!element) {
        console.warn("Element for dropdown logic not found.");
        return;
    }

    const config = {
        items: options.items || [],
        placeholder: options.placeholder || "Select an option",
        storageKey: options.storageKey || null,
        onChange: options.onChange || null
    };

    const selectedItemInput = element.querySelector(".selected-item input");
    const searchInput = element.querySelector(".search-input input");
    const optionsList = element.querySelector(".options-list");
    const dropdownContent = element.querySelector('.dropdown-content');
    const selectedItem = element.querySelector('.selected-item');

    // let selectedValue = null;

    //handle filling dropdown with options
    function fillDropdown() {
        if (!optionsList) {
            console.warn("Options list element not found.");
            return;
        }
        
        optionsList.innerHTML = "";

        config.items.forEach((item) => {
            const option = document.createElement("li");
            option.classList.add("dropdown-item");
            option.textContent = item;
            optionsList.appendChild(option);
        })

    }

    function filterItems(searchTerm) {
        const dropdownItems = element.querySelectorAll(".dropdown-item");
        dropdownItems.forEach(dropdownItem => {
            if (dropdownItem.textContent.toLocaleLowerCase().startsWith(searchTerm)) {
                dropdownItem.classList.remove("hide");
            }
            else {
                dropdownItem.classList.add("hide");
            }
        });
    }

    //use this function when clicking on dropdown item
    //and when initializing dropdown to set selected item from storage
    async function handleItemSelect(value, saveToStorage) {

        const dropdownItems = element.querySelectorAll(".dropdown-item");

        dropdownItems.forEach(item => {
            item.classList.remove("active");
            if (item.textContent === value) {
                item.classList.add("active");
            }
        });

        //update input display
        if (selectedItemInput) {
            selectedItemInput.value = value;
        }

        if (saveToStorage) {
            await Storage.set(config.storageKey, value);
        }

        //call onChange callback if provided
        if (config.onChange && saveToStorage) {
            config.onChange(value);
        }

        //close dropdown
        closeDropdown();

    }

    function handleOpenClose(e) {
        if (element.classList.contains("active")) {
            if (!dropdownContent.contains(e.target)) {
                closeDropdown();
            }
        }
        else if (selectedItem.contains(e.target)) {
            openDropdown();
        }
    }

    function closeDropdown() {
        element.classList.remove("active");
        //clear search
        if (searchInput) {
            searchInput.value = "";
            filterItems("");
        }
    }

    function openDropdown() {
        element.classList.add("active");
    }

    async function loadSelectedFromStorage() {
        if (config.storageKey) {
            const storedValue = await Storage.get(config.storageKey);
            if (storedValue) {
                handleItemSelect(storedValue, false);
            }
        }
    }

    function attachEventListeners() {
        //event listener for clicking on dropdown options
        optionsList.addEventListener("click", (e) => {
            if (e.target.classList.contains("dropdown-item")) {
                handleItemSelect(e.target.textContent, true);
            }
        });

        //event listener for search input
        if (searchInput) {
            searchInput.addEventListener("keyup", () => {
                filterItems(searchInput.value);
            })
        }

        //event listeners for clicking inside/outside dropdown
        window.addEventListener("click", (e) => {
            handleOpenClose(e);
        })

    }

    async function init() {
        fillDropdown();
        await loadSelectedFromStorage();
        attachEventListeners();
    }

    return {
        init,
        openDropdown,
        closeDropdown,
    }
}

window.addDropdownLogic = addDropdownLogic;