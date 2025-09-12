WeasyPrint System Dependencies

To generate PDFs locally (outside Docker), WeasyPrint requires native libraries:

- Pango (and pangoft2)
- Cairo
- HarfBuzz
- GDK-PixBuf
- libffi
- MIME database (shared-mime-info)

macOS (Homebrew)

- Install dependencies:
  - `brew install pango cairo gdk-pixbuf harfbuzz libffi shared-mime-info`
- Ensure the dynamic loader can see Homebrew libraries (Apple Silicon installs under `/opt/homebrew`):
  - `export DYLD_LIBRARY_PATH=/opt/homebrew/lib:${DYLD_LIBRARY_PATH}`
  - Our `make dev` target already prepends `/opt/homebrew/lib` for convenience.

Ubuntu/Debian

- Install dependencies:
  - `sudo apt-get update`
  - `sudo apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf-2.0-0 libharfbuzz0b libcairo2 libffi-dev shared-mime-info`

Windows

- Easiest path: run the backend via Docker (our `backend/Dockerfile` installs all deps).
- Otherwise, install GTK/Pango/Cairo from official binaries (refer to WeasyPrint docs), and ensure they are in your PATH.

Alternative: Use Docker for Local Dev

- `docker compose up -d` will build the API container using `backend/Dockerfile` which installs all the above packages.

Troubleshooting

- Error contains `cannot load library 'libpango-1.0-0'`:
  - On macOS, run `brew install pango` and ensure `DYLD_LIBRARY_PATH` includes `/opt/homebrew/lib`.
  - On Ubuntu, ensure the packages listed above are installed.
- If the server starts but PDF endpoints fail, double-check the native deps and restart your shell so environment variables take effect.

References

- WeasyPrint installation: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation
- WeasyPrint troubleshooting: https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#troubleshooting

