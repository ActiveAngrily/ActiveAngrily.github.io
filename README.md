# anantjamuar.me

Source and published files for [anantjamuar.me](https://anantjamuar.me).

The repository root is the GitHub Pages site. Build scripts, page templates,
and checks live in `src/`.

```sh
python3 src/build_pages.py --offline
python3 src/test_github_activity.py
node src/check.mjs
```

Run `python3 src/build_pages.py` with `GH_TOKEN` set to refresh the GitHub
activity snapshot while rebuilding the site.
