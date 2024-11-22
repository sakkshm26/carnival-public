(() => {
    if (typeof window.bot === "undefined") {
        window.bot = {};
    }

    window.bot.init = function ({ chatbot_id, access_token }) {
        const chatIframe = document.createElement("iframe");
        chatIframe.setAttribute("id", "chat-iframe");
        chatIframe.setAttribute(
            "src",
            `https://chatbot.turtlex.in/${chatbot_id}/bot`
        );

        const is_mobile = window.innerWidth <= 700;
        let bot_visible = false;
        const original_body_overflow = document.body.style.overflow;

        const styles = `
            #chat-iframe {
                position: fixed;
                bottom: 0px;
                right: 0px;
                margin: 0px;
                padding: 0px;
                width: auto;
                height: 200px;
                border: none;
                display: block;
                outline: none;
                z-index: 999999;
                background: transparent;
                color-scheme: none;
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
                    { access_token, is_mobile },
                    "*"
                );
            } else if (event.data.bot_visible !== undefined) {
                bot_visible = event.data.bot_visible;
                if (bot_visible) {
                    chatIframe.style.width = is_mobile ? "100vw" : "450px";
                    chatIframe.style.height = is_mobile ? "100%" : "700px";
                    if (is_mobile) {
                        document.body.style.overflow = "hidden";
                    }
                } else {
                    chatIframe.style.width = "auto";
                    chatIframe.style.height = "auto";
                    if (is_mobile) {
                        document.body.style.overflow = original_body_overflow;
                    }
                }
            }
        });
    };
})();
