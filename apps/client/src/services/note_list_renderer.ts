import type FNote from "../entities/fnote.js";
import CalendarView from "../widgets/view_widgets/calendar_view.js";
import ListOrGridCards from "../widgets/view_widgets/list_or_grid_cards.js";
import TableView from "../widgets/view_widgets/table_view.js";
import type { ViewModeArgs } from "../widgets/view_widgets/view_mode.js";
import type ViewMode from "../widgets/view_widgets/view_mode.js";

export type ViewCardsOptions = "list-cards" | "grid-cards"
export type ViewTypeOptions = ViewCardsOptions | "calendar" | "table";

export default class NoteListRenderer {

    private viewType: ViewTypeOptions;
    public viewMode: ViewMode | null;

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, noteIds: string[], showNotePath: boolean = false) {
        this.viewType = this.#getViewType(parentNote);
        const args: ViewModeArgs = {
            $parent,
            parentNote,
            noteIds,
            showNotePath
        };

        if (this.viewType === "list-cards" || this.viewType === "grid-cards") {
            this.viewMode = new ListOrGridCards(this.viewType, args);
        } else if (this.viewType === "calendar") {
            this.viewMode = new CalendarView(args);
        } else if (this.viewType === "table") {
            this.viewMode = new TableView(args);
        } else {
            this.viewMode = null;
        }
    }

    #getViewType(parentNote: FNote): ViewTypeOptions {
        const viewType = parentNote.getLabelValue("viewType");

        if (!["list-cards", "grid-cards", "calendar", "table"].includes(viewType || "")) {
            // when not explicitly set, decide based on the note type
            return parentNote.type === "search" ? "list-cards" : "grid-cards";
        } else {
            return viewType as ViewTypeOptions;
        }
    }

    get isFullHeight() {
        return this.viewMode?.isFullHeight;
    }

    async renderList() {
        if (!this.viewMode) {
            return null;
        }

        return await this.viewMode.renderList();
    }

}

