(() => {
    if (typeof window.bot === "undefined") {
        window.bot = {};
    }

    window.bot.init = function ({ chatbot_id, session_token }) {
        const chatIframe = document.createElement("iframe");
        chatIframe.setAttribute("id", "chat-iframe");
        chatIframe.setAttribute(
            "src",
            `https://carnival-chatbot.vercel.app/${chatbot_id}`
        );

        const toggleButton = document.createElement("button");
        toggleButton.setAttribute("id", "chat-toggle-button");
        toggleButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

        const styles = `
            #chat-iframe {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 400px;
                height: 500px;
                border: none;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                z-index: 9998;
                display: none;
            }
            #chat-toggle-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
                border-radius: 30px;
                background-color: #2563eb;
                color: white;
                border: none;
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            #chat-toggle-button svg {
                height: 20px;
                width: 20px;
            }
            #chat-toggle-button:hover {
                background-color: #0056b3;
            }
            @media screen and (max-width: 700px) {
                #chat-iframe {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                    z-index: 9999;
                }
            
                #chat-toggle-button {
                    bottom: 10px;
                    right: 10px;
                }

                #chat-toggle-button.close-button {
                    display: none;
                }
            }
        `;

        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        document.body.appendChild(chatIframe);
        document.body.appendChild(toggleButton);

        let isChatVisible = false;
        const isMobile = window.innerWidth <= 700;

        toggleButton.addEventListener("click", () => {
            isChatVisible = !isChatVisible;
            chatIframe.style.display = isChatVisible ? "block" : "none";

            if (isMobile) {
                toggleButton.style.display = isChatVisible ? "none" : "flex";
            } else {
                toggleButton.innerHTML = isChatVisible
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
            }

            toggleButton.classList.toggle(
                "close-button",
                isChatVisible && isMobile
            );
        });

        window.addEventListener("message", (event) => {
            if (event.data.ready) {
                chatIframe.contentWindow.postMessage(
                    { chatbot_id, session_token },
                    "*"
                );
            } else if (event.data.close) {
                isChatVisible = false;
                chatIframe.style.display = "none";
                if (isMobile) {
                    toggleButton.style.display = "flex";
                    toggleButton.classList.remove("close-button");
                } else {
                    toggleButton.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
                }
            }
        });
    };
})();
