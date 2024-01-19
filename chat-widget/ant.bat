@echo off
setlocal EnableDelayedExpansion

:: Set the source and destination directories
set "sourceDirectory=C:\src\forks\omnichannel-chat-widget\chat-widget"
set "destinationDirectory=C:\src\CRM.OmniChannel.LiveChatWidget\src"

:: Change to the specified source directory
::cd /d "%sourceDirectory%"

:: Remove all .tgz files
del  *.tgz

::run yarn build and save the result in a variable
for /f "delims=" %%a in ('yarn build') do set "result=%%a"

echo "build of LCW is done"

::run yarn pack and save the result in a variable and print the result
for /f "delims=" %%a in ('yarn pack') do set "result=%%a"

echo "pack of LCW is done"

:: delete all tgz files in the destination directory
del "%destinationDirectory%\*.tgz"

echo "tgz files deleted in destination directory"

::copy the .tgz file to the destination directory
for /f "delims=" %%a in ('dir /b *.tgz') do set "result=%%a"
copy *.tgz "%destinationDirectory%"

echo "tgz file copied to destination directory"

:: Change to the specified destination directory
cd /d "%destinationDirectory%"

echo "changed to destination directory" 

:: delete dist directory
rmdir /s /q dist

echo "remove dist directory"

::run yarn remove @microsoft/omnichannel-chat-sdk
:: for /f "delims=" %%a in ('yarn remove @microsoft/omnichannel-chat-widget') do set "result=%%a"

echo "remove @microsoft/omnichannel-chat-widget"

:: identify the name of the tgz file an save it in a variable
for /f "delims=" %%a in ('dir /b *.tgz') do set "result=%%a"

:: use the name of the tgz file to install the package
for /f "delims=" %%a in ('yarn add .\\%result%') do set "result=%%a"

echo "install the package"

:: run yarn build:webpack
for /f "delims=" %%a in ('yarn build:webpack') do set "result=%%a"


echo "build:webpack is done"

:: return to oriiinal directory
echo "%sourceDirectory%"

echo "done"


endlocal
