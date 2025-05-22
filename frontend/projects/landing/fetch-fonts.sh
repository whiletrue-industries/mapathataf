#!/bin/sh
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_fonts_directory>"
  exit 1
fi
curl "https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap" > $1/fonts.css