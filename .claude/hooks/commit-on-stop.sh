#!/bin/bash

# Comprobamos si hay cambios sin stagear o ficheros nuevos
if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add .
  echo "Ficheros añadidos al stage."
fi

exit 0