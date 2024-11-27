(() => {
    if (typeof window.bot === "undefined") {
        window.bot = {};
    }

    window.bot.init = function ({ chatbot_id, access_token }) {
        const chatIframe = document.createElement("iframe");
        chatIframe.setAttribute("id", "turtle-chat-iframe");
        chatIframe.setAttribute(
            "src",
            `https://chatbot.turtlex.in/${chatbot_id}/bot`
        );

        const toggleIframe = document.createElement("iframe");
        toggleIframe.setAttribute("id", "turtle-toggle-iframe");
        toggleIframe.setAttribute(
            "src",
            `https://chatbot.turtlex.in/${chatbot_id}/toggle-button`
        );

        const mainDiv = document.createElement("div");
        mainDiv.setAttribute("id", "turtle-chatbot-container");
        mainDiv.appendChild(chatIframe);
        mainDiv.appendChild(toggleIframe);

        const is_mobile = window.innerWidth <= 700;
        let bot_visible = false;
        const original_body_overflow = document.body.style.overflow;

        const styles = `
            #turtle-chat-iframe {
                position: fixed;
                bottom: 85px;
                right: 20px;
                margin: 0px;
                padding: 0px;
                width: 250px;
                height: 0px;
                border: none;
                display: block;
                outline: none;
                z-index: 999999;
                background: transparent;
                color-scheme: none;
                transition: opacity 0.3s;
            }

            #turtle-toggle-iframe {
                display: block;
                position: fixed;
                bottom: 15px;
                right: 15px;
                width: 60px;
                height: 60px;
                border: none;
                z-index: 999999;
                background: transparent;
                color-scheme: none;
            }
        `;

        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
        document.body.appendChild(mainDiv);

        window.addEventListener("message", (event) => {
            if (event.data.ready) {
                chatIframe.contentWindow.postMessage(
                    { access_token, is_mobile, type: "initial" },
                    "*"
                );
            } else if (event.data.bot_visible !== undefined) {
                bot_visible = event.data.bot_visible;
                if (bot_visible) {
                    chatIframe.style.width = is_mobile ? "100vw" : "450px";
                    chatIframe.style.height = is_mobile ? "100%" : "650px";
                    chatIframe.style.bottom = is_mobile ? "0px" : "90px";
                    chatIframe.style.right = is_mobile ? "0px" : "20px";
                    toggleIframe.style.display = is_mobile ? "none" : "block";
                    if (is_mobile) {
                        document.body.style.overflow = "hidden";
                    }
                } else {
                    chatIframe.style.width = "250px";
                    chatIframe.style.height = "0px";
                    chatIframe.style.bottom = "90px";
                    chatIframe.style.right = "20px";
                    toggleIframe.style.display = "block";
                    if (is_mobile) {
                        document.body.style.overflow = original_body_overflow;
                    }
                }
                if (event.data.source === "chat-iframe") {
                    toggleIframe.contentWindow.postMessage(
                        { type: "toggle", bot_visible },
                        "*"
                    );
                } else if (event.data.source === "toggle-iframe") {
                    chatIframe.contentWindow.postMessage(
                        { type: "toggle", bot_visible },
                        "*"
                    );
                }
            } else if (event.data.change_size) {
                if (event.data.resize_height !== undefined) {
                    chatIframe.style.height = `${event.data.resize_height}px`;
                }
                if (event.data.resize_width !== undefined) {
                    chatIframe.style.width = `${
                        event.data.resize_width === 0
                            ? 250
                            : event.data.resize_width
                    }px`;
                }
            }
        });
    };
})();
