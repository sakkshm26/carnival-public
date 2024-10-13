(() => {
    if (typeof window.bot === "undefined") {
        window.bot = {};
    }

    window.bot.init = function ({ chatbot_id, session_token }) {
        const chatIframe = document.createElement("iframe");
        chatIframe.setAttribute("id", "chat-iframe");
        chatIframe.setAttribute(
            "src",
            `https://carnival-chatbot.vercel.app/${chatbot_id}/bot`
        );

        const is_mobile = window.innerWidth <= 700;
        let bot_visible = false;

        const styles = `
            #chat-iframe {
                position: fixed;
                bottom: 20px;
                right: 20px;
                border: 0px;
                margin: 0px;
                padding: 0px;
                width: auto;
                height: auto;
                border: none;
                display: block;
                outline: none;
                z-index: 999999;
                background: transparent;
                transition: width 0.3s, height 0.3s;
            }
        `;

        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
        document.body.appendChild(chatIframe);

        window.addEventListener("message", (event) => {
            if (event.data.ready) {
                chatIframe.contentWindow.postMessage(
                    { chatbot_id, session_token },
                    "*"
                );
            } else if (event.data.toggle_bot) {
                bot_visible = !bot_visible;
                if (bot_visible) {
                    chatIframe.style.width = is_mobile ? "100%" : "450px";
                    chatIframe.style.height = "700px";
                    chatIframe.style.bottom = is_mobile ? "0px" : "20px";
                    chatIframe.style.right = is_mobile ? "0px" : "20px";
                    // chatIframe.style.left = is_mobile ? "0px" : "auto";
                } else {
                    chatIframe.style.width = "auto";
                    chatIframe.style.height = "auto";
                }
            }
        });
    };
})();
