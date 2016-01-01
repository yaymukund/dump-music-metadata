#!/usr/bin/env zsh
tag() {
  tag_file="tags.cache/$(md5 -qs $1).json"

  if [[ ! -e $tag_file ]]; then
    echo "Tagging $1"
    avprobe -loglevel quiet \
            -of json \
            -show_format "$1" > $tag_file
  # else
  #   echo "Skipping $1 because $tag_file exists"
  fi
}

mkdir -p tags.cache

for file in $1/**/*.mp3; do
  tag $file
done

node process-tags.js tags.cache $1
echo 'Completed tagging files'
