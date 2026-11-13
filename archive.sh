#!/usr/bin/env bash
# Archive installable de l'extension : dist/zerucms-rdv-<version>.zip, avec
# un dossier rdv/ à la racine (version lue dans extension.json). À déposer
# dans le module « Extensions » de l'Espace Admin du CMS, ou :
#   npm run extension -- install zerucms-rdv-<version>.zip
set -euo pipefail
cd "$(dirname "$0")"
id=$(sed -nE 's/^[[:space:]]*"id":[[:space:]]*"([^"]+)".*/\1/p' extension.json | head -1)
version=$(sed -nE 's/^[[:space:]]*"version":[[:space:]]*"([^"]+)".*/\1/p' extension.json | head -1)
[ -n "$id" ] && [ -n "$version" ] || { echo "extension.json : id ou version introuvable" >&2; exit 1; }
travail=$(mktemp -d)
trap 'rm -rf "$travail"' EXIT
mkdir "$travail/$id"
# Tout le dépôt, sauf ce qui ne sert qu'à le développer.
tar --exclude=./.git --exclude=./.github --exclude=./AGENTS.md --exclude=./dist --exclude=./archive.sh --exclude=./node_modules -cf - . | tar -xf - -C "$travail/$id"
mkdir -p dist
archive="dist/zerucms-$id-$version.zip"
rm -f "$archive"
(cd "$travail" && zip -qr - "$id") > "$archive"
echo "$archive"
