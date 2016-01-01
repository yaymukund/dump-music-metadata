#!/usr/bin/env zsh
# http://stackoverflow.com/a/677212
command_exists() {
  type "$1" &> /dev/null
}

get_md5() {
  if command_exists md5; then
    md5 -qs $1
  else
    echo $1 | md5sum | awk '{ print $1 }'
  fi
}

tag() {
  tag_file="tags.cache/$(get_md5 $1).json"

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
