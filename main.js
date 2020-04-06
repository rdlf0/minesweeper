/**
 * Night mode toggle
 */
document.getElementById("dark-mode-toggle").addEventListener("click", toggleNightMode);

function toggleNightMode(e) {
    e.preventDefault();
    document.body.classList.toggle('night');
    let contains = document.body.classList.contains('night');
    let state = contains ? "OFF" : "ON";
    e.target.text = "Turn dark mode " + state + "";
}

/**
 * Version fetcher
 */
function getVersion() {
    const versionEl = document.getElementById("version_string");

    fetch("http://api.github.com/repos/rdlf0/minesweeper/releases/latest", { method: "GET", headers: {} })
        .then(resp => resp.json())
        .then(body => versionEl.textContent = body.tag_name)
}

getVersion();
