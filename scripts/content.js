import { STORAGE_KEYS, MESSAGE_TYPES } from "../utils/constants.js";
import { Storage } from "../utils/storage.js";

const nativeLangs = ["cy", "in", "ht", "und", "qam", "qct", "qht", "qme", "qmn", "qmx", "qmv", "qmw", "qmx", "qst", "zxx"];

let targetLanguage = null;
(async () => {
    targetLanguage = (await Storage.get(STORAGE_KEYS.TARGET_LANGUAGE)).slice(-3, -1);
    nativeLangs.push(targetLanguage);
})();

let targetNode = null;
let observer = null;
let intervalId = null;

window.addEventListener("load", () => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        //if url changed, need to select new section
        if (msg.type === MESSAGE_TYPES.URL_CHANGE) {
            console.log("URL changed to: " + msg.url);
            targetNode = null;
            //select until page finished loading, in increments
            //disconnect old observer
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }

            intervalId = setInterval(() => {
                console.log("Inside setInterval")
                if (!targetNode) {
                    //grab the section element
                    targetNode = document.querySelector('section > div > div[style^="position: relative"]');
                    if (targetNode) {
                        //get to the right parent node that doesn't disappear on navigation
                        targetNode = targetNode.parentElement.parentElement.parentElement;
                        console.log("Target Node:", targetNode);
                        //make options
                        const options = {childList: true, subtree: true};
                        //make callback for mutation observer
                        const callback = function (mutationList, observer) {
                            //for each mutation, log for now
                            for (const mutation of mutationList) {
                                //if mutation is an added node
                                if (mutation.addedNodes.length > 0) {
                                    //for each added node
                                    mutation.addedNodes.forEach((node) => {
                                        //if the added node has data-testid = cellInnerDiv, it's a new tweet
                                        if (node.getAttribute && node.getAttribute("data-testid") === "cellInnerDiv"
                                            && !node.querySelector(".translated-text")) {
                                            //run the translated node creation
                                            const langDiv = node.querySelector("div[lang]");
                                            createTranslatedNode(langDiv);
                                        }
                                    }); 
                                }
                                //else if mutation is a removed node
                                else if (mutation.removedNodes.length > 0) {
                                    //for each removed node
                                    mutation.removedNodes.forEach((node) => {
                                        //when user clicks show original text 
                                        //if the removed node matches <div class="css-175oi2r r-1awozwy r-18u37iz r-z5qs1h r-e683xz r-1s2bzr4">,
                                        //which is the "rate this translation" div
                                        //remake the translated node as twitter reloads the tweet
                                        if (node.classList.contains("r-z5qs1h")) {
                                            const langDiv = mutation.target.querySelector("div[lang]");
                                            createTranslatedNode(langDiv);
                                        }
                                        //if the show more text was clicked and there already is translated text, remake the translated node with all text
                                        else if (node.getAttribute("data-testid") === "tweet-text-show-more-link"
                                                && mutation.target.querySelector(".translated-text")) {
                                                const langDiv = mutation.target.querySelector("div[lang]");
                                                mutation.target.querySelector(".translated-text").remove();
                                                createTranslatedNode(langDiv);
                                        }
                                    });
                                }
                            }
                        }
                        //targetNode loaded already, so translate for existing nodes if needed:
                        targetNode.querySelectorAll("div[lang]").forEach((node) => {
                            if (node.querySelector(".translated-text")) return;
                            createTranslatedNode(node);
                        });
                        //create mutation observer, will take over and detect new nodes
                        observer = new MutationObserver(callback);

                        //start observing
                        observer.observe(targetNode, options);
                        
                        clearInterval(intervalId);
                        intervalId = null;
                        console.log("Interval cleared");
                    }
                }
            }, 600);  
        }
    });
});

async function createTranslatedNode(langDiv) {
    
    //check if that div's lang is not in nativeLangs
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {

        if (langDiv.textContent.length > 0) {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: MESSAGE_TYPES.TRANSLATE_TEXT,
                    text: langDiv.textContent,
                    source: langDiv.getAttribute("lang"),
                    target: targetLanguage,
                });

                const span = document.createElement("span");
                span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3", "translated-text");
                
                if (response.success) {
                    span.textContent = `\n\nTranslation:\n${response.translatedText}`;
                }
                else {
                    span.textContent = `\n\nTranslation:\nError ${response.status}: ${response.error}`;
                }

                langDiv.appendChild(span);

            } catch (error) {
                console.error("Error during translation node creation:", error);
            }
        }
    }
}