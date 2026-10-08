import json
import os
import shutil
import subprocess
import requests

try:
    from send2trash import send2trash
    SEND2TRASH_AVAILABLE = True
except ImportError:
    SEND2TRASH_AVAILABLE = False

# ============================================================
# JARVIS CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PERSONALITY_FILE = os.path.join(
    BASE_DIR,
    "config",
    "personality.txt"
)

MEMORY_FILE = os.path.join(
    BASE_DIR,
    "memory",
    "profile.json"
)

SERVER_URL = "http://127.0.0.1:8080/v1/chat/completions"

# The ONLY folder read_file/write_file/list_files (the "code"
# tools) are allowed to touch. Separate from the broader system
# tools below, which use a blocklist instead of a sandbox.
PROJECT_ROOT = os.path.abspath(BASE_DIR)

MAX_TOOL_ITERATIONS = 5

# Absolute paths that NO tool may ever read, write, create,
# launch from, or run commands against - regardless of
# confirmation. This is a hard block enforced in code, not
# something the model can talk its way around.
HARD_BLOCKED_PATHS = [
    r"C:\Windows",
    r"C:\Program Files",
    r"C:\Program Files (x86)",
    r"C:\ProgramData",
]


def _is_hard_blocked(path):

    normalized = os.path.normcase(os.path.abspath(path))

    # Block drive roots like C:\ or D:\ outright.
    drive, tail = os.path.splitdrive(normalized)
    if tail in ("\\", "/", ""):
        return True

    for blocked in HARD_BLOCKED_PATHS:
        blocked_norm = os.path.normcase(os.path.abspath(blocked))
        if normalized == blocked_norm or normalized.startswith(blocked_norm + os.sep):
            return True

    return False


# ============================================================
# DEFAULT MEMORY
# ============================================================

def default_memory():
    return {
        "name": "",
        "preferred_name": "",
        "location": "",
        "occupation": "",
        "education": "",
        "interests": [],
        "projects": [],
        "preferences": {},
        "important_notes": []
    }


# ============================================================
# PERSONALITY
# ============================================================

def load_personality():

    try:
        with open(PERSONALITY_FILE, "r", encoding="utf-8") as file:
            return file.read()

    except FileNotFoundError:

        return """
You are JARVIS, a sophisticated personal AI assistant.

You are calm, intelligent, respectful, helpful,
and speak like a refined gentleman.

Be concise when the question is simple.
Explain things clearly when necessary.

Never pretend that you performed an action
unless the application actually performed it.
"""


# ============================================================
# MEMORY
# ============================================================

def load_memory():

    try:

        with open(MEMORY_FILE, "r", encoding="utf-8") as file:

            memory = json.load(file)

            for key, default_value in default_memory().items():
                if key not in memory:
                    memory[key] = default_value

            return memory

    except (FileNotFoundError, json.JSONDecodeError):

        memory = default_memory()
        save_memory(memory)
        return memory


def save_memory(memory):

    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)

    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(memory, file, indent=4, ensure_ascii=False)


def format_memory(memory):
    return json.dumps(memory, indent=2, ensure_ascii=False)


# ============================================================
# MANUAL MEMORY (explicit override / force-save)
# ============================================================

def remember_fact(text):

    memory = load_memory()
    text = text.strip()

    if not text:
        return

    if text not in memory["important_notes"]:
        memory["important_notes"].append(text)

    save_memory(memory)


def is_memory_command(text):

    lower = text.lower().strip()
    prefixes = [
        "remember that ", "remember ",
        "please remember that ", "please remember ",
        "don't forget that ", "dont forget that "
    ]

    return any(lower.startswith(p) for p in prefixes)


def extract_memory(text):

    lower = text.lower().strip()
    prefixes = [
        "remember that ", "remember ",
        "please remember that ", "please remember ",
        "don't forget that ", "dont forget that "
    ]

    for prefix in prefixes:
        if lower.startswith(prefix):
            return text[len(prefix):].strip()

    return text.strip()


# ============================================================
# AUTOMATIC MEMORY EXTRACTION (no command needed)
# ============================================================

EXTRACTION_SCHEMA_HINT = """
Return ONLY valid JSON (no markdown fences, no explanation).
Include a key ONLY if it should be added or changed.
If nothing is worth remembering, return exactly: {}

Shape:
{
  "name": "string, only if the user states their real name",
  "preferred_name": "string, only if the user says what to call them",
  "location": "string, only if the user states where they live",
  "occupation": "string",
  "education": "string",
  "interests": ["new interest", "..."],
  "projects": ["new project", "..."],
  "preferences": {"favorite_x": "value"},
  "important_notes": ["standalone durable fact not covered above"]
}

Only extract facts the user stated about THEMSELVES.
Do not extract facts already identical to what is already stored.
Do not extract opinions, jokes, questions, or one-off requests.
Do not invent or guess anything not explicitly said.
"""


def extract_facts_via_llm(user_message):

    memory = load_memory()

    system_prompt = f"""
You are a silent memory-extraction module running alongside
a personal assistant. You do not talk to the user directly.

Currently stored long-term memory about the user:
{format_memory(memory)}

Your only job: read the user's latest message and decide if it
contains any new durable personal fact worth saving long-term.
Most messages will NOT contain anything worth saving.

{EXTRACTION_SCHEMA_HINT}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    try:

        response = requests.post(
            SERVER_URL,
            json={
                "messages": messages,
                "temperature": 0.0,
                "top_p": 1.0,
                "max_tokens": 300,
                "chat_template_kwargs": {"enable_thinking": False}
            },
            timeout=60
        )

        response.raise_for_status()
        data = response.json()

        if "choices" not in data or not data["choices"]:
            return

        message_data = data["choices"][0].get("message", {})
        content = str(message_data.get("content", "") or "").strip()

        if not content:
            return

        if content.startswith("```"):
            content = content.strip("`")
            if content.lower().startswith("json"):
                content = content[4:].strip()

        updates = json.loads(content)

        if not isinstance(updates, dict) or not updates:
            return

        merge_memory_updates(updates)

    except (requests.exceptions.RequestException, json.JSONDecodeError, ValueError):
        return


def merge_memory_updates(updates):

    memory = load_memory()

    for key in ["name", "preferred_name", "location", "occupation", "education"]:
        value = updates.get(key)
        if isinstance(value, str) and value.strip():
            memory[key] = value.strip()

    for item in updates.get("interests", []) or []:
        item = str(item).strip()
        if item and item not in memory["interests"]:
            memory["interests"].append(item)

    for item in updates.get("projects", []) or []:
        item = str(item).strip()
        if item and item not in memory["projects"]:
            memory["projects"].append(item)

    preferences = updates.get("preferences", {})
    if isinstance(preferences, dict):
        for pref_key, pref_value in preferences.items():
            if isinstance(pref_value, str) and pref_value.strip():
                memory["preferences"][pref_key] = pref_value.strip()

    for note in updates.get("important_notes", []) or []:
        note = str(note).strip()
        if note and note not in memory["important_notes"]:
            memory["important_notes"].append(note)

    save_memory(memory)


# ============================================================
# SHOW / CLEAR MEMORY
# ============================================================

def show_memory():

    memory = load_memory()
    print()
    print("=" * 60)
    print("JARVIS MEMORY")
    print("=" * 60)
    print(json.dumps(memory, indent=4, ensure_ascii=False))
    print("=" * 60)
    print()


def clear_memory():

    memory = default_memory()
    save_memory(memory)
    print()
    print("JARVIS: Understood, sir. My stored memory has been cleared.")
    print()


# ============================================================
# CODE ACCESS TOOLS
# ============================================================
#
# The model never touches the filesystem directly. It can only
# request a tool call; this code validates and executes it.
# read_file / list_files run immediately. write_file ALWAYS
# goes through confirm_callback first and can be denied.

def _resolve_safe_path(relative_path):
    """
    Resolves a path relative to PROJECT_ROOT and refuses anything
    that would escape it (e.g. '..\\..\\Windows\\System32').
    """

    relative_path = (relative_path or "").strip().lstrip("/\\")

    target = os.path.abspath(os.path.join(PROJECT_ROOT, relative_path))
    root = os.path.abspath(PROJECT_ROOT)

    if os.path.commonpath([target, root]) != root:
        raise ValueError(
            f"'{relative_path}' is outside the project folder and was refused."
        )

    return target


def tool_list_files(relative_path="."):

    try:
        target = _resolve_safe_path(relative_path)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.isdir(target):
        return f"Error: '{relative_path}' is not a directory."

    try:
        entries = sorted(os.listdir(target))
    except OSError as e:
        return f"Error: {e}"

    return "\n".join(entries) if entries else "(empty directory)"


def tool_read_file(relative_path):

    try:
        target = _resolve_safe_path(relative_path)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.isfile(target):
        return f"Error: '{relative_path}' is not a file."

    try:
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except OSError as e:
        return f"Error: {e}"

    max_chars = 12000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n...(truncated, file is longer)..."

    return content


def tool_write_file(relative_path, content, confirm_callback):

    try:
        target = _resolve_safe_path(relative_path)
    except ValueError as e:
        return f"Error: {e}"

    # Creating a brand-new file is non-destructive - nothing existing
    # is at risk, so no need to interrupt for approval. Overwriting a
    # file that's already there is the one case that can lose data.
    file_already_exists = os.path.isfile(target)

    if file_already_exists:
        approved = confirm_callback(f"OVERWRITE EXISTING FILE: {relative_path}", content or "")
        if not approved:
            return f"The user DENIED overwriting '{relative_path}'. Do not claim it succeeded."

    try:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(content or "")
    except OSError as e:
        return f"Error writing file: {e}"

    verb = "overwrote" if file_already_exists else "created"
    return f"Successfully {verb} '{relative_path}' ({len(content or '')} characters)."


# ------------------------------------------------------------
# SYSTEM TOOLS (broader than the project sandbox above)
# ------------------------------------------------------------
#
# These use the HARD_BLOCKED_PATHS blocklist instead of confining
# everything to PROJECT_ROOT, since finding/creating/launching
# things elsewhere on the machine is the whole point. Anything
# that changes state or runs a process still requires approval.

def tool_find_path(query, search_root=None, max_results=25):

    if not query or not query.strip():
        return "Error: no search query provided."

    root = search_root or os.path.expanduser("~")

    try:
        root = os.path.abspath(os.path.expanduser(os.path.expandvars(root)))
    except Exception:
        return "Error: invalid search root."

    if _is_hard_blocked(root):
        return f"Error: '{search_root}' is inside a protected system directory and cannot be searched."

    if not os.path.isdir(root):
        return f"Error: '{search_root or root}' is not a valid directory."

    query_lower = query.strip().lower()
    matches = []

    try:
        for dirpath, dirnames, filenames in os.walk(root):

            dirnames[:] = [
                d for d in dirnames
                if not _is_hard_blocked(os.path.join(dirpath, d))
                and d not in (".git", "node_modules", "__pycache__", ".venv")
            ]

            for name in dirnames + filenames:
                if query_lower in name.lower():
                    matches.append(os.path.join(dirpath, name))
                    if len(matches) >= max_results:
                        raise StopIteration

    except StopIteration:
        pass
    except OSError:
        pass

    if not matches:
        return f"No files or folders matching '{query}' found under {root}."

    return "\n".join(matches)


def tool_create_directory(path):

    if not path or not path.strip():
        return "Error: no path provided."

    try:
        target = os.path.abspath(os.path.expanduser(os.path.expandvars(path)))
    except Exception:
        return "Error: invalid path."

    if _is_hard_blocked(target):
        return f"Error: '{path}' is inside a protected system directory and was refused."

    already_existed = os.path.isdir(target)

    try:
        os.makedirs(target, exist_ok=True)
    except OSError as e:
        return f"Error creating directory: {e}"

    if already_existed:
        return f"Directory '{target}' already existed - nothing to do."

    return f"Successfully created directory '{target}'."


def tool_open_application(target, arguments, confirm_callback):

    if not target or not target.strip():
        return "Error: no application or path provided."

    resolved = target
    expanded = os.path.expanduser(os.path.expandvars(target))

    if os.path.isabs(expanded) or os.path.exists(expanded):
        candidate = os.path.abspath(expanded)
        if _is_hard_blocked(candidate):
            return f"Error: '{target}' is inside a protected system directory and was refused."
        resolved = candidate

    description = f"OPEN: {resolved}" + (f" {arguments}" if arguments else "")
    approved = confirm_callback(description)

    if not approved:
        return f"The user DENIED opening '{target}'."

    try:
        if arguments:
            subprocess.Popen(f'start "" "{resolved}" {arguments}', shell=True)
        else:
            os.startfile(resolved)
    except OSError as e:
        return f"Error launching '{target}': {e}"

    return f"Launched '{resolved}'."


def tool_run_command(command, confirm_callback, timeout_seconds=30):

    if not command or not command.strip():
        return "Error: no command provided."

    approved = confirm_callback(f"RUN COMMAND (as current user, not admin): {command}")

    if not approved:
        return f"The user DENIED running command: {command}"

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
    except subprocess.TimeoutExpired:
        return f"Command timed out after {timeout_seconds} seconds: {command}"
    except OSError as e:
        return f"Error running command: {e}"

    output = (result.stdout or "") + (("\n" + result.stderr) if result.stderr else "")
    output = output.strip() or "(command produced no output)"

    max_chars = 4000
    if len(output) > max_chars:
        output = output[:max_chars] + "\n...(truncated)..."

    return f"Exit code {result.returncode}.\n{output}"


def _resolve_open_path(path_str):
    """
    Resolves a path anywhere on the machine (not sandboxed to the
    project) and refuses protected system directories.
    """

    if not path_str or not path_str.strip():
        raise ValueError("No path provided.")

    target = os.path.abspath(os.path.expanduser(os.path.expandvars(path_str)))

    if _is_hard_blocked(target):
        raise ValueError(f"'{path_str}' is inside a protected system directory and was refused.")

    return target


def _send_to_trash_or_delete(target, is_dir):
    """
    Prefers the Recycle Bin (recoverable) over a permanent delete.
    Falls back to permanent deletion only if send2trash isn't
    installed, and says so in the result either way.
    """

    if SEND2TRASH_AVAILABLE:
        send2trash(target)
        return "moved to the Recycle Bin"

    if is_dir:
        shutil.rmtree(target)
    else:
        os.remove(target)

    return "permanently deleted (send2trash not installed - install it for recoverable deletes)"


def tool_delete_file(path, confirm_callback):

    try:
        target = _resolve_open_path(path)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.isfile(target):
        return f"Error: '{path}' is not a file, or does not exist."

    approved = confirm_callback(f"DELETE FILE: {target}")

    if not approved:
        return f"The user DENIED deleting '{path}'."

    try:
        outcome = _send_to_trash_or_delete(target, is_dir=False)
    except OSError as e:
        return f"Error deleting file: {e}"

    return f"'{target}' was {outcome}."


def tool_delete_directory(path, confirm_callback):

    try:
        target = _resolve_open_path(path)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.isdir(target):
        return f"Error: '{path}' is not a directory, or does not exist."

    approved = confirm_callback(f"DELETE FOLDER (and everything inside it): {target}")

    if not approved:
        return f"The user DENIED deleting '{path}'."

    try:
        outcome = _send_to_trash_or_delete(target, is_dir=True)
    except OSError as e:
        return f"Error deleting directory: {e}"

    return f"'{target}' was {outcome}."


def tool_copy_file(source, destination, confirm_callback):

    try:
        source_path = _resolve_open_path(source)
        dest_path = _resolve_open_path(destination)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.isfile(source_path):
        return f"Error: source '{source}' is not a file, or does not exist."

    dest_exists = os.path.exists(dest_path)

    if dest_exists:
        approved = confirm_callback(f"OVERWRITE by copying over existing: {dest_path}")
        if not approved:
            return f"The user DENIED overwriting '{destination}'."

    try:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(source_path, dest_path)
    except OSError as e:
        return f"Error copying file: {e}"

    return f"Copied '{source_path}' to '{dest_path}'."


def tool_move_file(source, destination, confirm_callback):

    try:
        source_path = _resolve_open_path(source)
        dest_path = _resolve_open_path(destination)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.exists(source_path):
        return f"Error: source '{source}' does not exist."

    dest_exists = os.path.exists(dest_path)

    if dest_exists:
        approved = confirm_callback(f"OVERWRITE by moving over existing: {dest_path}")
        if not approved:
            return f"The user DENIED overwriting '{destination}'."

    try:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.move(source_path, dest_path)
    except OSError as e:
        return f"Error moving file: {e}"

    return f"Moved '{source_path}' to '{dest_path}'."


def tool_get_file_info(path):

    try:
        target = _resolve_open_path(path)
    except ValueError as e:
        return f"Error: {e}"

    if not os.path.exists(target):
        return f"Error: '{path}' does not exist."

    try:
        stat = os.stat(target)
    except OSError as e:
        return f"Error: {e}"

    kind = "directory" if os.path.isdir(target) else "file"
    size_kb = stat.st_size / 1024
    from datetime import datetime
    modified = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

    return (
        f"Path: {target}\n"
        f"Type: {kind}\n"
        f"Size: {size_kb:.1f} KB\n"
        f"Last modified: {modified}"
    )


def console_confirm(action_description, details=""):
    """
    Default approval prompt: prints exactly what JARVIS wants to do
    and asks the terminal user to approve it before anything happens.
    Swap this out (e.g. for a GUI dialog) if calling from the popup UI.
    """

    print()
    print("=" * 60)
    print(f"JARVIS wants to: {action_description}")

    if details:
        print("-" * 60)
        preview = details if len(details) <= 2000 else details[:2000] + "\n...(truncated preview)..."
        print(preview)

    print("=" * 60)

    answer = input("Allow this? [y/N]: ").strip().lower()
    return answer == "y"


TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": (
                "List files and folders inside a directory within the "
                "JARVIS project. Path is relative to the project root."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "relative_path": {
                        "type": "string",
                        "description": "Directory path relative to the project root. Use '.' for the root."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": (
                "Read the contents of a text file within the JARVIS "
                "project. Path is relative to the project root."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "relative_path": {
                        "type": "string",
                        "description": "File path relative to the project root, e.g. 'app/jarvis.py'."
                    }
                },
                "required": ["relative_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": (
                "Write a text file within the JARVIS project. Creating a "
                "brand-new file happens immediately with no approval "
                "needed. Overwriting a file that already exists requires "
                "explicit user approval and may be denied."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "relative_path": {
                        "type": "string",
                        "description": "File path relative to the project root to write to."
                    },
                    "content": {
                        "type": "string",
                        "description": "The full new content of the file."
                    }
                },
                "required": ["relative_path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_path",
            "description": (
                "Search for files or folders by name anywhere on the "
                "machine (except protected system directories, which are "
                "always refused). Read-only, no approval needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Name or partial name to search for."
                    },
                    "search_root": {
                        "type": "string",
                        "description": "Optional folder to search under. Defaults to the user's home directory."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_directory",
            "description": (
                "Create a new folder anywhere on the machine (except "
                "protected system directories). Non-destructive, so this "
                "runs immediately with no approval needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Full or relative path of the directory to create."
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_application",
            "description": (
                "Launch an application, file, or folder (e.g. 'notepad', "
                "'chrome', or a full path). Runs as the current user, "
                "never elevated. ALWAYS requires explicit user approval "
                "and may be denied."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "target": {
                        "type": "string",
                        "description": "Application name or path to launch."
                    },
                    "arguments": {
                        "type": "string",
                        "description": "Optional command-line arguments to pass."
                    }
                },
                "required": ["target"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": (
                "Run a shell/CLI command and return its output. Runs as "
                "the current user, never elevated/admin. ALWAYS requires "
                "explicit user approval before executing and may be "
                "denied."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The exact shell command to run."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": (
                "Delete a single file anywhere on the machine (except "
                "protected system directories). Sent to the Recycle Bin "
                "when possible, so it can be recovered. ALWAYS requires "
                "explicit user approval and may be denied."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path of the file to delete."
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_directory",
            "description": (
                "Delete a folder and everything inside it, anywhere on "
                "the machine (except protected system directories). Sent "
                "to the Recycle Bin when possible. ALWAYS requires "
                "explicit user approval and may be denied."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path of the directory to delete."
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "copy_file",
            "description": (
                "Copy a file from one location to another. Runs "
                "immediately if the destination doesn't already exist; "
                "requires approval if it would overwrite an existing file."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "Path of the file to copy."
                    },
                    "destination": {
                        "type": "string",
                        "description": "Path to copy it to, including the filename."
                    }
                },
                "required": ["source", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "move_file",
            "description": (
                "Move or rename a file or folder. Runs immediately if "
                "the destination doesn't already exist; requires approval "
                "if it would overwrite something existing."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {
                        "type": "string",
                        "description": "Path of the file or folder to move."
                    },
                    "destination": {
                        "type": "string",
                        "description": "New path (including new name, for renames)."
                    }
                },
                "required": ["source", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_file_info",
            "description": (
                "Get basic details about a file or folder - type, size, "
                "and last modified time. Read-only, no approval needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path of the file or folder to inspect."
                    }
                },
                "required": ["path"]
            }
        }
    }
]


def execute_tool_call(name, arguments, confirm_callback):

    if name == "list_files":
        return tool_list_files(arguments.get("relative_path", "."))

    if name == "read_file":
        return tool_read_file(arguments.get("relative_path", ""))

    if name == "write_file":
        return tool_write_file(
            arguments.get("relative_path", ""),
            arguments.get("content", ""),
            confirm_callback
        )

    if name == "find_path":
        return tool_find_path(
            arguments.get("query", ""),
            arguments.get("search_root")
        )

    if name == "create_directory":
        return tool_create_directory(arguments.get("path", ""))

    if name == "open_application":
        return tool_open_application(
            arguments.get("target", ""),
            arguments.get("arguments", ""),
            confirm_callback
        )

    if name == "run_command":
        return tool_run_command(
            arguments.get("command", ""),
            confirm_callback
        )

    if name == "delete_file":
        return tool_delete_file(arguments.get("path", ""), confirm_callback)

    if name == "delete_directory":
        return tool_delete_directory(arguments.get("path", ""), confirm_callback)

    if name == "copy_file":
        return tool_copy_file(
            arguments.get("source", ""),
            arguments.get("destination", ""),
            confirm_callback
        )

    if name == "move_file":
        return tool_move_file(
            arguments.get("source", ""),
            arguments.get("destination", ""),
            confirm_callback
        )

    if name == "get_file_info":
        return tool_get_file_info(arguments.get("path", ""))

    return f"Error: unknown tool '{name}'"


# ============================================================
# ASK JARVIS (now with tool calling)
# ============================================================

def ask_jarvis(message, conversation, confirm_callback=console_confirm):

    personality = load_personality()
    memory = load_memory()

    system_prompt = f"""
{personality}

============================================================
LONG-TERM MEMORY
============================================================

The following information has been explicitly saved
about the user:

{format_memory(memory)}

============================================================
MEMORY RULES
============================================================

1. Use stored memory when it is relevant.
2. Do not invent memories.
3. Do not claim to remember something that is not present in the stored memory.
4. The application, not the AI model, controls permanent memory.
5. Treat the stored memory as user-provided information.
6. CRITICAL: every fact above belongs to the USER, never to you.
   You are always JARVIS. If asked "what is my name" or similar,
   answer as "You are [name]" or "Your name is [name]" - NEVER
   "I am [name]". Do not adopt the user's name, interests, or
   any other stored fact as your own identity.

============================================================
CODE ACCESS
============================================================

You have tools to list files, read files, and write files,
but ONLY inside the JARVIS project folder - nothing outside
it is reachable through these, even if asked.

- list_files / read_file run immediately.
- write_file ALWAYS requires the user's explicit approval and
  may be denied. If it is denied, say so plainly - never claim
  a write succeeded when it did not.

============================================================
SYSTEM ACCESS
============================================================

You also have broader tools: find_path, create_directory,
open_application, run_command, delete_file, delete_directory,
copy_file, move_file, and get_file_info. These can reach
anywhere on the machine EXCEPT protected system directories
(Windows, Program Files, ProgramData, drive roots), which are
always refused regardless of approval.

Approval is required only where something could actually be
lost or have a real side effect:
- find_path and get_file_info are read-only and run immediately.
- create_directory runs immediately (non-destructive).
- write_file, copy_file, and move_file run immediately UNLESS
  they would overwrite something that already exists, in which
  case they require approval.
- delete_file, delete_directory, open_application, and
  run_command ALWAYS require explicit approval and may be
  denied. Deletions go to the Recycle Bin when possible rather
  than being permanent.
- If approval is denied for anything, say so plainly - never
  claim an action succeeded when it did not.
- You run as the current user, NEVER as Administrator/elevated.
  If something genuinely requires elevation, say so plainly
  instead of attempting a workaround - do not try to bypass
  this.
- Only use these tools when the user's request actually needs
  you to look at, change, or run something on their system.
  Do not use them for ordinary conversation.

============================================================
CONVERSATION RULES
============================================================

- Maintain the context of the current conversation.
- Answer naturally.
- Do not repeatedly introduce yourself.
- Do not unnecessarily repeat the user's question.
- Be helpful and concise.
- If you do not know something, say so.
- Never pretend to control the computer unless the
  application actually provides that capability.
"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation)
    messages.append({"role": "user", "content": message})

    try:

        for _ in range(MAX_TOOL_ITERATIONS):

            response = requests.post(
                SERVER_URL,
                json={
                    "messages": messages,
                    "tools": TOOLS_SCHEMA,
                    "tool_choice": "auto",
                    "temperature": 0.6,
                    "top_p": 0.95,
                    "max_tokens": 512,
                    "chat_template_kwargs": {"enable_thinking": False}
                },
                timeout=300
            )

            response.raise_for_status()
            data = response.json()

            if "choices" not in data or not data["choices"]:
                return "I received an unexpected response from the AI server, sir."

            choice = data["choices"][0]
            message_data = choice.get("message", {})
            tool_calls = message_data.get("tool_calls")

            if not tool_calls:

                content = str(message_data.get("content", "") or "").strip()

                if not content:
                    reasoning = message_data.get("reasoning_content", "")
                    if reasoning:
                        content = str(reasoning).strip()

                if not content:
                    return "I apologize, sir. The model returned an empty response."

                return content

            # Model requested one or more tool calls.
            messages.append(message_data)

            for call in tool_calls:

                func = call.get("function", {})
                name = func.get("name", "")
                raw_args = func.get("arguments", "{}")

                try:
                    arguments = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
                except json.JSONDecodeError:
                    arguments = {}

                result = execute_tool_call(name, arguments, confirm_callback)

                messages.append({
                    "role": "tool",
                    "tool_call_id": call.get("id", ""),
                    "name": name,
                    "content": result
                })

        return "I wasn't able to finish that within the allowed number of steps, sir."

    except requests.exceptions.ConnectionError:
        return (
            "I cannot connect to the local AI server, sir.\n"
            "Please make sure llama-server is running."
        )

    except requests.exceptions.Timeout:
        return "The model took too long to respond, sir."

    except requests.exceptions.HTTPError as e:
        return f"The AI server returned an HTTP error, sir.\n{e}"

    except requests.exceptions.RequestException as e:
        return f"I encountered a connection problem, sir.\n{e}"

    except Exception as e:
        return f"An unexpected error occurred, sir.\n{e}"


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("                 JARVIS")
    print("          Local AI Assistant")
    print("=" * 60)
    print()

    print("JARVIS: Good day, sir.")
    print("JARVIS: Local systems are ready.")
    print()

    print("Commands:")
    print("  /memory         View stored memory")
    print("  /clear-memory   Clear stored memory")
    print("  /help           Show commands")
    print("  exit            Close JARVIS")
    print()

    conversation = []

    while True:

        try:
            user_input = input("You: ").strip()

        except (KeyboardInterrupt, EOFError):
            print()
            print("JARVIS: Until next time, sir.")
            print()
            break

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit", "/exit"]:
            print()
            print("JARVIS: Until next time, sir.")
            print()
            break

        if user_input.lower() == "/help":
            print()
            print("JARVIS COMMANDS")
            print("-" * 40)
            print("/memory")
            print("  Show everything currently stored.")
            print()
            print("/clear-memory")
            print("  Delete all stored user memory.")
            print()
            print("remember that ...")
            print("  Force-save a note verbatim.")
            print()
            print("JARVIS can also read and (with your approval)")
            print("write files inside this project when asked.")
            print()
            print("exit")
            print("  Close JARVIS.")
            print()
            continue

        if user_input.lower() == "/memory":
            show_memory()
            continue

        if user_input.lower() == "/clear-memory":
            clear_memory()
            continue

        if is_memory_command(user_input):

            fact = extract_memory(user_input)

            if fact:
                remember_fact(fact)
                print()
                print("JARVIS: I'll remember that, sir.")
                print()

            continue

        answer = ask_jarvis(user_input, conversation)

        print()
        print("JARVIS:", answer)
        print()

        extract_facts_via_llm(user_input)

        conversation.append({"role": "user", "content": user_input})
        conversation.append({"role": "assistant", "content": answer})

        if len(conversation) > 10:
            conversation = conversation[-10:]


if __name__ == "__main__":
    main()