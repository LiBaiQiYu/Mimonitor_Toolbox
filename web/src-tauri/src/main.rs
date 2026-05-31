#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::net::TcpStream;
use std::process::Command;
use std::time::Duration as StdDuration;
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::Manager;
use tokio::time::{sleep, Duration};

static mut CURRENT_IP: Option<String> = None;

// Embedded adb binaries - platform specific
#[cfg(target_os = "windows")]
const EMBEDDED_ADB: &[u8] = include_bytes!("../bin/adb.exe");
#[cfg(target_os = "windows")]
const EMBEDDED_ADB_WIN_API: &[u8] = include_bytes!("../bin/AdbWinApi.dll");
#[cfg(target_os = "windows")]
const EMBEDDED_ADB_WIN_USB: &[u8] = include_bytes!("../bin/AdbWinUsbApi.dll");

#[cfg(target_os = "macos")]
const EMBEDDED_ADB: &[u8] = include_bytes!("../bin/adb");

#[cfg(target_os = "linux")]
const EMBEDDED_ADB: &[u8] = include_bytes!("../bin/adb");

// Cached adb path - resolved once on first use
static ADB_PATH: once_cell::sync::Lazy<String> = once_cell::sync::Lazy::new(|| {
    let exe_name = if cfg!(target_os = "windows") { "adb.exe" } else { "adb" };
    let mut search_paths: Vec<std::path::PathBuf> = Vec::new();

    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            search_paths.push(parent.join(exe_name));
            search_paths.push(parent.join("bin").join(exe_name));
            search_paths.push(parent.join("resources").join(exe_name));
            search_paths.push(parent.join("resources").join("bin").join(exe_name));
            if let Some(grandparent) = parent.parent() {
                search_paths.push(grandparent.join("bin").join(exe_name));
                search_paths.push(grandparent.join("resources").join(exe_name));
                search_paths.push(grandparent.join("resources").join("bin").join(exe_name));
            }
        }
    }

    // macOS .app bundle path
    #[cfg(target_os = "macos")]
    if let Ok(exe) = std::env::current_exe() {
        if let Some(app_bundle) = exe.ancestors().find(|p| p.extension().map_or(false, |e| e == "app")) {
            search_paths.push(app_bundle.join("Contents/Resources/bin").join(exe_name));
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        search_paths.push(cwd.join(exe_name));
        search_paths.push(cwd.join("../../").join(exe_name));
    }

    // Check external paths first
    for path in &search_paths {
        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }

    // Fallback: extract embedded adb (portable mode)
    let dir = std::env::temp_dir().join("monitor-toolbox-adb");
    std::fs::create_dir_all(&dir).ok();
    let adb_path = dir.join(exe_name);
    if !adb_path.exists() || std::fs::metadata(&adb_path).map(|m| m.len()).unwrap_or(0) != EMBEDDED_ADB.len() as u64 {
        std::fs::write(&adb_path, EMBEDDED_ADB).ok();
        #[cfg(target_os = "windows")]
        {
            std::fs::write(dir.join("AdbWinApi.dll"), EMBEDDED_ADB_WIN_API).ok();
            std::fs::write(dir.join("AdbWinUsbApi.dll"), EMBEDDED_ADB_WIN_USB).ok();
        }
        // Make executable on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&adb_path, std::fs::Permissions::from_mode(0o755)).ok();
        }
    }
    if adb_path.exists() {
        return adb_path.to_string_lossy().to_string();
    }

    exe_name.to_string()
});

fn get_adb_path() -> &'static str {
    &ADB_PATH
}

fn adb_cmd(args: &[&str]) -> Result<String, String> {
    let adb = get_adb_path();
    let mut cmd = Command::new(&adb);
    cmd.args(args);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let output = cmd.output().map_err(|e| e.to_string())?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    if !output.status.success() {
        return Err(stdout);
    }
    Ok(stdout.trim().to_string())
}

fn adb_shell_cmd(ip: &str, cmd: &str) -> Result<String, String> {
    adb_cmd(&["-s", &format!("{}:5555", ip), "shell", cmd])
}

#[derive(Debug, Serialize, Deserialize)]
struct ConnectResult {
    success: bool,
    output: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct StatusResult {
    connected: bool,
    ip: Option<String>,
    model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SettingResult {
    key: String,
    value: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct JniResult {
    key: String,
    value: String,
}

#[tauri::command]
fn connect(ip: String) -> Result<ConnectResult, String> {
    unsafe {
        let out = adb_cmd(&["connect", &format!("{}:5555", ip)])?;
        let success = out.to_lowercase().contains("connected");
        if success {
            CURRENT_IP = Some(ip);
        }
        Ok(ConnectResult { success, output: out })
    }
}

#[tauri::command]
fn disconnect() -> Result<ConnectResult, String> {
    unsafe {
        if let Some(ref ip) = CURRENT_IP {
            let out = adb_cmd(&["disconnect", &format!("{}:5555", ip)])?;
            CURRENT_IP = None;
            Ok(ConnectResult { success: true, output: out })
        } else {
            Ok(ConnectResult { success: true, output: "already disconnected".to_string() })
        }
    }
}

#[tauri::command]
fn get_status() -> Result<StatusResult, String> {
    unsafe {
        let ip = CURRENT_IP.clone();
        if let Some(ref ip) = ip {
            let out = adb_shell_cmd(ip, "echo connected");
            let connected = out.as_ref().map(|s| s.trim() == "connected").unwrap_or(false);
            let model = if connected {
                adb_shell_cmd(ip, "getprop ro.product.model").ok()
            } else {
                None
            };
            Ok(StatusResult { connected, ip: Some(ip.clone()), model })
        } else {
            Ok(StatusResult { connected: false, ip: None, model: None })
        }
    }
}

#[tauri::command]
fn get_setting(key: String) -> Result<SettingResult, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        let value = adb_shell_cmd(ip, &format!("settings get global {}", key))?;
        Ok(SettingResult { key, value })
    }
}

#[tauri::command]
fn put_setting(key: String, value: String) -> Result<bool, String> {
    eprintln!("put_setting called: key={}, value={}", key, value);
    unsafe {
        let ip = match CURRENT_IP.as_ref() {
            Some(ip) => ip,
            None => {
                eprintln!("put_setting: not connected!");
                return Err("not connected".to_string());
            }
        };
        let value_str = value.to_string();
        let cmd = format!("settings put global {} {}", key, value_str);
        eprintln!("put_setting: executing: {}", cmd);
        let result = adb_shell_cmd(ip, &cmd)?;
        eprintln!("put_setting result: {}", result);
        Ok(true)
    }
}

#[tauri::command]
async fn jni_get(key: String) -> Result<JniResult, String> {
    let key_clone = key.clone();
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        let jar = "/data/data/mitv.service/cache/MtkDirectTool.jar";

        adb_shell_cmd(ip, "logcat -c")?;

        let sh_cmd = format!(
            "eval\\${{IFS}}CLASSPATH={}\\${{IFS}}/system/bin/app_process\\${{IFS}}/data/data/mitv.service/cache\\${{IFS}}MtkDirectTool\\${{IFS}}get\\${{IFS}}{}",
            jar, key
        );
        adb_shell_cmd(ip, &format!("service call TvService 3 s16 \"sh -c {}\"", sh_cmd))?;

        sleep(Duration::from_millis(800)).await;

        let log = adb_shell_cmd(ip, &format!("logcat -d | grep 'GET {}' | tail -1", key))?;
        let value = if let Some(pos) = log.find("= ") {
            log[pos + 2..].trim().to_string()
        } else {
            "N/A".to_string()
        };

        Ok(JniResult { key: key_clone, value })
    }
}

#[tauri::command]
async fn jni_set(key: String, value: String, upd: Option<u32>) -> Result<bool, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        let jar = "/data/data/mitv.service/cache/MtkDirectTool.jar";
        let upd_val = upd.unwrap_or(3);

        let sh_cmd = format!(
            "eval\\${{IFS}}CLASSPATH={}\\${{IFS}}/system/bin/app_process\\${{IFS}}/data/data/mitv.service/cache\\${{IFS}}MtkDirectTool\\${{IFS}}set\\${{IFS}}{}\\${{IFS}}{}\\${{IFS}}{}",
            jar, key, value, upd_val
        );
        adb_shell_cmd(ip, &format!("service call TvService 3 s16 \"sh -c {}\"", sh_cmd))?;
        Ok(true)
    }
}

#[tauri::command]
async fn refresh_pq() -> Result<bool, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        // Wait a bit for settings to take effect
        sleep(Duration::from_millis(200)).await;
        let result = adb_shell_cmd(ip, "am broadcast -a com.xiaomi.mitv.action.PIC_MODE_CHANGED --ei picmode 7")?;
        eprintln!("refresh_pq result: {}", result);
        Ok(true)
    }
}

#[tauri::command]
fn get_resolution() -> Result<String, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        adb_shell_cmd(ip, "wm size")
    }
}

#[tauri::command]
fn set_resolution(width: u32, height: u32, dpi: Option<u32>) -> Result<bool, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        adb_shell_cmd(ip, &format!("wm size {}x{}", width, height))?;
        if let Some(d) = dpi {
            adb_shell_cmd(ip, &format!("wm density {}", d))?;
        }
        Ok(true)
    }
}

#[tauri::command]
fn reboot() -> Result<bool, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        adb_shell_cmd(ip, "reboot")?;
        Ok(true)
    }
}

#[tauri::command]
fn shell_exec(cmd: String) -> Result<String, String> {
    unsafe {
        let ip = CURRENT_IP.as_ref().ok_or("not connected")?;
        adb_shell_cmd(ip, &cmd)
    }
}

#[tauri::command]
async fn scan_devices() -> Result<Vec<String>, String> {
    // Get local IP to determine subnet
    let local_ip = local_ip_address::local_ip()
        .map_err(|e| format!("Failed to get local IP: {}", e))?;
    let ip_str = local_ip.to_string();
    let parts: Vec<&str> = ip_str.split('.').collect();
    if parts.len() != 4 {
        return Err("Invalid IP format".to_string());
    }
    let subnet = format!("{}.{}.{}", parts[0], parts[1], parts[2]);

    let mut found = Vec::new();
    let mut handles = Vec::new();

    // Scan subnet for ADB port (5555)
    for i in 0..=254 {
        let ip = format!("{}.{}", subnet, i);
        handles.push(tokio::task::spawn_blocking(move || {
            let addr = format!("{}:5555", ip);
            if TcpStream::connect_timeout(
                &addr.parse().unwrap(),
                StdDuration::from_millis(200),
            ).is_ok() {
                Some(ip)
            } else {
                None
            }
        }));
    }

    for handle in handles {
        if let Ok(Some(ip)) = handle.await {
            found.push(ip);
        }
    }

    Ok(found)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Create system tray menu
            let menu = tauri::menu::Menu::new(app)?;
            let show = tauri::menu::MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide = tauri::menu::MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
            let sep = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit = tauri::menu::MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            menu.append(&show)?;
            menu.append(&hide)?;
            menu.append(&sep)?;
            menu.append(&quit)?;

            let app_handle = app.handle().clone();
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("红米 G Pro 27U Toolbox")
                .on_menu_event({
                    let handle = app_handle.clone();
                    move |_app, event| {
                        let id = event.id().0.as_str();
                        match id {
                            "show" => {
                                if let Some(window) = handle.get_webview_window("main") {
                                    window.show().ok();
                                    window.set_focus().ok();
                                }
                            }
                            "hide" => {
                                if let Some(window) = handle.get_webview_window("main") {
                                    window.hide().ok();
                                }
                            }
                            "quit" => {
                                handle.exit(0);
                            }
                            _ => {}
                        }
                    }
                })
                .on_tray_icon_event({
                    let handle = app_handle.clone();
                    move |_tray, event| {
                        if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                            if let Some(window) = handle.get_webview_window("main") {
                                window.show().ok();
                                window.set_focus().ok();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            get_status,
            get_setting,
            put_setting,
            jni_get,
            jni_set,
            refresh_pq,
            get_resolution,
            set_resolution,
            reboot,
            shell_exec,
            scan_devices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
