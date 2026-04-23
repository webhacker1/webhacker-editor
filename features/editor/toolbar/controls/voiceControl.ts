import { createToolbarButton } from "@/features/editor/toolbar/toolbarContext";

type SpeechRecognitionAlternativeLike = {
    transcript?: string;
};

type SpeechRecognitionResultLike = {
    isFinal?: boolean;
    [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    addEventListener: (type: string, listener: (event: Event) => void) => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function resolveSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
    if (typeof window === "undefined") return null;
    const speechWindow = window as SpeechRecognitionWindow;
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function resolveVoiceLanguage(editor): string {
    const languageCode = String(editor?.editorOptions?.language || "en").toLowerCase();
    return languageCode === "ru" ? "ru-RU" : "en-US";
}

function extractStreamingTranscript(event: Event): string {
    const speechEvent = event as Event & {
        results?: ArrayLike<SpeechRecognitionResultLike>;
    };
    const results = speechEvent.results;
    if (!results || !results.length) return "";

    let transcript = "";
    for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        if (!result) continue;
        const firstAlternative = result[0];
        if (!firstAlternative || typeof firstAlternative.transcript !== "string") continue;
        transcript += firstAlternative.transcript;
    }

    return transcript;
}

function isRangeInsideEditor(editor, range: Range | null): boolean {
    return (
        Boolean(range) &&
        editor.contentEditableElement.contains(range.startContainer) &&
        editor.contentEditableElement.contains(range.endContainer)
    );
}

function ensureLiveTextNode(editor, currentNode: Text | null): Text | null {
    if (currentNode && currentNode.isConnected) return currentNode;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(editor, range)) return null;

    range.deleteContents();
    const textNode = document.createTextNode("");
    range.insertNode(textNode);

    const caretRange = document.createRange();
    caretRange.setStart(textNode, 0);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
    editor.currentSavedSelectionRange = caretRange.cloneRange();

    return textNode;
}

function placeCaretAtTextEnd(textNode: Text): void {
    const selection = window.getSelection();
    if (!selection) return;

    const caretRange = document.createRange();
    caretRange.setStart(textNode, (textNode.nodeValue || "").length);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
}

function finalizeLiveText(editor, textNode: Text | null): void {
    if (!textNode || !textNode.isConnected) return;

    const content = textNode.nodeValue || "";
    if (!content.length) {
        textNode.remove();
        editor.currentSavedSelectionRange = editor.saveSelectionRange();
        return;
    }

    if (typeof editor.captureHistorySnapshot === "function") {
        editor.captureHistorySnapshot("input");
    }
    editor.emitChange();
    editor.syncToggleStates();
}

function updateVoiceButtonState(
    buttonElement: HTMLButtonElement,
    iconElement: HTMLElement | null,
    isListening: boolean,
    idleLabel: string,
    stopLabel: string,
): void {
    const currentLabel = isListening ? stopLabel : idleLabel;
    buttonElement.setAttribute("aria-label", currentLabel);
    buttonElement.setAttribute("data-tooltip", currentLabel);
    buttonElement.setAttribute("aria-pressed", String(isListening));
    if (iconElement) iconElement.className = isListening ? "fa-solid fa-stop" : "fa-solid fa-microphone";
}

export function createVoiceControl(editor, t) {
    const voiceT = t.voice;
    const idleLabel = voiceT.start;
    const stopLabel = voiceT.stop;
    const unsupportedLabel = voiceT.unsupported;

    const SpeechRecognitionClass = resolveSpeechRecognitionConstructor();
    let recognition: SpeechRecognitionLike | null = null;
    let liveTextNode: Text | null = null;
    let isListening = false;

    const buttonElement = createToolbarButton(editor, {
        iconClassName: "fa-solid fa-microphone",
        buttonTitleText: idleLabel,
        emitChangeAfterClick: false,
        onClickHandler: () => {
            if (!SpeechRecognitionClass) return false;
            if (isListening) {
                recognition?.stop();
                return false;
            }

            if (!recognition) {
                recognition = new SpeechRecognitionClass();
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.addEventListener("result", event => {
                    const transcript = extractStreamingTranscript(event);
                    liveTextNode = ensureLiveTextNode(editor, liveTextNode);
                    if (!liveTextNode) return;

                    liveTextNode.nodeValue = transcript;
                    placeCaretAtTextEnd(liveTextNode);
                    editor.currentSavedSelectionRange = editor.saveSelectionRange();
                    editor.emitChange();
                    editor.syncToggleStates();
                });

                recognition.addEventListener("error", () => {
                    finalizeLiveText(editor, liveTextNode);
                    liveTextNode = null;
                    isListening = false;
                    updateVoiceButtonState(buttonElement, iconElement, isListening, idleLabel, stopLabel);
                });

                recognition.addEventListener("end", () => {
                    finalizeLiveText(editor, liveTextNode);
                    liveTextNode = null;
                    isListening = false;
                    updateVoiceButtonState(buttonElement, iconElement, isListening, idleLabel, stopLabel);
                });
            }

            recognition.lang = resolveVoiceLanguage(editor);
            liveTextNode = null;
            isListening = true;
            updateVoiceButtonState(buttonElement, iconElement, isListening, idleLabel, stopLabel);
            recognition.start();

            return false;
        },
    }) as HTMLButtonElement;

    const iconElement = buttonElement.querySelector("i");

    if (!SpeechRecognitionClass) {
        buttonElement.disabled = true;
        buttonElement.setAttribute("aria-disabled", "true");
        buttonElement.setAttribute("aria-label", unsupportedLabel);
        buttonElement.setAttribute("data-tooltip", unsupportedLabel);
        if (iconElement) iconElement.className = "fa-solid fa-microphone-slash";
        return buttonElement;
    }

    updateVoiceButtonState(buttonElement, iconElement, isListening, idleLabel, stopLabel);
    return buttonElement;
}
