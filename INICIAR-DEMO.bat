@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ==============================================
echo   BEAUTY TECH - PROTOTIPO DE RETAIL INTELIGENTE
echo ==============================================
echo.
where py >nul 2>&1
if %errorlevel%==0 goto PY_LAUNCH
where python >nul 2>&1
if %errorlevel%==0 goto PYTHON_LAUNCH

echo No se ha encontrado Python 3.10 o posterior.
echo Instala Python 3 desde https://www.python.org/downloads/
echo y marca la opcion para anadir Python al PATH.
pause
exit /b 1

:PY_LAUNCH
echo Iniciando servidor local con Python...
py "%~dp0iniciar_demo.py"
goto END

:PYTHON_LAUNCH
echo Iniciando servidor local con Python...
python "%~dp0iniciar_demo.py"
endlocal
