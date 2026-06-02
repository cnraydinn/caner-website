(function () {
    const root = document.documentElement;
    const toggle = document.querySelector("[data-theme-toggle]");
    const label = document.querySelector("[data-theme-toggle-text]");
    const storageKey = "portfolio-theme";

    function applyTheme(theme) {
        root.dataset.theme = theme;

        if (label) {
            label.textContent = theme === "light" ? "Dark mode" : "Light mode";
        }

        if (toggle) {
            toggle.setAttribute(
                "aria-label",
                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            );
        }
    }

    const savedTheme = localStorage.getItem(storageKey);
    applyTheme(savedTheme === "light" ? "light" : "dark");

    if (toggle) {
        toggle.addEventListener("click", function () {
            const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
            localStorage.setItem(storageKey, nextTheme);
            applyTheme(nextTheme);
        });
    }
})();
