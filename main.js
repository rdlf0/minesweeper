(function () {
    if (matchMedia("(display-mode: standalone)").matches) {
        let width;
        let height;
        const widthPadding = 53;
        const heightPadding = 150;
        const callback = mutations => {
            for (const mutation of mutations) {
                const widthPx = getComputedStyle(mutation.target).getPropertyValue("width");
                width = parseInt(widthPx, 10) + widthPadding;

                const heightPx = getComputedStyle(mutation.target).getPropertyValue("height");
                height = parseInt(heightPx, 10) + heightPadding;

                resizeTo(width, height);
            }
        }

        const observer = new MutationObserver(callback)
        observer.observe(document.getElementById("board"), { attributeFilter: ["style"] });

        window.addEventListener("resize", () => {
            resizeTo(width, height);
        });
    }
})();