import { BOARD_CONFIG, Config, MODE_NAME } from "./config";
import { EVENT_SETTINGS_CHANGED, PubSub } from "./util/pub-sub";

export class Settings {

    constructor(private el: HTMLElement, private config: Config) {
        this.draw();
    }

    private draw() {
        this.el.textContent = "";

        Object.keys(MODE_NAME).forEach(modeKey => {
            const modeValue = MODE_NAME[modeKey];
            if (BOARD_CONFIG[modeValue] == null) {
                return;
            }

            const rows = BOARD_CONFIG[modeValue].rows;
            const cols = BOARD_CONFIG[modeValue].cols;
            const mines = BOARD_CONFIG[modeValue].mines;
            const current = rows == BOARD_CONFIG[this.config.mode].rows &&
                cols == BOARD_CONFIG[this.config.mode].cols &&
                mines == BOARD_CONFIG[this.config.mode].mines;

            const m = document.createElement("div");
            m.setAttribute("data-modeName", modeValue)
            m.setAttribute("data-modeRows", rows)
            m.setAttribute("data-modeCols", cols)
            m.setAttribute("data-modeMines", mines)
            m.addEventListener("click", this.updateConfig.bind(this));
            if (current) {
                m.style.fontWeight = "bold";
                m.style.color = "#ff0000";
            }
            m.innerText = modeKey;

            const r = document.createElement("div");
            r.innerText = `Rows: ${rows}`;
            m.appendChild(r);

            const c = document.createElement("div");
            c.innerText = `Columns: ${cols}`;
            m.appendChild(c);

            const mn = document.createElement("div");
            mn.innerText = `Mines: ${mines}`;
            m.appendChild(mn);

            this.el.appendChild(m);
        });

        const btn = document.createElement("button")
        btn.addEventListener("click", this.publishConfig.bind(this))
        btn.innerHTML = "PLAY"

        this.el.appendChild(btn);
    }

    private updateConfig(e) {
        this.config.mode = e.target.getAttribute("data-modeName");
    }

    private publishConfig(e) {
        PubSub.publish(EVENT_SETTINGS_CHANGED, this.config);
        this.draw();
    }

}
