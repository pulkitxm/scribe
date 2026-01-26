# Fixing Permission Issues

If you cannot add permissions or if the toggle won't stay active:

1.  **Open Privacy Settings**:
    Go to **System Settings > Privacy & Security > Screen Recording**.

2.  **Remove Old Entries**:
    Select `screenshot` or `terminal` if present, and click the **-** (minus) button to remove them. This forces macOS to forget the old signature.

3.  **Reset Permissions (If needed)**:
    If removing doesn't work, run this command in terminal to reset screen recording permissions for everything (Warning: you'll need to re-approve other apps):
    ```bash
    tccutil reset ScreenCapture
    ```

4.  **Re-Add**:
    - Click `+`.
    - Press **Cmd+Shift+G**.
    - Paste: `~/.local/bin/screenshot`
    - Start the service again: `make restart`
