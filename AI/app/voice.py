"""
JARVIS VOICE INPUT (speech-to-text)
============================================================
Local speech-to-text using faster-whisper - runs on your own
machine, no cloud API, consistent with the rest of JARVIS.

SETUP
------------------------------------------------------------
pip install faster-whisper sounddevice numpy

The first time transcribe() runs, faster-whisper downloads the
chosen model (a few hundred MB) once and caches it locally -
after that it works fully offline, same as everything else here.

CHANGING MODEL SIZE
------------------------------------------------------------
MODEL_SIZE below controls the accuracy/speed tradeoff:
    tiny / base / small / medium / large-v3
"small" is a good default - noticeably more accurate than
"base" while still fast on a GPU. Drop to "base" or "tiny" if
transcription feels slow on your hardware.
"""

import threading

import numpy as np
import sounddevice as sd

SAMPLE_RATE = 16000
MODEL_SIZE = "small"

_model = None
_model_lock = threading.Lock()


def _get_model():
    """
    Loads the Whisper model once and reuses it. Tries GPU first,
    falls back to CPU automatically if no compatible CUDA setup
    is found.
    """

    global _model

    with _model_lock:

        if _model is not None:
            return _model

        from faster_whisper import WhisperModel

        try:
            _model = WhisperModel(MODEL_SIZE, device="cuda", compute_type="float16")
        except Exception:
            _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

        return _model


class Recorder:
    """
    Records mono 16kHz audio from the default microphone until
    stop() is called.

        recorder = Recorder()
        recorder.start()
        ...
        audio = recorder.stop()   # numpy float32 array
    """

    def __init__(self):
        self._frames = []
        self._stream = None

    def _callback(self, indata, frames, time_info, status):
        self._frames.append(indata.copy())

    def start(self):

        self._frames = []

        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
            callback=self._callback
        )

        self._stream.start()

    def stop(self):

        if self._stream is None:
            return np.array([], dtype="float32")

        self._stream.stop()
        self._stream.close()
        self._stream = None

        if not self._frames:
            return np.array([], dtype="float32")

        return np.concatenate(self._frames, axis=0).flatten()


def transcribe(audio_array):
    """
    Takes a mono float32 numpy array at 16kHz and returns the
    transcribed text. Returns "" for silence/too-short clips
    instead of sending near-empty audio to the model.
    """

    if audio_array is None or len(audio_array) == 0:
        return ""

    if len(audio_array) < SAMPLE_RATE * 0.3:
        return ""

    model = _get_model()

    segments, _info = model.transcribe(audio_array, language=None)

    return " ".join(segment.text.strip() for segment in segments).strip()