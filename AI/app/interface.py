import ctypes
import threading
import tkinter as tk
from tkinter import font as tkfont
from tkinter import messagebox

from pynput import keyboard as pynput_keyboard

from jarvis import ask_jarvis, extract_facts_via_llm
from voice import Recorder, transcribe as transcribe_audio


# ============================================================
# SETTINGS
# ============================================================

HOTKEY = "<ctrl>+<space>"

WINDOW_WIDTH = 520
WINDOW_HEIGHT = 380

BG_COLOR = "#0d1117"
PANEL_COLOR = "#161b22"
ACCENT_COLOR = "#58a6ff"
TEXT_COLOR = "#e6edf3"
MUTED_COLOR = "#8b949e"
INPUT_PLACEHOLDER = "Type a message..."

# Disabled for now because FocusOut can interfere with typing.
HIDE_ON_FOCUS_LOST = False

SINGLE_INSTANCE_MUTEX = "Local\\JarvisPopupSingleton"
ERROR_ALREADY_EXISTS = 183
INSTANCE_MUTEX = None


def acquire_single_instance():

    global INSTANCE_MUTEX

    INSTANCE_MUTEX = ctypes.windll.kernel32.CreateMutexW(
        None,
        False,
        SINGLE_INSTANCE_MUTEX
    )

    if ctypes.windll.kernel32.GetLastError() == ERROR_ALREADY_EXISTS:
        return False

    return True


# ============================================================
# POPUP APP
# ============================================================

class JarvisPopup:

    def __init__(self):

        self.conversation = []
        self.visible = True
        self.busy = False
        self.input_is_placeholder = True
        self.is_recording = False
        self.recorder = None

        # ----------------------------------------------------
        # CREATE WINDOW
        # ----------------------------------------------------

        self.root = tk.Tk()

        self.root.title("JARVIS")

        # Borderless window
        self.root.overrideredirect(True)

        # Always on top
        self.root.attributes("-topmost", True)

        # Background
        self.root.configure(bg=BG_COLOR)

        # Window size
        self.root.geometry(
            f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}"
        )

        # Slight transparency
        try:
            self.root.attributes("-alpha", 0.97)
        except tk.TclError:
            pass

        # ----------------------------------------------------
        # BUILD UI
        # ----------------------------------------------------

        self._build_window()

        self._append(
            "JARVIS:",
            "Ready. How may I assist you?",
            "jarvis"
        )

        self._center_window()

        # ----------------------------------------------------
        # KEYBOARD EVENTS
        # ----------------------------------------------------

        self.root.bind(
            "<Escape>",
            lambda event: self.hide()
        )

        # ----------------------------------------------------
        # GLOBAL HOTKEY
        # ----------------------------------------------------

        self.hotkey_listener = pynput_keyboard.GlobalHotKeys({
            HOTKEY: self._request_toggle
        })

        self.hotkey_listener.start()

        self.root.after(
            50,
            self._focus_entry
        )


    # ========================================================
    # BUILD WINDOW
    # ========================================================

    def _build_window(self):

        root = self.root

        root.grid_rowconfigure(1, weight=1)
        root.grid_columnconfigure(0, weight=1)

        # ----------------------------------------------------
        # FONTS
        # ----------------------------------------------------

        title_font = tkfont.Font(
            family="Segoe UI",
            size=11,
            weight="bold"
        )

        body_font = tkfont.Font(
            family="Segoe UI",
            size=10
        )

        # ----------------------------------------------------
        # TOP BAR
        # ----------------------------------------------------

        top_bar = tk.Frame(
            root,
            bg=PANEL_COLOR,
            height=38
        )

        top_bar.grid(
            row=0,
            column=0,
            sticky="ew"
        )

        top_bar.pack_propagate(False)

        # JARVIS title

        title = tk.Label(
            top_bar,
            text="JARVIS",
            bg=PANEL_COLOR,
            fg=ACCENT_COLOR,
            font=title_font
        )

        title.pack(
            side="left",
            padx=12,
            pady=8
        )

        # Close button

        close_btn = tk.Label(
            top_bar,
            text="×",
            bg=PANEL_COLOR,
            fg=MUTED_COLOR,
            font=tkfont.Font(
                family="Segoe UI",
                size=16
            ),
            cursor="hand2"
        )

        close_btn.pack(
            side="right",
            padx=10
        )

        close_btn.bind(
            "<Button-1>",
            lambda event: self.hide()
        )

        # ----------------------------------------------------
        # DRAGGING
        # ----------------------------------------------------

        top_bar.bind(
            "<ButtonPress-1>",
            self._start_drag
        )

        top_bar.bind(
            "<B1-Motion>",
            self._do_drag
        )

        title.bind(
            "<ButtonPress-1>",
            self._start_drag
        )

        title.bind(
            "<B1-Motion>",
            self._do_drag
        )

        # ----------------------------------------------------
        # RESPONSE AREA
        # ----------------------------------------------------

        output_frame = tk.Frame(
            root,
            bg=BG_COLOR
        )

        output_frame.grid(
            row=1,
            column=0,
            sticky="nsew",
            padx=8,
            pady=(8, 4)
        )

        self.output = tk.Text(
            output_frame,

            bg=BG_COLOR,
            fg=TEXT_COLOR,

            insertbackground=TEXT_COLOR,

            font=body_font,

            wrap="word",

            relief="flat",
            borderwidth=0,

            padx=12,
            pady=10,

            state="disabled"
        )

        self.output.pack(
            fill="both",
            expand=True
        )

        # Text colors

        self.output.tag_configure(
            "you",
            foreground=MUTED_COLOR
        )

        self.output.tag_configure(
            "jarvis",
            foreground=ACCENT_COLOR
        )

        # ----------------------------------------------------
        # INPUT AREA
        # ----------------------------------------------------

        input_frame = tk.Frame(
            root,
            bg=BG_COLOR
        )

        input_frame.grid(
            row=2,
            column=0,
            sticky="ew",
            padx=8,
            pady=(0, 8)
        )

        # Mic button (voice input) - packed first so it sits on
        # the right; the entry then fills the remaining space.

        self.mic_btn = tk.Label(
            input_frame,
            text="\U0001F3A4",
            bg=PANEL_COLOR,
            fg=MUTED_COLOR,
            font=tkfont.Font(family="Segoe UI", size=12),
            cursor="hand2",
            width=3
        )

        self.mic_btn.pack(
            side="right",
            padx=(6, 2),
            fill="y"
        )

        self.mic_btn.bind(
            "<Button-1>",
            self._toggle_recording
        )

        # Entry

        self.entry = tk.Entry(
            input_frame,

            bg=PANEL_COLOR,
            fg=TEXT_COLOR,

            insertbackground=TEXT_COLOR,

            font=body_font,

            relief="flat",
            borderwidth=0,

            highlightthickness=1,
            highlightbackground="#30363d",
            highlightcolor=ACCENT_COLOR
        )

        self.entry.pack(
            side="left",
            fill="x",
            expand=True,
            ipady=10,
            padx=2
        )

        self.entry.insert(
            0,
            INPUT_PLACEHOLDER
        )

        self.entry.configure(
            fg=MUTED_COLOR
        )

        # Enter sends message

        self.entry.bind(
            "<Return>",
            self._on_submit
        )

        # Prevent mouse clicks from being ignored

        self.entry.bind(
            "<Button-1>",
            self._entry_clicked
        )

        self.entry.bind(
            "<FocusIn>",
            self._clear_placeholder
        )

        self.entry.bind(
            "<FocusOut>",
            self._restore_placeholder
        )


    # ========================================================
    # ENTRY FOCUS
    # ========================================================

    def _entry_clicked(self, event):

        self.root.lift()
        self.root.attributes("-topmost", True)
        self._activate_window()
        self.entry.focus_force()


    def _clear_placeholder(self, event=None):

        if not self.input_is_placeholder:
            return

        self.entry.delete(
            0,
            "end"
        )

        self.entry.configure(
            fg=TEXT_COLOR
        )

        self.input_is_placeholder = False


    def _restore_placeholder(self, event=None):

        if self.entry.get().strip():
            return

        self.entry.insert(
            0,
            INPUT_PLACEHOLDER
        )

        self.entry.configure(
            fg=MUTED_COLOR
        )

        self.input_is_placeholder = True


    # ========================================================
    # CENTER WINDOW
    # ========================================================

    def _center_window(self):

        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()

        x = (screen_w - WINDOW_WIDTH) // 2
        y = (screen_h - WINDOW_HEIGHT) // 3

        self.root.geometry(
            f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}"
        )


    # ========================================================
    # DRAGGING
    # ========================================================

    def _start_drag(self, event):

        self._drag_x = event.x
        self._drag_y = event.y


    def _do_drag(self, event):

        x = (
            self.root.winfo_x()
            + (event.x - self._drag_x)
        )

        y = (
            self.root.winfo_y()
            + (event.y - self._drag_y)
        )

        self.root.geometry(
            f"+{x}+{y}"
        )


    # ========================================================
    # HOTKEY
    # ========================================================

    def _request_toggle(self):

        # pynput runs on another thread.
        # Tkinter must only be accessed from its main thread.

        self.root.after(
            0,
            self.toggle
        )


    def toggle(self):

        if self.visible:
            self.hide()
        else:
            self.show()


    # ========================================================
    # SHOW
    # ========================================================

    def show(self):

        self._center_window()

        # Show window

        self.root.deiconify()

        # Keep on top

        self.root.lift()

        self.root.attributes(
            "-topmost",
            True
        )

        self.visible = True

        # Force the window to receive keyboard focus

        self.root.after(
            50,
            self._focus_entry
        )

        # Force redraw

        self.root.after(
            100,
            self._force_redraw
        )


    # ========================================================
    # FORCE INPUT FOCUS
    # ========================================================

    def _focus_entry(self):

        if not self.visible:
            return

        self.root.deiconify()

        self.root.lift()

        self.root.attributes(
            "-topmost",
            True
        )

        self.root.update_idletasks()

        self._activate_window()
        self.root.focus_force()
        self.entry.focus_force()


    def _activate_window(self):

        try:
            ctypes.windll.user32.SetForegroundWindow(
                self.root.winfo_id()
            )
        except (AttributeError, tk.TclError):
            pass


    # ========================================================
    # FORCE REDRAW
    # ========================================================

    def _force_redraw(self):

        if not self.visible:
            return

        x = self.root.winfo_x()
        y = self.root.winfo_y()

        self.root.geometry(
            f"+{x + 1}+{y}"
        )

        self.root.after(
            10,
            lambda: self.root.geometry(
                f"+{x}+{y}"
            )
        )


    # ========================================================
    # HIDE
    # ========================================================

    def hide(self):

        self.root.withdraw()

        self.visible = False


    # ========================================================
    # GUI CONFIRMATION (for write_file / create_directory /
    # open_application / run_command tool approvals)
    # ========================================================
    #
    # ask_jarvis() calls this from a BACKGROUND thread whenever a
    # tool needs approval. Tkinter widgets can only be touched
    # from the main thread, so this hands the actual dialog off
    # to the main thread via root.after(), then blocks only the
    # background thread (never the UI) until Yes/No is clicked.
    # Without this, ask_jarvis() falls back to console_confirm(),
    # which waits on input() in a console window you likely
    # aren't watching.

    def gui_confirm(self, action_description, details=""):

        result = {}
        answered = threading.Event()

        def ask_on_main_thread():

            text = action_description

            if details:

                preview = (
                    details
                    if len(details) <= 800
                    else details[:800] + "\n...(truncated)..."
                )

                text = f"{text}\n\n{preview}"

            # Make sure the popup is visible and focused so the
            # dialog doesn't appear hidden behind other windows.

            if not self.visible:
                self.show()

            self.root.lift()
            self.root.attributes("-topmost", True)
            self._activate_window()

            result["approved"] = messagebox.askyesno(
                "JARVIS wants permission",
                text,
                parent=self.root
            )

            answered.set()

        self.root.after(0, ask_on_main_thread)

        answered.wait()

        return result.get("approved", False)


    # ========================================================
    # VOICE INPUT (click mic to start, click again to stop)
    # ========================================================

    def _toggle_recording(self, event=None):

        if self.busy:
            return

        if not self.is_recording:
            self._start_recording()
        else:
            self._stop_recording()


    def _start_recording(self):

        try:
            self.recorder = Recorder()
            self.recorder.start()
        except Exception as e:
            self._append("JARVIS:", f"Couldn't access the microphone: {e}", "jarvis")
            return

        self.is_recording = True

        self.mic_btn.configure(fg="#ff6b6b")

        self._clear_placeholder()
        self.entry.delete(0, "end")
        self.entry.insert(0, "Listening... click the mic again to stop")
        self.entry.configure(state="disabled")


    def _stop_recording(self):

        self.is_recording = False
        self.mic_btn.configure(fg=MUTED_COLOR)

        audio = None

        if self.recorder is not None:
            audio = self.recorder.stop()
            self.recorder = None

        self.entry.configure(state="normal")
        self.entry.delete(0, "end")
        self.entry.insert(0, "Transcribing...")
        self.entry.configure(fg=MUTED_COLOR)

        threading.Thread(
            target=self._transcribe_and_fill,
            args=(audio,),
            daemon=True
        ).start()


    def _transcribe_and_fill(self, audio):

        text = ""

        try:
            text = transcribe_audio(audio)
        except Exception as e:
            self.root.after(
                0,
                lambda: self._append("JARVIS:", f"Transcription failed: {e}", "jarvis")
            )

        self.root.after(0, self._fill_transcribed_text, text)


    def _fill_transcribed_text(self, text):

        self.entry.delete(0, "end")

        if text:
            self.entry.insert(0, text)
            self.entry.configure(fg=TEXT_COLOR)
            self.input_is_placeholder = False
        else:
            self.entry.insert(0, INPUT_PLACEHOLDER)
            self.entry.configure(fg=MUTED_COLOR)
            self.input_is_placeholder = True

        if self.visible:
            self.entry.focus_set()




    # ========================================================
    # APPEND TEXT
    # ========================================================

    def _append(
        self,
        label,
        text,
        tag
    ):

        self.output.configure(
            state="normal"
        )

        self.output.insert(
            "end",
            f"{label} ",
            tag
        )

        self.output.insert(
            "end",
            f"{text}\n\n"
        )

        self.output.configure(
            state="disabled"
        )

        self.output.see(
            "end"
        )


    # ========================================================
    # SUBMIT MESSAGE
    # ========================================================

    def _on_submit(self, event=None):

        # Don't allow another request while JARVIS
        # is processing the previous one.

        if self.busy:
            return "break"

        if self.input_is_placeholder:
            return "break"

        message = self.entry.get().strip()

        if not message:
            return "break"

        # Clear input

        self.entry.delete(
            0,
            "end"
        )

        # Show user's message

        self._append(
            "You:",
            message,
            "you"
        )

        # Mark busy

        self.busy = True

        # Show thinking

        self._append(
            "JARVIS:",
            "…thinking",
            "jarvis"
        )

        # Run AI request in background

        threading.Thread(
            target=self._get_response,
            args=(message,),
            daemon=True
        ).start()

        return "break"


    # ========================================================
    # GET AI RESPONSE
    # ========================================================

    def _get_response(self, message):

        try:

            # Ask JARVIS
            # confirm_callback=self.gui_confirm routes any
            # write_file / create_directory / open_application /
            # run_command approval prompt through this popup
            # instead of the console.

            answer = ask_jarvis(
                message,
                self.conversation,
                confirm_callback=self.gui_confirm
            )

            # Make sure answer is a string

            if answer is None:
                answer = "I received no response, sir."

            answer = str(answer)

            # Save conversation

            self.conversation.append({
                "role": "user",
                "content": message
            })

            self.conversation.append({
                "role": "assistant",
                "content": answer
            })

            # Keep last 10 messages

            if len(self.conversation) > 10:

                self.conversation = (
                    self.conversation[-10:]
                )

            # Automatic memory capture

            threading.Thread(
                target=extract_facts_via_llm,
                args=(message,),
                daemon=True
            ).start()

            # Update UI on Tkinter main thread

            self.root.after(
                0,
                self._show_response,
                answer
            )

        except Exception as e:

            error_message = (
                "An unexpected error occurred:\n"
                f"{e}"
            )

            self.root.after(
                0,
                self._show_response,
                error_message
            )


    # ========================================================
    # DISPLAY RESPONSE
    # ========================================================

    def _show_response(self, answer):

        # Remove the "thinking" message.

        self.output.configure(
            state="normal"
        )

        try:

            self.output.delete(
                "end-3l",
                "end-1l"
            )

        except tk.TclError:
            pass

        self.output.configure(
            state="disabled"
        )

        # Display response

        self._append(
            "JARVIS:",
            answer,
            "jarvis"
        )

        # Allow another message

        self.busy = False

        # Return focus to input

        if self.visible:

            self.entry.focus_force()


    # ========================================================
    # RUN
    # ========================================================

    def run(self):

        try:

            self.root.mainloop()

        finally:

            try:
                self.hotkey_listener.stop()
            except Exception:
                pass


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    if not acquire_single_instance():
        raise SystemExit(
            "JARVIS is already running."
        )

    app = JarvisPopup()

    app.run()