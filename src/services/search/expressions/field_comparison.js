"use strict";

const NoteSet = require('../note_set');
const noteCache = require('../../note_cache/note_cache');

class FieldComparisonExp {
    constructor(attributeType, attributeName, comparator) {
        this.attributeType = attributeType;
        this.attributeName = attributeName;
        this.comparator = comparator;
    }

    execute(noteSet) {
        const attrs = noteCache.findAttributes(this.attributeType, this.attributeName);
        const resultNoteSet = new NoteSet();

        for (const attr of attrs) {
            const note = attr.note;

            if (noteSet.hasNoteId(note.noteId) && this.comparator(attr.value)) {
                if (attr.isInheritable) {
                    resultNoteSet.addAll(note.subtreeNotesIncludingTemplated);
                }
                else if (note.isTemplate) {
                    resultNoteSet.addAll(note.templatedNotes);
                }
                else {
                    resultNoteSet.add(note);
                }
            }
        }
    }
}

module.exports = FieldComparisonExp;
