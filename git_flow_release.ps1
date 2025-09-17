# Git Flow Release

# variable: "${version}" = 0.2.250917
# variable: "${main_branch}" = main
# variable: "${dev_branch}" = develop

$env:GIT_EDITOR='Notepad2.exe'

# make sure there are no uncommitted changes
git status

git fetch

# the ${main_branch} branch must be up-to-date.
git switch ${main_branch}
git pull
git status

# release must be done from the ${dev_branch} branch
git switch ${dev_branch}

# the ${dev_branch} branch must be up-to-date, also.
git pull
git status

# start the release
git flow release start "v${version}"

# before continuing, update project version.
fsr.exe -regex -file 'package.json' -find '"version": "(\d+)\.(\d+)\.(\d+)",' -replace '"version": "${version}",'

# view the changed (project) files
git status

# add and commit the package.json file (version) changes
git add .
git commit -m "Updated project version to v${version}."

# complete the release (will ask for a description)
git flow release finish "v${version}"

# push the changes and tags (currently in ${dev_branch} branch)
git push
git push --tags

# push the ${main_branch} branch
git switch ${main_branch}
git push

# Build the the release files!
vsce package

# go back to the ${dev_branch} branch
git switch ${dev_branch}
