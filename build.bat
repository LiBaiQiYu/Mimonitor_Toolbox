@echo off
pip install pyinstaller ttkbootstrap
pyinstaller --onefile --windowed --name "MonitorToolbox" --icon=icon.ico --hidden-import ttkbootstrap --add-binary "adb.exe;." --add-binary "AdbWinApi.dll;." --add-binary "AdbWinUsbApi.dll;." --add-binary "MtkDirectTool.jar;." monitor_controller.py
echo Done! Check dist\MonitorToolbox.exe
pause
