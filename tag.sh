#!/usr/bin/env zsh
zmodload zsh/mapfile
tag_root=tags.cache
tag_errors_file=$tag_root/_tag_errors.txt
mkdir -p $tag_root
touch $tag_errors_file
errored_files=( "${(f)mapfile[$tag_errors_file]}" )

echo "Skipping: $errored_files"

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
  tag_file="$tag_root/$(get_md5 $1).tags"

  if [[ ! -e $tag_file ]]; then
    if [[ ${errored_files[(r)$1]} == $1 ]]; then
      echo "Skipping $1, already errored."
      return 0
    fi

    tags=$(get_tags $1)

    if [ $? -eq 0 ]; then
      echo $tags > $tag_file
      # This is necessary because avprobe does a terrible job escaping the
      # filename field.
      echo "original_path=$1" >> $tag_file
      echo "Written to $tag_file"
    else
      echo "Errored on $1 ($tag_file) with:"
      echo $tags
      echo $1 >> $tag_errors_file
    fi

#  else
#    echo "Skipping $1 because $tag_file exists"
  fi
}

FILES_COUNT=$(find $1 -type f -name "*.mp3" | wc -l)
FILES_DONE_COUNT=0

for file in $1/**/*.mp3; do
  tag $file
  ((FILES_DONE_COUNT++))
  echo ${FILES_DONE_COUNT}/${FILES_COUNT}
done

echo 'Completed tagging files'
