/**
 * Night mode toggle
 */
document.getElementById("dark-mode-toggle").addEventListener("click", toggleNightMode);

function toggleNightMode(e) {
    e.preventDefault();
    const state = document.body.classList.toggle('night') ? "OFF" : "ON";
    e.target.childNodes[1].textContent = state;
}

/**
 * Version fetcher
 */
function getVersion() {
    const versionEl = document.getElementById("version_string");

    fetch("http://api.github.com/repos/rdlf0/minesweeper/releases/latest", { method: "GET", headers: {} })
        .then(resp => resp.json())
        .then(body => versionEl.textContent = body.tag_name.substring(1))
}

getVersion();

/**
 * Browser dark mode - favicon switch
 */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', chooseFavIcon);

const favIcon = document.querySelector('link[rel="icon"]');
function chooseFavIcon(e) {
    favIcon.href = e.matches ? favIcon.dataset.hrefDark : favIcon.dataset.hrefLight;
}

chooseFavIcon(window.matchMedia('(prefers-color-scheme: dark)'));
