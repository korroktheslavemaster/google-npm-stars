#!/bin/sh
rm -rf deployable
mkdir deployable
cp -r app/scripts/ deployable
cp -r app/images/ deployable
cp -r app/_locales deployable
cp app/manifest.json deployable
zip deployable.zip deployable
