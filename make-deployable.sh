#!/bin/sh
rm -rf deployable
mkdir deployable
cp -R app/scripts deployable/
cp -R app/images deployable/
cp -R app/_locales deployable/
cp app/manifest.json deployable/
zip deployable.zip deployable
