#!/bin/sh
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_fonts_directory>"
  exit 1
fi
curl "https://fonts.googleapis.com/css2?family=Heebo:wght@100..900&display=swap" > $1/fonts.css