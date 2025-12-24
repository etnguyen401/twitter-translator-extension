let nativeLangs = ["en", "und"];
let targetNode = null;
let observer = null;
let intervalId = null;
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    //if url changed, need to select new section
    if (msg.type === "URL_CHANGE") {
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
                targetNode = document.querySelector('section > div > div[style^="position: relative"]');
                if (targetNode) {
                    console.log("Target Node:", targetNode);
                    //make options
                    const options = {childList: true};
                    //make callback for mutation observer
                    const callback = function (mutationList, observer) {
                        //for each mutation, log for now
                        for (mutation of mutationList) {
                            if (mutation.addedNodes.length > 0) {
                                // console.log("New mutation: ", mutation);
                                mutation.addedNodes.forEach((node) => {
                                    //find descendent with lang attribute
                                    const langDiv = node.querySelector("div[lang]");
                                    createTranslatedNode(langDiv);
                                });
                            }
                        }
                    }
                    //targetNode exists, so view existing nodes:
                    //can probably refactor this into a function so above can use as well
                    targetNode.querySelectorAll("div[lang]").forEach((node) => {
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
        }, 500);
        
        
    }
});

async function createTranslatedNode(langDiv) {
    
    //check if that div's lang is not in nativeLangs
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {
        
        if (langDiv.textContent.length > 0) {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: "TRANSLATE_TEXT",
                    text: langDiv.textContent,
                    source: langDiv.getAttribute("lang"),
                    target: "en"
                });

                console.log("Translation response:", response);
                const span = document.createElement("span");
                span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3");
                
                if (response.success) {
                    span.textContent = `\n\nTranslation:\n${response.translatedText}`;
                }
                else {
                    span.textContent = `\n\nTranslation:\nError ${response.status}: ${response.error}`;
                }

                langDiv.appendChild(span);

            } catch (error) {
                console.error("Error during translation request:", error);
            }
        }
    }
}