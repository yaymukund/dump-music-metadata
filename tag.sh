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

get_tags() {
  avprobe -loglevel quiet \
          -show_format "$1"
}

tag() {
  tag_file="tags.cache/$(get_md5 $1).tags"

  if [[ ! -e $tag_file ]]; then
    echo "Tagging $1"

    tags=$(get_tags $1)

    if [ $? -eq 0 ]; then
      echo $tags > $tag_file
    else
      echo "Errored on $1 ($tag_file) with:" > tag.error.log
      echo $tags > tag.error.log
    fi

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
