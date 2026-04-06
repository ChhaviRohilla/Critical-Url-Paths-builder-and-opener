# Critical-Url-Paths-builder-and-opener
This Firefox extension accepts a domain URL as input and automatically appends commonly exposed endpoints such as .env, secrets, and other sensitive paths. It opens all generated URLs in one click, saving time and reducing manual endpoint discovery efforts.

## Example

Input: <br>
https://example.com

Generated URLs: <br>
https://example.com/.env<br>
https://example.com/.git<br>
https://example.com/secrets<br>
https://example.com/config.json<br>
https://example.com/admin<br>

All URLs open automatically in new tabs.

---

## Project Structure

pentest-url-opener/ <br>
├── manifest.json      (Extension manifest) <br>
├── popup.html         (UI) <br>
├── popup.js           (Logic) <br>
├── background.js      (Service worker) <br>

---

## Installation (Load in Firefox)

1. Open Firefox
2. Go to:
about:debugging

3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select manifest.json

The extension will now be loaded.

---

## Use Cases

- Bug bounty reconnaissance
- Sensitive endpoint discovery
- Misconfiguration detection
- Quick manual security testing
- Recon automation

---

## Who Is This For?

- Bug Bounty Hunters
- Penetration Testers
- Security Researchers
- Red Teamers

---

## Disclaimer

This tool is intended for authorized security testing and educational purposes only.
Use responsibly and only on targets you are permitted to test.

---

## Author

Built for security researchers and bug bounty hunters.
