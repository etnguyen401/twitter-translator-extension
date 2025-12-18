let targetNode = null;
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    //if url changed, need to select new section
    if (msg.type === 'URL_CHANGE') {
        console.log("URL changed to: " + msg.url);

        //select until page finished loading, in increments
        setInterval(() => {
            if (!targetNode) {
                targetNode = document.querySelector('section > div > div');
                if (targetNode) {
                    console.log("Target Node:", targetNode);
                    clearInterval(this);
                }
            }
        }, 200);
        
    }
});

const options = {childList: true};

console.log("Content script loaded3");


// const callback = function (mutationList, observer) {
//     //for each mutation, 
// }

// const observer = new MutationObserver(callback);
// observer.observe(targetNode, options);