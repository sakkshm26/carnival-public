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

        const styles = `
            #chat-iframe {
                position: fixed;
                bottom: 0px;
                right: 0px;
                border: 0px;
                margin: 0px;
                padding: 0px;
                width: ${is_mobile ? "100%" : "450px"};
                height: 700px;
                border: none;
                display: block;
                outline: none;
                z-index: 999999;
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
            }
        });
    };
})();
