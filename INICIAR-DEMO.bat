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
where php >nul 2>&1
if %errorlevel%==0 goto PHP_LAUNCH

echo No se ha encontrado Python ni PHP.
echo Instala Python 3 desde https://www.python.org/downloads/
echo y marca la opcion para anadir Python al PATH.
echo Tambien puedes ejecutar el proyecto desde XAMPP con PHP.
pause
exit /b 1

:PY_LAUNCH
echo Iniciando servidor local con Python...
py "%~dp0iniciar_demo.py"
goto END

:PYTHON_LAUNCH
echo Iniciando servidor local con Python...
python "%~dp0iniciar_demo.py"
goto END

:PHP_LAUNCH
echo Python no encontrado. Usando PHP en el puerto 8000...
echo Si el puerto esta ocupado, cierra el servidor anterior y vuelve a intentarlo.
start "Beauty Tech - servidor local" /D "%~dp0" cmd /k "php -S 127.0.0.1:8000"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000/
echo No cierres la ventana del servidor mientras uses la demo.
:END
endlocal
