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
                                mutation.addedNodes.forEach(async (node) => {
                                    //for each node, find descendent with lang attribute
                                    let langDiv = node.querySelector('div[lang]');
                                    //check if that div's lang is not in nativeLangs
                                    if (langDiv && !nativeLangs.includes(langDiv.getAttribute('lang'))) {
                                        console.log("Found foreign lang div:", langDiv); 
                                        console.log("Text content:", langDiv.textContent);
                                        //send to background.js for translation
                                        //CHANGE FROM HARD CODE TARGET LATER
                                        if (langDiv.textContent.length > 0) {
                                            try {
                                                const response = await chrome.runtime.sendMessage({
                                                type: "TRANSLATE_TEXT",
                                                text: langDiv.textContent,
                                                source: langDiv.getAttribute("lang"),
                                                target: "en"
                                            });
                                            console.log("Received translation response:", response);
                                            } catch (error) {
                                                console.error("Error during translation request:", error);
                                            }
                                        }
                                        //get the response, erase existing text and insert translated text
                                    }
                                });
                            }
                        }
                    }
                    //targetNode exists, so view existing nodes:
                    //can probably refactor this into a function so above can use as well
                    targetNode.querySelectorAll("div[lang]").forEach(node => {
                        if (!nativeLangs.includes(node.getAttribute("lang"))) {
                            console.log("Found foreign lang div (initial):", node);
                            console.log("Text content:", node.textContent);
                        }
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
console.log("test5");