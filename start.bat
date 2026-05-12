@echo off
REM Easy Essay — student launcher (Windows).
REM Starts a local web server on port 8000 and opens the app.

cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%

echo --------------------------------------------
echo  Easy Essay - serving on %URL%
echo  (Close this window to stop the server.)
echo --------------------------------------------

start "" "%URL%"

REM Prefer py launcher, fall back to python.
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 -m http.server %PORT%
  exit /b
)
where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python -m http.server %PORT%
  exit /b
)

echo.
echo ERROR: Python is not installed.
echo Install Python 3 from https://www.python.org/downloads/
pause
