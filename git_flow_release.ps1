# Git Flow Release

# variable: "${version}" = 0.2.250917
# variable: "${main_branch}" = main
# variable: "${dev_branch}" = develop

$env:GIT_EDITOR='Notepad2.exe'

# Make sure there are no uncommitted changes.
git status
git fetch

# The ${main_branch} must be up-to-date.
git switch ${main_branch}
git pull
git status

# The release must be done from the ${dev_branch}.
git switch ${dev_branch}

# The ${dev_branch} must be up-to-date, also.
git pull
git status

# Start the release.
git flow release start "v${version}"

# Update project file(s) versions (Version, AssemblyVersion, FileVersion, and InformationalVersion).
fsr.exe -regex -file 'package.json' -find '"version": "(\d+)\.(\d+)\.(\d+)",' -replace '"version": "${version}",'

# Verify the changed files.
git status

# Add and commit the package.json file changes
git add .
git commit -m "Updated project version to v${version}."

# Complete the release (will ask for a description).
git flow release finish "v${version}"

# Push the changes and tags (currently in ${dev_branch}).
git push
git push --tags

# Push the ${main_branch}.
git switch ${main_branch}
git push

# PUBLISH from the ${main_branch}!
vsce package

# Go back to the ${dev_branch}.
git switch ${dev_branch}
