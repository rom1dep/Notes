import noteDetailService from '../services/note_detail.js';
import utils from '../services/utils.js';
import server from '../services/server.js';
import toastService from "../services/toast.js";

const $dialog = $("#note-revisions-dialog");
const $list = $("#note-revision-list");
const $content = $("#note-revision-content");
const $title = $("#note-revision-title");
const $titleButtons = $("#note-revision-title-buttons");
const $eraseAllRevisionsButton = $("#note-revisions-erase-all-revisions-button");

let revisionItems = [];
let note;

export async function showCurrentNoteRevisions() {
    await showNoteRevisionsDialog(noteDetailService.getActiveTabNoteId());
}

export async function showNoteRevisionsDialog(noteId, noteRevisionId) {
    utils.closeActiveDialog();

    glob.activeDialog = $dialog;

    $dialog.modal();

    await loadNoteRevisions(noteId, noteRevisionId);
}

async function loadNoteRevisions(noteId, noteRevisionId) {
    $list.empty();
    $content.empty();

    note = noteDetailService.getActiveTabNote();
    revisionItems = await server.get(`notes/${noteId}/revisions`);

    for (const item of revisionItems) {
        $list.append($('<option>', {
            value: item.noteRevisionId,
            text: item.dateLastEdited.substr(0, 16) + (item.isErased ? ' (erased)' : '')
        }));
    }

    if (revisionItems.length > 0) {
        if (!noteRevisionId) {
            noteRevisionId = $list.find("option:first").val();
        }

        $list.val(noteRevisionId).trigger('change');
    } else {
        $title.text("No revisions for this note yet...");
    }
}

$list.on('change', async () => {
    const optVal = $list.find(":selected").val();

    const revisionItem = revisionItems.find(r => r.noteRevisionId === optVal);

    $titleButtons.empty();
    $content.empty();

    if (revisionItem.isErased) {
        $title.text('This revision has been erased');
        return;
    }

    $title.html(revisionItem.title);

    const $eraseRevisionButton = $('<button class="btn btn-sm" type="button">Erase this revision</button>');

    $eraseRevisionButton.on('click', async () => {
        const confirmDialog = await import('../dialogs/confirm.js');
        const text = 'Do you want to erase this revision? This action will erase revision title and content, but still preserve revision metadata.';

        if (await confirmDialog.confirm(text)) {
            await server.remove(`notes/${revisionItem.noteId}/revisions/${revisionItem.noteRevisionId}`);

            loadNoteRevisions(revisionItem.noteId);

            toastService.showMessage('Note revision has been erased.');
        }
    });

    $titleButtons
        .append($eraseRevisionButton)
        .append(' &nbsp; ');

    const $downloadButton = $('<button class="btn btn-sm btn-primary" type="button">Download</button>');

    $downloadButton.on('click', () => {
        utils.download(utils.getHost() + `/api/notes/${revisionItem.noteId}/revisions/${revisionItem.noteRevisionId}/download`);
    });

    $titleButtons.append($downloadButton);

    const fullNoteRevision = await server.get(`notes/${revisionItem.noteId}/revisions/${revisionItem.noteRevisionId}`);

    if (revisionItem.type === 'text') {
        $content.html(fullNoteRevision.content);
    }
    else if (revisionItem.type === 'code') {
        $content.html($("<pre>").text(fullNoteRevision.content));
    }
    else if (revisionItem.type === 'image') {
        $content.html($("<img>")
            // reason why we put this inline as base64 is that we do not want to let user to copy this
            // as a URL to be used in a note. Instead if they copy and paste it into a note, it will be a uploaded as a new note
            .attr("src", `data:${note.mime};base64,` + fullNoteRevision.content)
            .css("width", "100%"));
    }
    else if (revisionItem.type === 'file') {
        const $table = $("<table cellpadding='10'>")
            .append($("<tr>").append(
                $("<th>").text("MIME: "),
                $("<td>").text(revisionItem.mime)
            ))
            .append($("<tr>").append(
                $("<th>").text("File size:"),
                $("<td>").text(revisionItem.contentLength + " bytes")
            ));

        if (fullNoteRevision.content) {
            $table.append($("<tr>").append(
                $("<th>").text("Preview:"),
                $("<td>").append(
                    $('<pre class="file-preview-content"></pre>')
                        .text(fullNoteRevision.content)
                )
            ));
        }

        $content.html($table);
    }
    else {
        $content.text("Preview isn't available for this note type.");
    }
});

$eraseAllRevisionsButton.on('click', async () => {
    const confirmDialog = await import('../dialogs/confirm.js');
    const text = 'Do you want to erase all revision of this note? This action will erase revision title and content, but still preserve revision metadata.';

    if (await confirmDialog.confirm(text)) {
        await server.remove(`notes/${note.noteId}/revisions`);

        $dialog.modal('hide');

        toastService.showMessage('Note revisions has been erased.');
    }
});