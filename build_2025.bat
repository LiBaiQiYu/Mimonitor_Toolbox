@echo off
"C:\Users\62507\AppData\Local\Programs\Python\Python311\python.exe" -m PyInstaller --onefile --windowed --name "MonitorToolbox" --icon=icon.ico --hidden-import qfluentwidgets --add-binary "adb.exe;." --add-binary "AdbWinApi.dll;." --add-binary "AdbWinUsbApi.dll;." --add-binary "MtkDirectTool.jar;." monitor_controller.py
echo Done! Check dist\MonitorToolbox.exe
pause