#!/bin/sh
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_fonts_directory>"
  exit 1
fi
curl "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap" > $1/fonts.css